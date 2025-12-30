// /packages/db/prisma/seed.ts
// Purpose: minimal, deterministic, idempotent seed (only creates/ensures an Admin user).
// Complexity: O(1) DB writes.

import argon2 from "argon2";
import { prisma as prismaTyped } from "../src/prisma";

const prisma = prismaTyped as unknown as any; // Why: keeps seed unblocked even if Prisma types are stale in the editor.

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? "admin@local.test").trim();
const ADMIN_PASSWORD = (process.env.SEED_ADMIN_PASSWORD ?? "Admin123456!").trim();

async function getEnumValue(enumName: string, key: string, fallback: string) {
  // Why: avoids TS “no exported member” errors when Prisma Client types are stale.
  const mod = (await import("@prisma/client")) as any;
  return mod?.[enumName]?.[key] ?? fallback;
}

async function upsertAdmin() {
  const roleAdmin = await getEnumValue("UserRole", "ADMIN", "ADMIN");
  const localeEn = await getEnumValue("Locale", "EN", "EN");

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
    select: { id: true, passwordHash: true },
  });

  // Why: don’t overwrite an existing password on reseed unless it was missing.
  const passwordHash =
    existing?.passwordHash ?? (await argon2.hash(ADMIN_PASSWORD));

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      role: roleAdmin,
      displayName: "Admin",
      passwordHash,
      preferredLocale: localeEn,
      emailVerifiedAt: new Date(),
    },
    update: {
      role: roleAdmin,
      displayName: "Admin",
      preferredLocale: localeEn,
      emailVerifiedAt: new Date(),
      deletedAt: null,
      passwordHash: existing?.passwordHash ? undefined : passwordHash,
    },
  });

  return { adminEmail: ADMIN_EMAIL };
}

async function main() {
  await prismaTyped.$connect();

  const res = await upsertAdmin();

  console.log("[seed] done:", res);
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaTyped.$disconnect();
  });
