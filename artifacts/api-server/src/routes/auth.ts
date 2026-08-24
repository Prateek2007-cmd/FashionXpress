import { Router, type IRouter, type Request, type Response } from "express";
import { eq, or, sql } from "drizzle-orm";
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

  const [existingEmail] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()));
  if (existingEmail) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }

  if (phone) {
    const cleanPhoneDigits = phone.replace(/\D/g, "");
    if (cleanPhoneDigits.length >= 10) {
      const [existingPhone] = await db
        .select()
        .from(usersTable)
        .where(sql`regexp_replace(${usersTable.phone}, '[^0-9]', '', 'g') LIKE ${'%' + cleanPhoneDigits.slice(-10)}`);
      if (existingPhone) {
        res.status(400).json({ error: "An account with this phone number already exists" });
        return;
      }
    }
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: email.toLowerCase(),
      phone: phone ? phone.trim() : null,
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
  const input = parsed.data.email.trim().toLowerCase();
  const rawInput = parsed.data.email.trim();
  const digits = rawInput.replace(/\D/g, "");
  const password = parsed.data.password.trim();

  // Search by either email OR mobile phone number (flexible digit matching)
  const conditions = [
    eq(usersTable.email, input),
    eq(usersTable.phone, rawInput)
  ];

  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    conditions.push(
      sql`regexp_replace(${usersTable.phone}, '[^0-9]', '', 'g') LIKE ${'%' + last10}`
    );
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(or(...conditions));

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email/phone or password" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role as "customer" | "admin" | "executive" | "merchant" });
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
