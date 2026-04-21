import { Pool } from "pg";

export function createAuthPool(databaseUrl) {
  return new Pool({ connectionString: databaseUrl });
}

export async function withTransaction(pool, callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
