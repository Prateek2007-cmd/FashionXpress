import type { NextFunction, Request, Response } from "express";
import { getBearerToken, verifyToken, type Role } from "../lib/auth";

export interface AuthedRequest extends Request {
  auth?: {
    userId: number;
    role: Role;
  };
}

export function requireAuth(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: "Missing authentication token" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    if (roles.length > 0 && !roles.includes(payload.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    req.auth = { userId: payload.userId, role: payload.role };
    next();
  };
}
