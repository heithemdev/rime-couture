export * from "./prisma";

// Re-export Prisma namespace for types (keeps apps from importing @prisma/client directly).
export type { Prisma } from "@prisma/client";

// Re-export enums for use in API routes
export { Locale, TagType, ProductStatus, OrderStatus, PaymentStatus, ShipmentStatus } from "@prisma/client";
