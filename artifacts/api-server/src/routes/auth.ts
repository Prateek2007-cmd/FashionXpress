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
  const { name, email, password, phone, pincode, address } = parsed.data;

  const normalizedEmail = email.trim().toLowerCase();
  const cleanPhoneDigits = phone ? phone.replace(/\D/g, "") : "";

  // Check existing by email
  const [existingEmailUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (existingEmailUser && !existingEmailUser.email.includes("@guest.fashion-xpress.com")) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }

  // Check existing by phone
  let existingPhoneUser = null;
  if (cleanPhoneDigits.length >= 10) {
    const [found] = await db
      .select()
      .from(usersTable)
      .where(sql`regexp_replace(${usersTable.phone}, '[^0-9]', '', 'g') LIKE ${'%' + cleanPhoneDigits.slice(-10)}`);
    if (found && !found.email.includes("@guest.fashion-xpress.com") && found.id !== existingEmailUser?.id) {
      res.status(400).json({ error: "An account with this phone number already exists" });
      return;
    }
    existingPhoneUser = found;
  }

  const passwordHash = await hashPassword(password);
  const targetGuestUser = (existingEmailUser?.email.includes("@guest.fashion-xpress.com") ? existingEmailUser : null) ||
    (existingPhoneUser?.email.includes("@guest.fashion-xpress.com") ? existingPhoneUser : null);

  let user;
  if (targetGuestUser) {
    // Upgrade existing guest user to registered account
    const [updated] = await db
      .update(usersTable)
      .set({
        name,
        email: normalizedEmail,
        phone: phone ? phone.trim() : targetGuestUser.phone,
        passwordHash,
        role: "customer",
      })
      .where(eq(usersTable.id, targetGuestUser.id))
      .returning();
    user = updated;
  } else {
    // Insert new user
    const [inserted] = await db
      .insert(usersTable)
      .values({
        name,
        email: normalizedEmail,
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: "customer",
        pincode: pincode?.trim() || null,
        address: address?.trim() || null,
      })
      .returning();
    user = inserted;

    if (user) {
      const [existingCust] = await db.select().from(customersTable).where(eq(customersTable.userId, user.id));
      if (!existingCust) {
        await db.insert(customersTable).values({ userId: user.id });
      }
    }
  }

  if (!user) {
    res.status(500).json({ error: "Failed to create account" });
    return;
  }

  const token = signToken({ userId: user.id, role: "customer" });
  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      pincode: (user as any).pincode ?? null,
      address: (user as any).address ?? null,
      createdAt: user.createdAt,
    },
  });
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

  const candidates = await db
    .select()
    .from(usersTable)
    .where(or(...conditions));

  if (!candidates.length) {
    res.status(401).json({ error: "Invalid email/phone or password" });
    return;
  }

  // Sort candidate users so real registered accounts come before guest accounts
  candidates.sort((a, b) => {
    const aIsGuest = a.email.includes("@guest.fashion-xpress.com");
    const bIsGuest = b.email.includes("@guest.fashion-xpress.com");
    if (aIsGuest && !bIsGuest) return 1;
    if (!aIsGuest && bIsGuest) return -1;
    return b.id - a.id;
  });

  let user = null;
  for (const candidate of candidates) {
    if (await comparePassword(password, candidate.passwordHash)) {
      user = candidate;
      break;
    }
  }

  if (!user) {
    res.status(401).json({ error: "Invalid email/phone or password" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role as "customer" | "admin" | "executive" | "merchant" });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      pincode: (user as any).pincode ?? null,
      address: (user as any).address ?? null,
      createdAt: user.createdAt,
    },
  });
});

router.post("/auth/reset-password", async (req: Request, res: Response): Promise<void> => {
  const { emailOrPhone, newPassword } = req.body;
  if (!emailOrPhone || !newPassword) {
    res.status(400).json({ error: "Email/phone and new password are required" });
    return;
  }
  const input = String(emailOrPhone).trim().toLowerCase();
  const rawInput = String(emailOrPhone).trim();
  const digits = rawInput.replace(/\D/g, "");

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

  const candidates = await db
    .select()
    .from(usersTable)
    .where(or(...conditions));

  if (!candidates.length) {
    res.status(404).json({ error: "No account found with this email or mobile number" });
    return;
  }

  // Sort candidate users so real registered accounts come before guest accounts
  candidates.sort((a, b) => {
    const aIsGuest = a.email.includes("@guest.fashion-xpress.com");
    const bIsGuest = b.email.includes("@guest.fashion-xpress.com");
    if (aIsGuest && !bIsGuest) return 1;
    if (!aIsGuest && bIsGuest) return -1;
    return b.id - a.id;
  });

  const user = candidates[0];
  const passwordHash = await hashPassword(newPassword.trim());

  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, user.id));

  const token = signToken({ userId: user.id, role: user.role as "customer" | "admin" | "executive" | "merchant" });
  res.json({
    message: "Password reset successful",
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      pincode: (user as any).pincode ?? null,
      address: (user as any).address ?? null,
      createdAt: user.createdAt,
    },
  });
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

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      pincode: (user as any).pincode ?? null,
      address: (user as any).address ?? null,
      createdAt: user.createdAt,
    });
  },
);

// ── Update profile (name, phone, pincode, address) ───────────────────────────
router.put(
  "/auth/profile",
  requireAuth(),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.auth!.userId;
      const { name, phone, pincode, address } = req.body;
      const update: any = {};
      if (name) update.name = name.trim();
      if (phone !== undefined) update.phone = phone ? phone.trim() : null;
      if (pincode !== undefined) update.pincode = pincode ? pincode.trim() : null;
      if (address !== undefined) update.address = address ? address.trim() : null;

      const [updated] = await db
        .update(usersTable)
        .set(update)
        .where(eq(usersTable.id, userId))
        .returning();

      res.json({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        role: updated.role,
        pincode: (updated as any).pincode ?? null,
        address: (updated as any).address ?? null,
        createdAt: updated.createdAt,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
