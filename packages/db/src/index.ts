export * from "./prisma";

// Re-export Prisma namespace for types (keeps apps from importing @prisma/client directly).
export type { Prisma } from "@prisma/client";
