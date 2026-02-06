/**
 * RIME COUTURE - Clean Seed
 * ==========================
 * Seeds only the foundation data: admin user, categories, sizes, colors, tags.
 * Zero products, zero orders - a clean slate for production use.
 */

import argon2 from "argon2";
import { PrismaClient, Locale, TagType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// ============================================================================
// PRISMA CLIENT
// ============================================================================

function createSeedPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("[seed] DATABASE_URL not set");

  const pool = new Pool({
    connectionString,
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    ssl: { rejectUnauthorized: false },
    options: `-c statement_timeout=60000`,
  });

  pool.on("error", (err: Error) => {
    console.error("[seed] Pool error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: ["warn", "error"],
    transactionOptions: { maxWait: 30000, timeout: 60000 },
  }) as PrismaClient;
}

const prisma = createSeedPrisma();
const ADMIN_PASSWORD = (process.env.SEED_ADMIN_PASSWORD ?? "Admin123456!").trim();

// ============================================================================
// DATA DEFINITIONS
// ============================================================================

const CATEGORIES = [
  {
    slug: "kids-clothes",
    sortOrder: 1,
    translations: [
      { locale: "EN" as Locale, name: "Kids Clothes", description: "Beautiful handmade children clothing" },
      { locale: "AR" as Locale, name: "ملابس أطفال", description: "ملابس أطفال جميلة مصنوعة يدويا" },
      { locale: "FR" as Locale, name: "Vêtements Enfants", description: "Beaux vêtements pour enfants faits main" },
    ],
  },
  {
    slug: "kitchen-stuff",
    sortOrder: 2,
    translations: [
      { locale: "EN" as Locale, name: "Kitchen Stuff", description: "Handcrafted kitchen accessories and textiles" },
      { locale: "AR" as Locale, name: "أغراض المطبخ", description: "إكسسوارات ومنسوجات مطبخ مصنوعة يدويا" },
      { locale: "FR" as Locale, name: "Articles de Cuisine", description: "Accessoires et textiles de cuisine artisanaux" },
    ],
  },
];

const SIZES = [
  { code: "2Y",  sortOrder: 1,  labels: { EN: "2 Years",  AR: "سنتان",     FR: "2 Ans" } },
  { code: "3Y",  sortOrder: 2,  labels: { EN: "3 Years",  AR: "3 سنوات",   FR: "3 Ans" } },
  { code: "4Y",  sortOrder: 3,  labels: { EN: "4 Years",  AR: "4 سنوات",   FR: "4 Ans" } },
  { code: "5Y",  sortOrder: 4,  labels: { EN: "5 Years",  AR: "5 سنوات",   FR: "5 Ans" } },
  { code: "6Y",  sortOrder: 5,  labels: { EN: "6 Years",  AR: "6 سنوات",   FR: "6 Ans" } },
  { code: "7Y",  sortOrder: 6,  labels: { EN: "7 Years",  AR: "7 سنوات",   FR: "7 Ans" } },
  { code: "8Y",  sortOrder: 7,  labels: { EN: "8 Years",  AR: "8 سنوات",   FR: "8 Ans" } },
  { code: "9Y",  sortOrder: 8,  labels: { EN: "9 Years",  AR: "9 سنوات",   FR: "9 Ans" } },
  { code: "10Y", sortOrder: 9,  labels: { EN: "10 Years", AR: "10 سنوات",  FR: "10 Ans" } },
  { code: "11Y", sortOrder: 10, labels: { EN: "11 Years", AR: "11 سنوات",  FR: "11 Ans" } },
  { code: "12Y", sortOrder: 11, labels: { EN: "12 Years", AR: "12 سنة",    FR: "12 Ans" } },
];

const COLORS = [
  { code: "black",    hex: "#000000", sortOrder: 1,  labels: { EN: "Black",    AR: "أسود",    FR: "Noir" } },
  { code: "white",    hex: "#FFFFFF", sortOrder: 2,  labels: { EN: "White",    AR: "أبيض",    FR: "Blanc" } },
  { code: "red",      hex: "#DC2626", sortOrder: 3,  labels: { EN: "Red",      AR: "أحمر",    FR: "Rouge" } },
  { code: "pink",     hex: "#EC4899", sortOrder: 4,  labels: { EN: "Pink",     AR: "وردي",    FR: "Rose" } },
  { code: "rose",     hex: "#F43F5E", sortOrder: 5,  labels: { EN: "Rose",     AR: "وردي غامق", FR: "Rose foncé" } },
  { code: "orange",   hex: "#EA580C", sortOrder: 6,  labels: { EN: "Orange",   AR: "برتقالي",  FR: "Orange" } },
  { code: "yellow",   hex: "#EAB308", sortOrder: 7,  labels: { EN: "Yellow",   AR: "أصفر",    FR: "Jaune" } },
  { code: "green",    hex: "#16A34A", sortOrder: 8,  labels: { EN: "Green",    AR: "أخضر",    FR: "Vert" } },
  { code: "teal",     hex: "#0D9488", sortOrder: 9,  labels: { EN: "Teal",     AR: "أزرق مخضر", FR: "Sarcelle" } },
  { code: "blue",     hex: "#2563EB", sortOrder: 10, labels: { EN: "Blue",     AR: "أزرق",    FR: "Bleu" } },
  { code: "navy",     hex: "#1E3A5F", sortOrder: 11, labels: { EN: "Navy",     AR: "كحلي",    FR: "Marine" } },
  { code: "purple",   hex: "#7C3AED", sortOrder: 12, labels: { EN: "Purple",   AR: "بنفسجي",  FR: "Violet" } },
  { code: "lavender", hex: "#A78BFA", sortOrder: 13, labels: { EN: "Lavender", AR: "لافندر",   FR: "Lavande" } },
  { code: "brown",    hex: "#92400E", sortOrder: 14, labels: { EN: "Brown",    AR: "بني",     FR: "Marron" } },
  { code: "beige",    hex: "#D4B896", sortOrder: 15, labels: { EN: "Beige",    AR: "بيج",     FR: "Beige" } },
  { code: "gray",     hex: "#6B7280", sortOrder: 16, labels: { EN: "Gray",     AR: "رمادي",   FR: "Gris" } },
  { code: "silver",   hex: "#C0C0C0", sortOrder: 17, labels: { EN: "Silver",   AR: "فضي",     FR: "Argent" } },
  { code: "gold",     hex: "#D4A017", sortOrder: 18, labels: { EN: "Gold",     AR: "ذهبي",    FR: "Or" } },
];

const TAGS: { type: TagType; slug: string; labels: Record<string, string> }[] = [
  // Subcategory tags (OCCASION type)
  { type: "OCCASION", slug: "boy",      labels: { EN: "Boy",      AR: "ولد",         FR: "Garçon" } },
  { type: "OCCASION", slug: "girl",     labels: { EN: "Girl",     AR: "بنت",         FR: "Fille" } },
  { type: "OCCASION", slug: "for-mama", labels: { EN: "For Mama", AR: "للماما",      FR: "Pour Maman" } },
  { type: "OCCASION", slug: "items",    labels: { EN: "Items",    AR: "أغراض",       FR: "Articles" } },
  // Common materials
  { type: "MATERIAL", slug: "cotton",   labels: { EN: "Cotton",   AR: "قطن",         FR: "Coton" } },
  { type: "MATERIAL", slug: "silk",     labels: { EN: "Silk",     AR: "حرير",        FR: "Soie" } },
  { type: "MATERIAL", slug: "linen",    labels: { EN: "Linen",    AR: "كتان",        FR: "Lin" } },
  { type: "MATERIAL", slug: "polyester",labels: { EN: "Polyester", AR: "بوليستر",    FR: "Polyester" } },
  // Common patterns
  { type: "PATTERN",  slug: "floral",   labels: { EN: "Floral",   AR: "زهري",        FR: "Fleuri" } },
  { type: "PATTERN",  slug: "striped",  labels: { EN: "Striped",  AR: "مخطط",        FR: "Rayé" } },
  { type: "PATTERN",  slug: "solid",    labels: { EN: "Solid",    AR: "سادة",        FR: "Uni" } },
  { type: "PATTERN",  slug: "plaid",    labels: { EN: "Plaid",    AR: "مربعات",      FR: "Écossais" } },
];

// ============================================================================
// CLEAR + SEED FUNCTIONS
// ============================================================================

async function clearDatabase() {
  console.log("[seed] Clearing database...");
  const tables = [
    "analyticsEvent", "aiRequestLog", "aiCacheEntry", "emailLog", "webhookLog",
    "returnItem", "returnRequest", "shipmentEvent", "shipment", "paymentTransaction",
    "review", "orderItem", "order", "cartItem", "cart", "wishlistItem", "productLike",
    "productTag", "productMedia", "productVariant", "productTranslation", "product",
    "mediaAsset", "tagTranslation", "tag", "colorTranslation", "color",
    "sizeTranslation", "size", "categoryTranslation", "category",
    "cmsPageTranslation", "cmsPage", "verificationToken", "session", "user",
  ];
  for (const table of tables) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (prisma as any)[table];
      if (model && typeof model.deleteMany === "function") {
        await model.deleteMany();
        console.log(`   Cleared ${table}`);
      }
    } catch {
      console.log(`  - Skipped ${table}`);
    }
  }
  console.log("[seed] Database cleared\n");
}

