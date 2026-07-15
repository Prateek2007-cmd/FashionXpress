import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, partnerRequestsTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// Submit a new partner request
router.post(
  "/partners",
  async (req, res): Promise<void> => {
    const { shopName, productsSold } = req.body;
    if (!shopName || !productsSold) {
      res.status(400).json({ error: "shopName and productsSold are required" });
      return;
    }

    const [request] = await db
      .insert(partnerRequestsTable)
      .values({ shopName, productsSold })
      .returning();

    res.status(201).json(request);
  }
);

// List all partner requests (admin only)
router.get(
  "/partners",
  requireAuth("admin"),
  async (req: AuthedRequest, res): Promise<void> => {
    const requests = await db
      .select()
      .from(partnerRequestsTable)
      .orderBy(desc(partnerRequestsTable.createdAt));
    res.json(requests);
  }
);

// Update a partner request status (admin only)
router.patch(
  "/partners/:id",
  requireAuth("admin"),
  async (req: AuthedRequest, res): Promise<void> => {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    const [request] = await db
      .update(partnerRequestsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(partnerRequestsTable.id, Number(id)))
      .returning();

    if (!request) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    res.json(request);
  }
);

export default router;
