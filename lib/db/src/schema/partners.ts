import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partnerRequestsTable = pgTable("partner_requests", {
  id: serial("id").primaryKey(),
  shopName: text("shop_name").notNull(),
  productsSold: text("products_sold").notNull(),
  status: text("status").notNull().default("pending"), // pending, reviewed, approved, rejected
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPartnerRequestSchema = createInsertSchema(partnerRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPartnerRequest = z.infer<typeof insertPartnerRequestSchema>;
export type PartnerRequestRow = typeof partnerRequestsTable.$inferSelect;
