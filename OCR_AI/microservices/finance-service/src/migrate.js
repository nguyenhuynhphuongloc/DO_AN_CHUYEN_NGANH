import { getFinanceConfig } from "./config/env.js";
import { createFinancePool } from "./db/pool.js";
import { runFinanceMigrations } from "./db/migrate.js";

async function main() {
  const config = getFinanceConfig();

  if (!config.databaseUrl) {
    throw new Error("FINANCE_DATABASE_URL is required.");
  }

  const pool = createFinancePool(config.databaseUrl);

  try {
    await runFinanceMigrations(pool);
    console.log("finance-service migrations applied");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
