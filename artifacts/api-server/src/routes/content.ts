import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, pageContentTable, type PageContentRow } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";

const router: IRouter = Router();

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

// Get content by key (public)
router.get(
  "/content/:key",
  async (req: Request, res: Response): Promise<void> => {
    const key = paramString(req.params.key);

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
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const key = paramString(req.params.key);
    const { title, description, imageUrl } = req.body;

    const [existing] = await db
      .select()
      .from(pageContentTable)
      .where(eq(pageContentTable.pageKey, key));

    let content: PageContentRow | undefined;
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
