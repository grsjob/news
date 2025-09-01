import { colorizedConsole } from "../helpers/console";

import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const healthCheck = async () => {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    colorizedConsole.accept("✅  Health check: Database CONNECTED");
    return true;
  } catch (error) {
    colorizedConsole.err("❌ Health check: Database FAILED!!!");
    console.error(error);
    return false;
  }
};
