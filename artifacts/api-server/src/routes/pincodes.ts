import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  serviceablePincodesTable,
  merchantPincodesTable,
} from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// ── Public: list all ACTIVE pincodes (for customer picker) ──────────────────
router.get("/pincodes", async (_req: Request, res: Response): Promise<void> => {
  try {
    const pincodes = await db
      .select()
      .from(serviceablePincodesTable)
      .where(eq(serviceablePincodesTable.isActive, true))
      .orderBy(serviceablePincodesTable.city, serviceablePincodesTable.area);
    res.json(pincodes);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Admin: list ALL pincodes (including inactive) ───────────────────────────
router.get(
  "/pincodes/all",
  requireAuth("admin"),
  async (_req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const pincodes = await db
        .select()
        .from(serviceablePincodesTable)
        .orderBy(serviceablePincodesTable.city, serviceablePincodesTable.area);
      res.json(pincodes);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ── Admin: create a new pincode ──────────────────────────────────────────────
router.post(
  "/pincodes",
  requireAuth("admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const { pincode, area, city, state } = req.body;
      if (!pincode || !area || !city || !state) {
        res.status(400).json({ error: "pincode, area, city, state are required" });
        return;
      }
      const [created] = await db
        .insert(serviceablePincodesTable)
        .values({ pincode: pincode.trim(), area: area.trim(), city: city.trim(), state: state.trim() })
        .returning();
      res.status(201).json(created);
    } catch (e: any) {
      if (e.message?.includes("unique")) {
        res.status(400).json({ error: "Pincode already exists" });
      } else {
        res.status(500).json({ error: e.message });
      }
    }
  }
);

// ── Admin: update a pincode (enable/disable or edit details) ─────────────────
router.put(
  "/pincodes/:id",
  requireAuth("admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!, 10);
      const { area, city, state, isActive } = req.body;
      const update: any = {};
      if (area !== undefined) update.area = area;
      if (city !== undefined) update.city = city;
      if (state !== undefined) update.state = state;
      if (isActive !== undefined) update.isActive = isActive;

      const [updated] = await db
        .update(serviceablePincodesTable)
        .set(update)
        .where(eq(serviceablePincodesTable.id, id))
        .returning();
      if (!updated) { res.status(404).json({ error: "Pincode not found" }); return; }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ── Admin: delete a pincode ──────────────────────────────────────────────────
router.delete(
  "/pincodes/:id",
  requireAuth("admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!, 10);
      await db.delete(serviceablePincodesTable).where(eq(serviceablePincodesTable.id, id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ── Merchant: get my serviceable pincodes ────────────────────────────────────
router.get(
  "/merchants/my-pincodes",
  requireAuth("merchant"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const merchantId = req.auth!.userId;
      const rows = await db
        .select()
        .from(merchantPincodesTable)
        .where(eq(merchantPincodesTable.merchantId, merchantId));
      res.json(rows.map((r) => r.pincode));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ── Merchant: set my serviceable pincodes (replace all) ──────────────────────
router.put(
  "/merchants/my-pincodes",
  requireAuth("merchant"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const merchantId = req.auth!.userId;
      const { pincodes }: { pincodes: string[] } = req.body;
      if (!Array.isArray(pincodes)) {
        res.status(400).json({ error: "pincodes must be an array of strings" });
        return;
      }
      // Replace all
      await db
        .delete(merchantPincodesTable)
        .where(eq(merchantPincodesTable.merchantId, merchantId));
      if (pincodes.length > 0) {
        await db.insert(merchantPincodesTable).values(
          pincodes.map((p) => ({ merchantId, pincode: p }))
        );
      }
      res.json({ success: true, pincodes });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
