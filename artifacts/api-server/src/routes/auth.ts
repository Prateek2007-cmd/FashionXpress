import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, customersTable } from "@workspace/db";
import {
  RegisterCustomerBody,
  RegisterCustomerResponse,
  LoginBody,
  LoginResponse,
  GetCurrentUserResponse,
} from "@workspace/api-zod";
import { comparePassword, hashPassword, signToken } from "../lib/auth";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, phone } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: "customer",
    })
    .returning();

  if (!user) {
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  await db.insert(customersTable).values({ userId: user.id });

  const token = signToken({ userId: user.id, role: "customer" });
  res.status(201).json(
    RegisterCustomerResponse.parse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    }),
  );
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role as "customer" | "admin" | "executive" });
  res.json(
    LoginResponse.parse({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    }),
  );
});

router.get(
  "/auth/me",
  requireAuth(),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.auth!.userId));

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json(
      GetCurrentUserResponse.parse({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      }),
    );
  },
);

export default router;
