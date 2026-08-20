import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./lib/db/src/schema/shopping.js"; // Wait, I can just use raw sql

async function check() {
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'cart_items'`;
  console.log(result);
}
check().catch(console.error);
