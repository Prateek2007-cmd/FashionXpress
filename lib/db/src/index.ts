import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_mdR10ZUGrauD@ep-little-violet-aoq66t8e-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("sslmode=require") || connectionString.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
