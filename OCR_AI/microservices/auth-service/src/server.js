import { getAuthConfig } from "./config/env.js";
import { createAuthPool } from "./db/pool.js";
import { runAuthMigrations } from "./db/migrate.js";
import { createAuthRepository } from "./repositories/authRepository.js";
import { createTokenService } from "./services/tokenService.js";
import { createAuthApp } from "./app.js";

async function main() {
  const config = getAuthConfig();

  if (!config.databaseUrl) {
    throw new Error("AUTH_DATABASE_URL is required.");
  }

  if (!config.jwtSecret || !config.refreshTokenSecret) {
    throw new Error("AUTH_JWT_SECRET and AUTH_REFRESH_TOKEN_SECRET are required.");
  }

  const pool = createAuthPool(config.databaseUrl);

  if (config.autoMigrate) {
    await runAuthMigrations(pool);
  }

  const repository = createAuthRepository(pool);
  const tokenService = createTokenService(config);
  const app = createAuthApp({ repository, tokenService });

  app.listen(config.port, config.host, () => {
    console.log(`auth-service listening on http://${config.host}:${config.port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
