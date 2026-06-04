import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { pool } from "../src/client";

const migrationsDir = join(import.meta.dir, "..", "drizzle");

await pool.query(`
  create table if not exists public.schema_migrations (
    id bigserial primary key,
    name text not null unique,
    applied_at timestamptz not null default now()
  )
`);

const files = (await readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of files) {
  const applied = await pool.query(
    "select 1 from public.schema_migrations where name = $1",
    [file],
  );

  if (applied.rowCount) {
    console.log(`Skipping ${file}`);
    continue;
  }

  console.log(`Applying ${file}`);
  const sql = await readFile(join(migrationsDir, file), "utf8");
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public.schema_migrations (name) values ($1)", [
      file,
    ]);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

await pool.end();
