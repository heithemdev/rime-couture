// /packages/db/src/prisma.ts
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const isProd = process.env.NODE_ENV === "production";

function requiredEnv(name: string): string {
  const v = (process.env[name] ?? "").trim();
  if (!v) throw new Error(`[db] Missing required env: ${name}`);
  return v;
}

function intEnv(name: string, fallback: number): number {
  const raw = (process.env[name] ?? "").trim();
  const n = raw ? Number(raw) : fallback;
  return Number.isFinite(n) ? n : fallback;
}

function isLocal(url: string) {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

const globalForDb = globalThis as unknown as {
  __pgPool?: Pool;
  __prisma?: PrismaClient;
};

function makePgPool() {
  const connectionString = requiredEnv("DATABASE_URL");

  return new Pool({
    connectionString,
    // Free-tier protection: keep pool tiny (you have low traffic)
    max: intEnv("PG_POOL_MAX", 2),
    idleTimeoutMillis: intEnv("PG_POOL_IDLE_TIMEOUT_MS", 10_000),
    connectionTimeoutMillis: intEnv("PG_POOL_CONN_TIMEOUT_MS", 5_000),

    // Supabase is hosted: SSL required; local usually not
    ssl: isLocal(connectionString) ? undefined : { rejectUnauthorized: false },

    // Prevent runaway queries from eating free-tier resources
    options: `-c statement_timeout=${intEnv("PG_STATEMENT_TIMEOUT_MS", 8_000)}`,
  });
}

function makePrismaClient() {
  const pool = isProd
    ? makePgPool()
    : (globalForDb.__pgPool ?? (globalForDb.__pgPool = makePgPool()));

  pool.on("error", (err: Error) => {
    console.error("[db] pg pool error:", err);
  });

  const adapter = new PrismaPg(pool);

  const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = isProd
    ? ["warn", "error"]
    : process.env.DEBUG_SQL === "1"
      ? ["query", "info", "warn", "error"]
      : ["info", "warn", "error"];

  return new PrismaClient({
    adapter,
    log,
    errorFormat: isProd ? "minimal" : "pretty",
    transactionOptions: {
      // Avoid long waits behind the pooler
      maxWait: 2000,
      timeout: 8000,
    },
  });
}

export const prisma: PrismaClient = isProd
  ? makePrismaClient()
  : (globalForDb.__prisma ?? (globalForDb.__prisma = makePrismaClient()));
