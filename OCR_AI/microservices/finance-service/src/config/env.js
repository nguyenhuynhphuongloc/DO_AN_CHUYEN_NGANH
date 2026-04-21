import { loadFinanceEnv } from "./loadEnv.js";

export function getFinanceConfig(env = process.env) {
  loadFinanceEnv();

  return {
    host: env.HOST || "127.0.0.1",
    port: Number(env.PORT || "5003"),
    databaseUrl: env.FINANCE_DATABASE_URL || "",
    autoMigrate: String(env.FINANCE_AUTO_MIGRATE || "true").toLowerCase() === "true"
  };
}
