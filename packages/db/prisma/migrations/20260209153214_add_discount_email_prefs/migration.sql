-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountPercent" INTEGER,
ADD COLUMN     "originalPriceMinor" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Product_salesCount_idx" ON "Product"("salesCount");
