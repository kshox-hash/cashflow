import { Pool, PoolClient } from "pg";

type TxFn<T> = (client: PoolClient) => Promise<T>;

const isProduction = process.env.NODE_ENV === "production";

export default class DB {
  private static pool: Pool | null = null;

  static getPool(): Pool {
    if (!DB.pool) {
      DB.pool = new Pool({
        host: process.env.PGHOST,
        port: Number(process.env.PGPORT),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
      });

      DB.pool.on("error", (err) => {
        console.error("[db] Pool error:", err);
      });
    }

    return DB.pool;
  }

  static async testConnection(): Promise<void> {
    const pool = DB.getPool();
    const result = await pool.query("SELECT NOW() AS now");
    console.log("[db] Conectado a PostgreSQL:", result.rows[0].now);
  }

  static async withTransaction<T>(fn: TxFn<T>): Promise<T> {
    const pool = DB.getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // si rollback falla, re-lanzamos el error original
      }
      throw err;
    } finally {
      client.release();
    }
  }
}
