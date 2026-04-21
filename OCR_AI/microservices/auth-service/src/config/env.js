import { loadAuthEnv } from "./loadEnv.js";

export function getAuthConfig(env = process.env) {
  loadAuthEnv();

  return {
    host: env.HOST || "127.0.0.1",
    port: Number(env.PORT || "5002"),
    databaseUrl: env.AUTH_DATABASE_URL || "",
    autoMigrate: String(env.AUTH_AUTO_MIGRATE || "true").toLowerCase() === "true",
    jwtSecret: env.AUTH_JWT_SECRET || "",
    refreshTokenSecret: env.AUTH_REFRESH_TOKEN_SECRET || "",
    accessTokenTtl: env.AUTH_ACCESS_TOKEN_TTL || "15m",
    refreshTokenTtl: env.AUTH_REFRESH_TOKEN_TTL || "30d"
  };
}
