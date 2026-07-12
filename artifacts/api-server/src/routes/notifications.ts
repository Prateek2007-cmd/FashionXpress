import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListMyNotificationsResponse,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get(
  "/notifications/me",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.auth!.userId))
      .orderBy(desc(notificationsTable.createdAt));
    res.json(ListMyNotificationsResponse.parse(rows));
  },
);

router.patch(
  "/notifications/:id/read",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const [notification] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationsTable.id, id),
          eq(notificationsTable.userId, req.auth!.userId),
        ),
      )
      .returning();

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(MarkNotificationReadResponse.parse(notification));
  },
);

export default router;
