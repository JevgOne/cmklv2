/*
  Warnings:

  - A unique constraint covering the columns `[userId,partId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rmaNumber]` on the table `ReturnRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_listingId_fkey";

-- DropIndex
DROP INDEX "Listing_searchVector_idx";

-- DropIndex
DROP INDEX "Part_name_trgm_idx";

-- DropIndex
DROP INDEX "Part_searchVector_idx";

-- DropIndex
DROP INDEX "Vehicle_brand_trgm_idx";

-- DropIndex
DROP INDEX "Vehicle_model_trgm_idx";

-- DropIndex
DROP INDEX "Vehicle_searchVector_idx";

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "partId" TEXT,
ALTER COLUMN "listingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stripePaymentIntentId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "subOrderId" TEXT;

-- AlterTable
ALTER TABLE "ReturnRequest" ADD COLUMN     "returnTrackingNumber" TEXT,
ADD COLUMN     "rmaNumber" TEXT,
ADD COLUMN     "shippedBackAt" TIMESTAMP(3),
ADD COLUMN     "subOrderId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "coverPhoto" TEXT,
ADD COLUMN     "favoriteBrands" TEXT,
ADD COLUMN     "languageSkills" JSONB,
ADD COLUMN     "motto" TEXT,
ADD COLUMN     "openingHours" JSONB,
ADD COLUMN     "profileViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "services" JSONB,
ADD COLUMN     "showEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showPhone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "warehouseAddress" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yearsExperience" INTEGER;

-- CreateTable
CREATE TABLE "PartReservation" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOrder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deliveryMethod" TEXT NOT NULL,
    "deliveryPrice" INTEGER NOT NULL DEFAULT 0,
    "zasilkovnaPointId" TEXT,
    "zasilkovnaPointName" TEXT,
    "trackingNumber" TEXT,
    "trackingCarrier" TEXT,
    "trackingUrl" TEXT,
    "shippingLabelUrl" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "commissionRate" DECIMAL(4,2),
    "carmaklerFee" INTEGER,
    "supplierPayout" INTEGER,
    "subtotal" INTEGER NOT NULL,
    "shippingPrice" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartRequest" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vehicleBrand" TEXT,
    "vehicleModel" TEXT,
    "vehicleYear" INTEGER,
    "vin" TEXT,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "buyerName" TEXT,
    "buyerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartRequestOffer" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartRequestOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerGarage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "vin" TEXT,
    "nickname" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerGarage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartCrossReference" (
    "id" TEXT NOT NULL,
    "oemNumber" TEXT NOT NULL,
    "aftermarketNumber" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "partId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartCrossReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PARTS',
    "resultCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierReview" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockNotification" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "listingId" TEXT,
    "partId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileComment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "listingId" TEXT,
    "partId" TEXT,
    "text" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartReservation_expiresAt_idx" ON "PartReservation"("expiresAt");

-- CreateIndex
CREATE INDEX "PartReservation_partId_idx" ON "PartReservation"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "PartReservation_partId_sessionId_key" ON "PartReservation"("partId", "sessionId");

-- CreateIndex
CREATE INDEX "SubOrder_orderId_idx" ON "SubOrder"("orderId");

-- CreateIndex
CREATE INDEX "SubOrder_supplierId_idx" ON "SubOrder"("supplierId");

-- CreateIndex
CREATE INDEX "SubOrder_status_idx" ON "SubOrder"("status");

-- CreateIndex
CREATE INDEX "PartRequest_status_idx" ON "PartRequest"("status");

-- CreateIndex
CREATE INDEX "PartRequest_expiresAt_idx" ON "PartRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "PartRequestOffer_requestId_idx" ON "PartRequestOffer"("requestId");

-- CreateIndex
CREATE INDEX "PartRequestOffer_supplierId_idx" ON "PartRequestOffer"("supplierId");

-- CreateIndex
CREATE INDEX "CustomerGarage_userId_idx" ON "CustomerGarage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerGarage_userId_vin_key" ON "CustomerGarage"("userId", "vin");

-- CreateIndex
CREATE INDEX "PartCrossReference_oemNumber_idx" ON "PartCrossReference"("oemNumber");

-- CreateIndex
CREATE INDEX "PartCrossReference_aftermarketNumber_idx" ON "PartCrossReference"("aftermarketNumber");

-- CreateIndex
CREATE INDEX "PartCrossReference_partId_idx" ON "PartCrossReference"("partId");

-- CreateIndex
CREATE INDEX "SearchQuery_userId_createdAt_idx" ON "SearchQuery"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierReview_supplierId_idx" ON "SupplierReview"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierReview_buyerId_orderId_key" ON "SupplierReview"("buyerId", "orderId");

-- CreateIndex
CREATE INDEX "StockNotification_partId_notified_idx" ON "StockNotification"("partId", "notified");

-- CreateIndex
CREATE UNIQUE INDEX "StockNotification_partId_email_key" ON "StockNotification"("partId", "email");

-- CreateIndex
CREATE INDEX "ProfileLike_vehicleId_idx" ON "ProfileLike"("vehicleId");

-- CreateIndex
CREATE INDEX "ProfileLike_listingId_idx" ON "ProfileLike"("listingId");

-- CreateIndex
CREATE INDEX "ProfileLike_partId_idx" ON "ProfileLike"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileLike_userId_vehicleId_key" ON "ProfileLike"("userId", "vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileLike_userId_listingId_key" ON "ProfileLike"("userId", "listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileLike_userId_partId_key" ON "ProfileLike"("userId", "partId");

-- CreateIndex
CREATE INDEX "ProfileComment_vehicleId_idx" ON "ProfileComment"("vehicleId");

-- CreateIndex
CREATE INDEX "ProfileComment_listingId_idx" ON "ProfileComment"("listingId");

-- CreateIndex
CREATE INDEX "ProfileComment_partId_idx" ON "ProfileComment"("partId");

-- CreateIndex
CREATE INDEX "ProfileComment_userId_idx" ON "ProfileComment"("userId");

-- CreateIndex
CREATE INDEX "ProfileBadge_userId_idx" ON "ProfileBadge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileBadge_userId_badgeKey_key" ON "ProfileBadge"("userId", "badgeKey");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_partId_key" ON "Favorite"("userId", "partId");

-- CreateIndex
CREATE INDEX "Part_oemNumber_idx" ON "Part"("oemNumber");

-- CreateIndex
CREATE INDEX "Part_partNumber_idx" ON "Part"("partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_rmaNumber_key" ON "ReturnRequest"("rmaNumber");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartReservation" ADD CONSTRAINT "PartReservation_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES "SubOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_subOrderId_fkey" FOREIGN KEY ("subOrderId") REFERENCES "SubOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRequest" ADD CONSTRAINT "PartRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRequestOffer" ADD CONSTRAINT "PartRequestOffer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PartRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRequestOffer" ADD CONSTRAINT "PartRequestOffer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerGarage" ADD CONSTRAINT "CustomerGarage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCrossReference" ADD CONSTRAINT "PartCrossReference_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchQuery" ADD CONSTRAINT "SearchQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReview" ADD CONSTRAINT "SupplierReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLike" ADD CONSTRAINT "ProfileLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLike" ADD CONSTRAINT "ProfileLike_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLike" ADD CONSTRAINT "ProfileLike_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLike" ADD CONSTRAINT "ProfileLike_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileComment" ADD CONSTRAINT "ProfileComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileComment" ADD CONSTRAINT "ProfileComment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileComment" ADD CONSTRAINT "ProfileComment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileComment" ADD CONSTRAINT "ProfileComment_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileBadge" ADD CONSTRAINT "ProfileBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
