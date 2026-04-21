import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { getAuthServiceRoot } from "../config/loadEnv.js";

export async function runAuthMigrations(pool) {
  const migrationsDir = resolve(getAuthServiceRoot(), "migrations");
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const sql = await readFile(resolve(migrationsDir, file), "utf8");
    await pool.query(sql);
  }
}
