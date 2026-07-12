import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  favoriteColors: text("favorite_colors").array().notNull().default([]),
  favoriteBrands: text("favorite_brands").array().notNull().default([]),
  lifetimeSpend: numeric("lifetime_spend", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;

export const addressesTable = pgTable("addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  landmark: text("landmark"),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  isDefault: text("is_default").notNull().default("false"),
});

export const insertAddressSchema = createInsertSchema(addressesTable).omit({
  id: true,
});
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addressesTable.$inferSelect;

export const measurementsTable = pgTable("measurements", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .unique()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  gender: text("gender"),
  age: integer("age"),
  heightCm: numeric("height_cm", { precision: 6, scale: 2 }),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  topSize: text("top_size"),
  bottomSize: text("bottom_size"),
  preferredFit: text("preferred_fit"),
});

export const insertMeasurementSchema = createInsertSchema(
  measurementsTable,
).omit({ id: true });
export type InsertMeasurement = z.infer<typeof insertMeasurementSchema>;
export type Measurement = typeof measurementsTable.$inferSelect;
