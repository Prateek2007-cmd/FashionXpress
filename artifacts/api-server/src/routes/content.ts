import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pageContentTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// Get content by key (public)
router.get(
  "/content/:key",
  async (req, res): Promise<void> => {
    const { key } = req.params;
    
    const [content] = await db
      .select()
      .from(pageContentTable)
      .where(eq(pageContentTable.pageKey, key));

    if (!content) {
      res.status(404).json({ error: "Content not found" });
      return;
    }

    res.json(content);
  }
);

// Update or create content by key (admin only)
router.put(
  "/content/:key",
  requireAuth("admin"),
  async (req: AuthedRequest, res): Promise<void> => {
    const { key } = req.params;
    const { title, description, imageUrl } = req.body;

    const [existing] = await db
      .select()
      .from(pageContentTable)
      .where(eq(pageContentTable.pageKey, key));

    let content;
    if (existing) {
      [content] = await db
        .update(pageContentTable)
        .set({ title, description, imageUrl, updatedAt: new Date() })
        .where(eq(pageContentTable.pageKey, key))
        .returning();
    } else {
      [content] = await db
        .insert(pageContentTable)
        .values({ pageKey: key, title, description, imageUrl })
        .returning();
    }

    res.json(content);
  }
);

export default router;
