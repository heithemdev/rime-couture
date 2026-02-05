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

  // Parse connection string and add sslmode=verify-full to suppress warnings
  const urlObj = new URL(connectionString);
  if (!isLocal(connectionString) && !urlObj.searchParams.has('sslmode')) {
    urlObj.searchParams.set('sslmode', 'verify-full');
  }
  const finalConnectionString = urlObj.toString();

  const pool = new Pool({
    connectionString: finalConnectionString,
    // More aggressive pool settings for Prisma Postgres
    max: intEnv("PG_POOL_MAX", 10),
    min: intEnv("PG_POOL_MIN", 2), // Keep 2 warm connections for faster response
    idleTimeoutMillis: intEnv("PG_POOL_IDLE_TIMEOUT_MS", 60_000), // 60s idle timeout (longer)
    connectionTimeoutMillis: intEnv("PG_POOL_CONN_TIMEOUT_MS", 30_000), // 30s to connect (longer for cold starts)
    allowExitOnIdle: false, // Prevent pool from closing when idle

    // SSL config for remote databases
    ssl: isLocal(connectionString) ? undefined : { rejectUnauthorized: false },

    // Prevent runaway queries
    options: `-c statement_timeout=${intEnv("PG_STATEMENT_TIMEOUT_MS", 60_000)}`,
  });
  
  // Handle pool errors without crashing
  pool.on("error", (err: Error) => {
    console.error("[db] pg pool error (will attempt to recover):", err.message);
  });

  return pool;
}

function makePrismaClient() {
  const pool = isProd
    ? makePgPool()
    : (globalForDb.__pgPool ?? (globalForDb.__pgPool = makePgPool()));

  const adapter = new PrismaPg(pool);

  const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = isProd
    ? ["warn", "error"]
    : process.env.DEBUG_SQL === "1"
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"]; // Reduce noise in dev too

  return new PrismaClient({
    adapter,
    log,
    errorFormat: isProd ? "minimal" : "pretty",
    transactionOptions: {
      // Shorter timeouts to fail fast and allow retry
      maxWait: 5000,
      timeout: 15000,
    },
  });
}

export const prisma: PrismaClient = isProd
  ? makePrismaClient()
  : (globalForDb.__prisma ?? (globalForDb.__prisma = makePrismaClient()));
