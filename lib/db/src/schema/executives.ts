import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const executivesTable = pgTable("executives", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url"),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("4.8"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const insertExecutiveSchema = createInsertSchema(executivesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertExecutive = z.infer<typeof insertExecutiveSchema>;
export type Executive = typeof executivesTable.$inferSelect;
