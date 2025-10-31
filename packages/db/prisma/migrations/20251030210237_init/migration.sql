CREATE EXTENSION IF NOT EXISTS citext;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'SHOP_OWNER');

-- CreateEnum
CREATE TYPE "ReactionValue" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('HOME', 'CENTER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BARIDI_MOB');

-- CreateEnum
CREATE TYPE "ShopOrderStatus" AS ENUM ('ORDERED', 'SHIPPED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('SALE_NET', 'REFUND', 'PAYOUT');

-- CreateEnum
CREATE TYPE "TokenPurpose" AS ENUM ('SIGNUP', 'RESET');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'SENT', 'PROCESSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ShippingCarrier" AS ENUM ('YALIDINE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "name" CITEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "acceptedTermsAt" TIMESTAMP(3) NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "sessionIdHash" TEXT NOT NULL,
    "ip" INET,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "purpose" "TokenPurpose" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wilayas" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "wilayas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "profilePhotoUrl" TEXT,
    "bannerUrl" TEXT,
    "wilayaId" INTEGER NOT NULL,
    "city" TEXT,
    "ccpNumber" TEXT,
    "preferredCarrier" "ShippingCarrier" NOT NULL DEFAULT 'YALIDINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priceDA" INTEGER NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "dislikesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reactions" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "value" "ReactionValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_prices" (
    "fromWilayaId" INTEGER NOT NULL,
    "toWilayaId" INTEGER NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL,
    "priceDA" INTEGER NOT NULL,

    CONSTRAINT "shipping_prices_pkey" PRIMARY KEY ("fromWilayaId","toWilayaId","deliveryType")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "productNameAtOrder" TEXT NOT NULL,
    "productPriceDAAtOrder" INTEGER NOT NULL,
    "shippingPriceDAAtOrder" INTEGER NOT NULL,
    "deliveryType" "DeliveryType" NOT NULL,
    "destinationWilayaId" INTEGER NOT NULL,
    "baladiya" TEXT,
    "street" TEXT,
    "exactLocation" TEXT,
    "pickupCity" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BARIDI_MOB',
    "paymentProofUrl" TEXT NOT NULL,
    "paidAmountDA" INTEGER NOT NULL,
    "status" "ShopOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "refundRequestedAt" TIMESTAMP(3),
    "refundProcessedAt" TIMESTAMP(3),
    "clientVisibleUntil" TIMESTAMP(3) NOT NULL,
    "shopVisibleUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_ledger_entries" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "orderId" UUID,
    "payoutRequestId" UUID,
    "type" "LedgerEntryType" NOT NULL,
    "amountDA" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "amountDA" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "commissionRateBps" INTEGER NOT NULL DEFAULT 0,
    "payoutMinAmountDA" INTEGER NOT NULL DEFAULT 500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionIdHash_key" ON "sessions"("sessionIdHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_tokenHash_key" ON "verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "verification_tokens_email_purpose_idx" ON "verification_tokens"("email", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "wilayas_name_key" ON "wilayas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "shops_ownerId_key" ON "shops"("ownerId");

-- CreateIndex
CREATE INDEX "shops_wilayaId_idx" ON "shops"("wilayaId");

-- CreateIndex
CREATE INDEX "shops_deletedAt_idx" ON "shops"("deletedAt");

-- CreateIndex
CREATE INDEX "products_shopId_createdAt_id_idx" ON "products"("shopId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "products_createdAt_id_idx" ON "products"("createdAt", "id");

-- CreateIndex
CREATE INDEX "products_deletedAt_idx" ON "products"("deletedAt");

-- CreateIndex
CREATE INDEX "product_reactions_userId_idx" ON "product_reactions"("userId");

-- CreateIndex
CREATE INDEX "product_reactions_productId_value_idx" ON "product_reactions"("productId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "product_reactions_productId_userId_key" ON "product_reactions"("productId", "userId");

-- CreateIndex
CREATE INDEX "shipping_prices_toWilayaId_idx" ON "shipping_prices"("toWilayaId");

-- CreateIndex
CREATE INDEX "orders_shopId_status_createdAt_id_idx" ON "orders"("shopId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "orders_clientId_createdAt_id_idx" ON "orders"("clientId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "orders_createdAt_id_idx" ON "orders"("createdAt", "id");

-- CreateIndex
CREATE INDEX "orders_clientVisibleUntil_idx" ON "orders"("clientVisibleUntil");

-- CreateIndex
CREATE INDEX "orders_shopVisibleUntil_idx" ON "orders"("shopVisibleUntil");

-- CreateIndex
CREATE INDEX "orders_deletedAt_idx" ON "orders"("deletedAt");

-- CreateIndex
CREATE INDEX "shop_ledger_entries_shopId_createdAt_idx" ON "shop_ledger_entries"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "payout_requests_shopId_createdAt_idx" ON "payout_requests"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_wilayaId_fkey" FOREIGN KEY ("wilayaId") REFERENCES "wilayas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reactions" ADD CONSTRAINT "product_reactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reactions" ADD CONSTRAINT "product_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_prices" ADD CONSTRAINT "shipping_prices_fromWilayaId_fkey" FOREIGN KEY ("fromWilayaId") REFERENCES "wilayas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_prices" ADD CONSTRAINT "shipping_prices_toWilayaId_fkey" FOREIGN KEY ("toWilayaId") REFERENCES "wilayas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_destinationWilayaId_fkey" FOREIGN KEY ("destinationWilayaId") REFERENCES "wilayas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_ledger_entries" ADD CONSTRAINT "shop_ledger_entries_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_ledger_entries" ADD CONSTRAINT "shop_ledger_entries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_ledger_entries" ADD CONSTRAINT "shop_ledger_entries_payoutRequestId_fkey" FOREIGN KEY ("payoutRequestId") REFERENCES "payout_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
