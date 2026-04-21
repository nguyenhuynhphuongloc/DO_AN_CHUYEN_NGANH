import { getFinanceConfig } from "./config/env.js";
import { createFinancePool } from "./db/pool.js";
import { runFinanceMigrations } from "./db/migrate.js";
import { createFinanceRepository } from "./repositories/financeRepository.js";
import { createFinanceApp } from "./app.js";

async function main() {
  const config = getFinanceConfig();

  if (!config.databaseUrl) {
    throw new Error("FINANCE_DATABASE_URL is required.");
  }

  const pool = createFinancePool(config.databaseUrl);

  if (config.autoMigrate) {
    await runFinanceMigrations(pool);
  }

  const repository = createFinanceRepository(pool);
  const app = createFinanceApp({ repository });

  app.listen(config.port, config.host, () => {
    console.log(`finance-service listening on http://${config.host}:${config.port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