async function seedAdmin() {
  console.log("[seed] Creating admin user...");
  const hash = await argon2.hash(ADMIN_PASSWORD);
  await prisma.user.create({
    data: {
      email: "admin@rimecouture.dz",
      passwordHash: hash,
      role: "ADMIN",
      displayName: "Admin",
      phone: "+213555000001",
      preferredLocale: "EN",
      emailVerifiedAt: new Date(),
    },
  });
  console.log("   admin@rimecouture.dz\n");
}

async function seedCategories() {
  console.log("[seed] Seeding categories...");
  for (const cat of CATEGORIES) {
    await prisma.category.create({
      data: {
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true,
        translations: { create: cat.translations },
      },
    });
    console.log(`   ${cat.slug}`);
  }
  console.log();
}

async function seedSizes() {
  console.log("[seed] Seeding sizes...");
  for (const s of SIZES) {
    await prisma.size.create({
      data: {
        code: s.code,
        sortOrder: s.sortOrder,
        isActive: true,
        translations: {
          create: [
            { locale: "EN" as Locale, label: s.labels.EN },
            { locale: "AR" as Locale, label: s.labels.AR },
            { locale: "FR" as Locale, label: s.labels.FR },
          ],
        },
      },
    });
  }
  console.log(`   ${SIZES.length} sizes (2Y - 12Y)\n`);
}

