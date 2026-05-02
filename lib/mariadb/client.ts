import mysql, { type Pool } from "mysql2/promise";

const REQUIRED_ENV = [
  "MARIADB_HOST",
  "MARIADB_PORT",
  "MARIADB_USER",
  "MARIADB_PASSWORD",
  "MARIADB_DATABASE",
] as const;

function buildPool(): Pool {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  return mysql.createPool({
    host: process.env.MARIADB_HOST,
    port: Number(process.env.MARIADB_PORT),
    user: process.env.MARIADB_USER,
    password: process.env.MARIADB_PASSWORD,
    database: process.env.MARIADB_DATABASE,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    decimalNumbers: true,
    dateStrings: false,
    namedPlaceholders: false,
    enableKeepAlive: true,
  });
}

// Cache the pool on globalThis so Next.js dev hot-reload doesn't spin up a new
// pool on every code change.
const globalForCatalog = globalThis as unknown as { __catalogPool?: Pool };

export const catalogPool: Pool = globalForCatalog.__catalogPool ?? buildPool();

if (process.env.NODE_ENV !== "production") {
  globalForCatalog.__catalogPool = catalogPool;
}
