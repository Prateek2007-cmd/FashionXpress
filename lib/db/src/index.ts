import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const rawConnectionString =
      process.env.DATABASE_URL ||
      "postgresql://neondb_owner:npg_mdR10ZUGrauD@ep-little-violet-aoq66t8e-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

    const connectionString = rawConnectionString.replace(/[\?&]channel_binding=[^&]+/g, "");

    _pool = new Pool({
      connectionString,
      ssl: connectionString.includes("sslmode=require") || connectionString.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5,
      connectionTimeoutMillis: 5000,
    });
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  }
});

export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    if (!_pool) getDb();
    const value = (_pool as any)[prop];
    return typeof value === "function" ? value.bind(_pool) : value;
  }
});

export * from "./schema";