async function seedColors() {
  console.log("[seed] Seeding colors...");
  for (const c of COLORS) {
    await prisma.color.create({
      data: {
        code: c.code,
        hex: c.hex,
        sortOrder: c.sortOrder,
        isActive: true,
        translations: {
          create: [
            { locale: "EN" as Locale, label: c.labels.EN },
            { locale: "AR" as Locale, label: c.labels.AR },
            { locale: "FR" as Locale, label: c.labels.FR },
          ],
        },
      },
    });
  }
  console.log(`   ${COLORS.length} colors\n`);
}

async function seedTags() {
  console.log("[seed] Seeding tags...");
  for (const t of TAGS) {
    await prisma.tag.create({
      data: {
        type: t.type,
        slug: t.slug,
        isActive: true,
        translations: {
          create: [
            { locale: "EN" as Locale, label: t.labels.EN },
            { locale: "AR" as Locale, label: t.labels.AR },
            { locale: "FR" as Locale, label: t.labels.FR },
          ],
        },
      },
    });
    console.log(`   [${t.type}] ${t.slug}`);
  }
  console.log();
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("");
  console.log("   RIME COUTURE - Clean Seed          ");
  console.log("\n");

  try {
    await clearDatabase();
    await seedAdmin();
    await seedCategories();
    await seedSizes();
    await seedColors();
    await seedTags();

    console.log("");
    console.log("   Seed completed successfully!");
    console.log("   1 admin user");
    console.log(`   ${CATEGORIES.length} categories`);
    console.log(`   ${SIZES.length} sizes`);
    console.log(`   ${COLORS.length} colors`);
    console.log(`   ${TAGS.length} tags`);
    console.log("   0 products (clean slate)");
    console.log("");
  } catch (error) {
    console.error("[seed] Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("[seed] failed:", e);
  process.exit(1);
});
