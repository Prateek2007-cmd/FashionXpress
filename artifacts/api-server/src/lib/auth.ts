import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request } from "express";

const JWT_SECRET = process.env.SESSION_SECRET;

if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET must be set to sign auth tokens.");
}

export type Role = "customer" | "admin" | "executive";

export interface TokenPayload {
  userId: number;
  role: Role;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as TokenPayload;
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
}

export function generateBookingCode(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FX-${Date.now().toString().slice(-6)}${random}`;
}

export function generateInvoiceNumber(): string {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INV-${Date.now().toString().slice(-8)}${random}`;
}
