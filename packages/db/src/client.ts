import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, types } from "pg";

import * as relations from "./relations";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://seen:seen@localhost:5432/seen";

types.setTypeParser(types.builtins.INT8, (value) => Number(value));
types.setTypeParser(types.builtins.NUMERIC, (value) => Number(value));

export const pool = new Pool({
  connectionString,
  max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
});

export const db = drizzle(pool, {
  schema: { ...schema, ...relations },
  casing: "snake_case",
});

export type SeenDb = typeof db;
