// /packages/db/prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  // point Prisma to your schema
  schema: "prisma/schema.prisma",

  // tell Prisma how to run your TS seed file and load .env in this package
  migrations: {
    seed: "tsx --env-file=.env prisma/seed.ts",
  },
});
