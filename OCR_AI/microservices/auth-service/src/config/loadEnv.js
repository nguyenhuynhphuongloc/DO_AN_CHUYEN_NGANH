import { config as dotenvConfig } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const serviceRoot = resolve(currentDir, "..", "..");

let loaded = false;

export function loadAuthEnv() {
  if (loaded) {
    return;
  }

  dotenvConfig({ path: resolve(serviceRoot, ".env") });
  loaded = true;
}

export function getAuthServiceRoot() {
  return serviceRoot;
}
