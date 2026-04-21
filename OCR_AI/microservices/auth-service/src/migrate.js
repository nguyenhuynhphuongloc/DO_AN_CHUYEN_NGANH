import { getAuthConfig } from "./config/env.js";
import { createAuthPool } from "./db/pool.js";
import { runAuthMigrations } from "./db/migrate.js";

async function main() {
  const config = getAuthConfig();

  if (!config.databaseUrl) {
    throw new Error("AUTH_DATABASE_URL is required.");
  }

  const pool = createAuthPool(config.databaseUrl);

  try {
    await runAuthMigrations(pool);
    console.log("auth-service migrations applied");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
