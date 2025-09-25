/** @format */

import { colorizedConsole } from "../helpers/console";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
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
