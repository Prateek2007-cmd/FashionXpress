import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/**
 * Admin-managed list of pincodes where service is available.
 * Admin can enable/disable each pincode from the Admin Panel.
 */
export const serviceablePincodesTable = pgTable("serviceable_pincodes", {
  id: serial("id").primaryKey(),
  pincode: text("pincode").notNull().unique(),
  area: text("area").notNull(),       // e.g. "Adilabad Main"
  city: text("city").notNull(),       // e.g. "Adilabad"
  state: text("state").notNull(),     // e.g. "Telangana"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertServiceablePincodeSchema = createInsertSchema(serviceablePincodesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertServiceablePincode = z.infer<typeof insertServiceablePincodeSchema>;
export type ServiceablePincode = typeof serviceablePincodesTable.$inferSelect;

/**
 * Merchant service areas — which pincodes each merchant can serve.
 * Merchant selects from admin-approved active pincodes.
 */
export const merchantPincodesTable = pgTable("merchant_pincodes", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  pincode: text("pincode").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMerchantPincodeSchema = createInsertSchema(merchantPincodesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertMerchantPincode = z.infer<typeof insertMerchantPincodeSchema>;
export type MerchantPincode = typeof merchantPincodesTable.$inferSelect;
