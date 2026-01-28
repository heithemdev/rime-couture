// /packages/db/prisma/seed.ts
// Purpose: Comprehensive seed with all mock data for development and testing.

import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  mockUsers,
  mockCategories,
  mockColors,
  mockSizes,
  mockTags,
  mockMediaAssets,
  mockProducts,
  mockOrders,
  mockReviews,
  mockWishlists,
  mockCarts,
  mockCmsPages,
  mockAnalyticsEvents,
} from "./mock-data";

// Create a dedicated seed client with longer timeouts
function createSeedPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("[seed] DATABASE_URL not set");
  }

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
    transactionOptions: {
      maxWait: 30000,
      timeout: 60000,
    },
  }) as PrismaClient;
}

const prisma = createSeedPrisma();
const ADMIN_PASSWORD = (process.env.SEED_ADMIN_PASSWORD ?? "Admin123456!").trim();

// ID maps to track created records (mock ID -> real DB ID)
const idMaps = {
  users: new Map<string, string>(),
  categories: new Map<string, string>(),
  colors: new Map<string, string>(),
  sizes: new Map<string, string>(),
  tags: new Map<string, string>(),
  media: new Map<string, string>(),
  products: new Map<string, string>(),
  variants: new Map<string, string>(),
  orders: new Map<string, string>(),
};

