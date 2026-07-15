import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pageContentTable = pgTable("page_content", {
  id: serial("id").primaryKey(),
  pageKey: text("page_key").notNull().unique(), // e.g. "partner_with_us"
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPageContentSchema = createInsertSchema(pageContentTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;
export type PageContentRow = typeof pageContentTable.$inferSelect;
