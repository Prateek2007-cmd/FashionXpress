import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { customersTable } from "./customers";
import { usersTable } from "./users";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
});
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
});
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;

export const brandsTable = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
});
export const insertBrandSchema = createInsertSchema(brandsTable).omit({
  id: true,
});
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brandsTable.$inferSelect;

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  qrCode: text("qr_code"),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categoriesTable.id),
  brandId: integer("brand_id")
    .notNull()
    .references(() => brandsTable.id),
  color: text("color").notNull(),
  sizes: text("sizes").array().notNull().default([]),
  fabric: text("fabric").notNull(),
  occasion: text("occasion").notNull(),
  mrp: numeric("mrp", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull(),
  purchaseCost: numeric("purchase_cost", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  stock: integer("stock").notNull().default(0),
  warehouse: text("warehouse"),
  rack: text("rack"),
  images: text("images").array().notNull().default([]),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  merchantId: integer("merchant_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const insertReviewSchema = createInsertSchema(reviewsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