async function clearDatabase() {
  console.log("[seed] Clearing database...");
  
  const tables = [
    "analyticsEvent", "aiRequestLog", "aiCacheEntry", "emailLog", "webhookLog",
    "returnItem", "returnRequest", "shipmentEvent", "shipment", "paymentTransaction",
    "review", "orderItem", "order", "cartItem", "cart", "wishlistItem",
    "productTag", "productMedia", "productVariant", "productTranslation", "product",
    "mediaAsset", "tagTranslation", "tag", "colorTranslation", "color",
    "sizeTranslation", "size", "categoryTranslation", "category",
    "cmsPageTranslation", "cmsPage", "address", "session", "user"
  ];
  
  for (const table of tables) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (prisma as any)[table];
      if (model && typeof model.deleteMany === 'function') {
        await model.deleteMany();
        console.log(`  - Cleared ${table}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message.slice(0, 50) : 'Unknown error';
      console.log(`  - Skipped ${table}: ${message}`);
    }
  }
  
  console.log("[seed] Database cleared");
}

async function seedUsers() {
  console.log("[seed] Seeding users...");
  
  for (let i = 0; i < mockUsers.length; i++) {
    const user = mockUsers[i];
    console.log(`  - Creating user ${i + 1}/${mockUsers.length}: ${user.email}`);
    
    const hashedPassword = await argon2.hash(
      user.email === "admin@rimecouture.dz" ? ADMIN_PASSWORD : "User123456!"
    );
    
    const created = await prisma.user.create({
      data: {
        email: user.email,
        passwordHash: hashedPassword,
        role: user.role,
        displayName: user.displayName,
        phone: user.phone,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    });
    
    idMaps.users.set(user.id, created.id);
  }
  
  console.log(`[seed] Created ${mockUsers.length} users`);
}

async function seedCategories() {
  console.log("[seed] Seeding categories...");
  
  for (const cat of mockCategories) {
    const created = await prisma.category.create({
      data: {
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        translations: {
          create: cat.translations,
        },
      },
    });
    
    idMaps.categories.set(cat.id, created.id);
    console.log(`  - Created category: ${cat.slug}`);
  }
  
  console.log(`[seed] Created ${mockCategories.length} categories`);
}

async function seedColors() {
  console.log("[seed] Seeding colors...");
  
  for (const color of mockColors) {
    const created = await prisma.color.create({
      data: {
        code: color.code,
        hex: color.hex,
        translations: {
          create: color.translations,
        },
      },
    });
    
    idMaps.colors.set(color.id, created.id);
  }
  
  console.log(`[seed] Created ${mockColors.length} colors`);
}

async function seedSizes() {
  console.log("[seed] Seeding sizes...");
  
  for (const size of mockSizes) {
    const created = await prisma.size.create({
      data: {
        code: size.code,
        sortOrder: size.sortOrder,
        translations: {
          create: size.translations,
        },
      },
    });
    
    idMaps.sizes.set(size.id, created.id);
  }
  
  console.log(`[seed] Created ${mockSizes.length} sizes`);
}

async function seedTags() {
  console.log("[seed] Seeding tags...");
  
  for (const tag of mockTags) {
    const created = await prisma.tag.create({
      data: {
        slug: tag.slug,
        type: tag.type,
        translations: {
          create: tag.translations,
        },
      },
    });
    
    idMaps.tags.set(tag.id, created.id);
  }
  
  console.log(`[seed] Created ${mockTags.length} tags`);
}

async function seedMediaAssets() {
  console.log("[seed] Seeding media assets...");
  
  for (const media of mockMediaAssets) {
    const created = await prisma.mediaAsset.create({
      data: {
        url: media.url,
        kind: media.kind,
        width: media.width,
        height: media.height,
      },
    });
    
    idMaps.media.set(media.id, created.id);
  }
  
  console.log(`[seed] Created ${mockMediaAssets.length} media assets`);
}

async function seedProducts() {
  console.log("[seed] Seeding products...");
  
  for (const product of mockProducts) {
    // Get the real category ID from our map
    const categoryId = idMaps.categories.get(product.categoryId);
    if (!categoryId) {
      console.log(`  - Skipping product ${product.slug}: category not found`);
      continue;
    }
    
    // Build media create data
    const mediaCreate = product.media
      .map((m) => {
        const realMediaId = idMaps.media.get(m.mediaId);
        if (!realMediaId) return null;
        return {
          mediaId: realMediaId,
          position: m.position,
          isThumb: m.isThumb,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
    
    // Build tags create data
    const tagsCreate = product.tags
      .map((tagId) => {
        const realTagId = idMaps.tags.get(tagId);
        if (!realTagId) return null;
        return { tagId: realTagId };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);
    
    // Build variants create data
    const variantsCreate = product.variants.map((v) => {
      const realSizeId = idMaps.sizes.get(v.sizeId);
      const realColorId = idMaps.colors.get(v.colorId);
      return {
        variantKey: v.variantKey,
        sku: v.sku,
        colorId: realColorId || null,
        sizeId: realSizeId || null,
        stock: v.stock,
        isActive: true,
      };
    });
    
    const created = await prisma.product.create({
      data: {
        slug: product.slug,
        categoryId: categoryId,
        basePriceMinor: product.basePriceMinor,
        currency: "DZD",
        status: product.status,
        isActive: true,
        isFeatured: product.isFeatured,
        featuredOrder: product.featuredOrder ?? null,
        avgRating: product.avgRating,
        reviewCount: product.reviewCount,
        salesCount: product.salesCount,
        isCustomizable: product.isCustomizable,
        isMadeToOrder: product.isMadeToOrder,
        translations: {
          create: product.translations,
        },
        media: {
          create: mediaCreate,
        },
        tags: {
          create: tagsCreate,
        },
        variants: {
          create: variantsCreate,
        },
      },
      include: {
        variants: true,
      },
    });
    
    idMaps.products.set(product.id, created.id);
    
    // Store variant mappings for orders/carts
    for (const variant of created.variants) {
      idMaps.variants.set(`${product.id}-${variant.variantKey}`, variant.id);
    }
    
    console.log(`  - Created product: ${product.slug}`);
  }
  
  console.log(`[seed] Created ${mockProducts.length} products`);
}

async function seedOrders() {
  console.log("[seed] Seeding orders...");
  
  let orderCount = 0;
  for (const order of mockOrders) {
    const userId = idMaps.users.get(order.userId);
    if (!userId) {
      console.log(`  - Skipping order ${order.orderNumber}: user not found`);
      continue;
    }
    
    // Build order items
    const itemsCreate = order.items.map((item) => {
      const productId = idMaps.products.get(item.productId);
      return {
        productId: productId || null,
        variantId: item.variantId ? idMaps.variants.get(item.variantId) || null : null,
        quantity: item.quantity,
        unitPriceMinor: item.unitPriceMinor,
        lineTotalMinor: item.unitPriceMinor * item.quantity,
        productName: item.productName,
        productSlug: item.productSlug,
        sizeLabel: item.sizeLabel || null,
        colorLabel: item.colorLabel || null,
      };
    });
    
    const created = await prisma.order.create({
      data: {
        orderNumber: order.orderNumber,
        userId: userId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotalMinor: order.subtotalMinor,
        shippingMinor: order.shippingMinor,
        totalMinor: order.totalMinor,
        currency: "DZD",
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        addressLine1: order.addressLine1,
        wilayaCode: order.wilayaCode,
        wilayaName: order.wilayaName,
        commune: order.commune,
        postalCode: order.postalCode,
        confirmedAt: order.confirmedAt,
        shippedAt: order.shippedAt ?? null,
        deliveredAt: order.deliveredAt ?? null,
        items: {
          create: itemsCreate,
        },
      },
    });
    
    idMaps.orders.set(order.id, created.id);
    orderCount++;
  }
  
  console.log(`[seed] Created ${orderCount} orders`);
}

async function seedReviews() {
  console.log("[seed] Seeding reviews...");
  
  // Get order items to link reviews to
  const orderItems = await prisma.orderItem.findMany({
    include: { order: true },
  });
  
  let reviewCount = 0;
  for (const review of mockReviews) {
    const productId = idMaps.products.get(review.productId);
    const userId = idMaps.users.get(review.userId);
    
    if (!productId || !userId) {
      console.log(`  - Skipping review: product or user not found`);
      continue;
    }
    
    // Find an order item for this product to link the review
    const orderItem = orderItems.find(oi => oi.productId === productId);
    if (!orderItem) {
      console.log(`  - Skipping review: no order item found for product`);
      continue;
    }
    
    // Check if this order item already has a review
    const existingReview = await prisma.review.findUnique({
      where: { orderItemId: orderItem.id },
    });
    if (existingReview) {
      console.log(`  - Skipping review: order item already has a review`);
      continue;
    }
    
    await prisma.review.create({
      data: {
        productId: productId,
        orderItemId: orderItem.id,
        userId: userId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        isHidden: false,
      },
    });
    reviewCount++;
  }
  
  console.log(`[seed] Created ${reviewCount} reviews`);
}

async function seedWishlists() {
  console.log("[seed] Seeding wishlists...");
  
  let wishlistCount = 0;
  for (const wishlist of mockWishlists) {
    const userId = idMaps.users.get(wishlist.userId);
    const productId = idMaps.products.get(wishlist.productId);
    
    if (!userId || !productId) {
      console.log(`  - Skipping wishlist: user or product not found`);
      continue;
    }
    
    await prisma.wishlistItem.create({
      data: {
        userId: userId,
        productId: productId,
      },
    });
    wishlistCount++;
  }
  
  console.log(`[seed] Created ${wishlistCount} wishlist items`);
}

async function seedCarts() {
  console.log("[seed] Seeding carts...");
  
  // Get all variants for cart items
  const allVariants = await prisma.productVariant.findMany();
  
  let cartCount = 0;
  for (const cartData of mockCarts) {
    const userId = idMaps.users.get(cartData.userId);
    if (!userId) {
      console.log(`  - Skipping cart: user not found`);
      continue;
    }
    
    const cart = await prisma.cart.create({
      data: {
        userId: userId,
      },
    });
    
    // Add items to cart
    for (const item of cartData.items) {
      const productId = idMaps.products.get(item.productId);
      if (!productId) continue;
      
      // Find a variant for this product
      const variant = allVariants.find(v => v.productId === productId);
      if (!variant) continue;
      
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          variantId: variant.id,
          quantity: item.quantity,
          unitPriceMinor: item.unitPriceMinor,
        },
      });
    }
    cartCount++;
  }
  
  console.log(`[seed] Created ${cartCount} carts`);
}

async function seedCmsPages() {
  console.log("[seed] Seeding CMS pages...");
  
  for (const page of mockCmsPages) {
    await prisma.cmsPage.create({
      data: {
        slug: page.slug,
        isPublished: page.isPublished,
        translations: {
          create: page.translations,
        },
      },
    });
  }
  
  console.log(`[seed] Created ${mockCmsPages.length} CMS pages`);
}

async function seedAnalyticsEvents() {
  console.log("[seed] Seeding analytics events...");
  
  for (const event of mockAnalyticsEvents) {
    const productId = event.productId ? idMaps.products.get(event.productId) : null;
    const orderId = event.orderId ? idMaps.orders.get(event.orderId) : null;
    
    await prisma.analyticsEvent.create({
      data: {
        type: event.type,
        sessionId: event.sessionId,
        productId: productId || null,
        orderId: orderId || null,
        path: event.path ?? null,
        referrer: event.referrer ?? null,
        meta: event.meta ? event.meta : undefined,
      },
    });
  }
  
  console.log(`[seed] Created ${mockAnalyticsEvents.length} analytics events`);
}

async function main() {
  console.log("[seed] Starting comprehensive seed...");
  
  try {
    await clearDatabase();
    await seedUsers();
    await seedCategories();
    await seedColors();
    await seedSizes();
    await seedTags();
    await seedMediaAssets();
    await seedProducts();
    await seedOrders();
    await seedReviews();
    await seedWishlists();
    await seedCarts();
    await seedCmsPages();
    await seedAnalyticsEvents();
    
    console.log("[seed] Seeding completed successfully!");
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
