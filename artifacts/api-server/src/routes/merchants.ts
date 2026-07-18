import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { hashPassword } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/merchants",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const merchants = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, "merchant"));

      res.json(
        merchants.map((m) => ({
          id: m.id,
          name: m.name,
          phone: m.phone,
          email: m.email,
          createdAt: m.createdAt,
        })),
      );
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

router.post(
  "/merchants",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, password } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

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
          role: "merchant",
        })
        .returning();

      res.status(201).json({
        id: user!.id,
        name: user!.name,
        phone: user!.phone,
        email: user!.email,
        createdAt: user!.createdAt,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

router.patch(
  "/merchants/:id",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { name, email, phone } = req.body;

      const [merchant] = await db
        .select()
        .from(usersTable)
        .where(and(eq(usersTable.id, id), eq(usersTable.role, "merchant")));

      if (!merchant) {
        res.status(404).json({ error: "Merchant not found" });
        return;
      }

      await db
        .update(usersTable)
        .set({
          ...(name && { name }),
          ...(email && { email: email.toLowerCase() }),
          ...(phone && { phone }),
        })
        .where(eq(usersTable.id, id));

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

router.delete(
  "/merchants/:id",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);

      const [merchant] = await db
        .select()
        .from(usersTable)
        .where(and(eq(usersTable.id, id), eq(usersTable.role, "merchant")));

      if (!merchant) {
        res.status(404).json({ error: "Merchant not found" });
        return;
      }

      await db.delete(usersTable).where(eq(usersTable.id, id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

export default router;
