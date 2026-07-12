import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { productsTable } from "./catalog";
import { executivesTable } from "./executives";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingCode: text("booking_code").notNull().unique(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  addressText: text("address_text").notNull(),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  gender: text("gender").notNull(),
  age: integer("age"),
  heightCm: numeric("height_cm", { precision: 6, scale: 2 }),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  topSize: text("top_size"),
  bottomSize: text("bottom_size"),
  preferredFit: text("preferred_fit"),
  budget: numeric("budget", { precision: 10, scale: 2 }),
  occasion: text("occasion"),
  preferredDate: text("preferred_date").notNull(),
  preferredTime: text("preferred_time").notNull(),
  preferredColors: text("preferred_colors").array().notNull().default([]),
  preferredBrands: text("preferred_brands").array().notNull().default([]),
  notes: text("notes"),
  status: text("status", {
    enum: [
      "pending",
      "confirmed",
      "rescheduled",
      "executive_assigned",
      "in_progress",
      "completed",
      "cancelled",
      "rejected",
    ],
  })
    .notNull()
    .default("pending"),
  executiveId: integer("executive_id").references(() => executivesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;

export const bookingProductsTable = pgTable("booking_products", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookingsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  status: text("status", {
    enum: ["reserved", "sold", "returned", "damaged"],
  })
    .notNull()
    .default("reserved"),
  priceAtSale: numeric("price_at_sale", { precision: 10, scale: 2 }),
  isRecommended: boolean("is_recommended").notNull().default(false),
});
export const insertBookingProductSchema = createInsertSchema(
  bookingProductsTable,
).omit({ id: true });
export type InsertBookingProduct = z.infer<typeof insertBookingProductSchema>;
export type BookingProduct = typeof bookingProductsTable.$inferSelect;

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .unique()
    .references(() => bookingsTable.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method", {
    enum: ["cash", "upi", "card", "wallet"],
  }).notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "paid"] })
    .notNull()
    .default("paid"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
