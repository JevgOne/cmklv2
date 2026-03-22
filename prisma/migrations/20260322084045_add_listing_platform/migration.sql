/*
  Warnings:

  - Added the required column `email` to the `Inquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Inquiry` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "senderId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "reply" TEXT,
    "repliedAt" DATETIME,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inquiry" ("createdAt", "id", "listingId", "message", "read", "repliedAt", "reply", "senderId") SELECT "createdAt", "id", "listingId", "message", "read", "repliedAt", "reply", "senderId" FROM "Inquiry";
DROP TABLE "Inquiry";
ALTER TABLE "new_Inquiry" RENAME TO "Inquiry";
CREATE INDEX "Inquiry_listingId_idx" ON "Inquiry"("listingId");
CREATE INDEX "Inquiry_senderId_idx" ON "Inquiry"("senderId");
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "vin" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "fuelType" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "enginePower" INTEGER,
    "engineCapacity" INTEGER,
    "bodyType" TEXT,
    "color" TEXT,
    "doorsCount" INTEGER,
    "seatsCount" INTEGER,
    "condition" TEXT NOT NULL,
    "serviceBook" BOOLEAN DEFAULT false,
    "stkValidUntil" DATETIME,
    "odometerStatus" TEXT,
    "ownerCount" INTEGER,
    "originCountry" TEXT,
    "price" INTEGER NOT NULL,
    "priceNegotiable" BOOLEAN NOT NULL DEFAULT true,
    "vatStatus" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "description" TEXT,
    "equipment" TEXT,
    "highlights" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumUntil" DATETIME,
    "wantsBrokerHelp" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "expiresAt" DATETIME,
    CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Listing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("bodyType", "brand", "city", "color", "condition", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "district", "doorsCount", "engineCapacity", "enginePower", "equipment", "expiresAt", "fuelType", "highlights", "id", "inquiryCount", "isPremium", "listingType", "mileage", "model", "odometerStatus", "originCountry", "ownerCount", "premiumUntil", "price", "priceNegotiable", "publishedAt", "seatsCount", "serviceBook", "slug", "status", "stkValidUntil", "transmission", "updatedAt", "userId", "variant", "vatStatus", "vehicleId", "viewCount", "vin", "year") SELECT "bodyType", "brand", "city", "color", "condition", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "district", "doorsCount", "engineCapacity", "enginePower", "equipment", "expiresAt", "fuelType", "highlights", "id", "inquiryCount", "isPremium", "listingType", "mileage", "model", "odometerStatus", "originCountry", "ownerCount", "premiumUntil", "price", "priceNegotiable", "publishedAt", "seatsCount", "serviceBook", "slug", "status", "stkValidUntil", "transmission", "updatedAt", "userId", "variant", "vatStatus", "vehicleId", "viewCount", "vin", "year" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");
CREATE UNIQUE INDEX "Listing_vehicleId_key" ON "Listing"("vehicleId");
CREATE INDEX "Listing_userId_idx" ON "Listing"("userId");
CREATE INDEX "Listing_status_idx" ON "Listing"("status");
CREATE INDEX "Listing_brand_model_idx" ON "Listing"("brand", "model");
CREATE INDEX "Listing_price_idx" ON "Listing"("price");
CREATE INDEX "Listing_year_idx" ON "Listing"("year");
CREATE INDEX "Listing_city_idx" ON "Listing"("city");
CREATE INDEX "Listing_listingType_idx" ON "Listing"("listingType");
CREATE INDEX "Listing_isPremium_idx" ON "Listing"("isPremium");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
