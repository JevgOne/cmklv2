-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 5000,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CebiaReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT,
    "vin" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reportUrl" TEXT,
    "price" INTEGER NOT NULL DEFAULT 499,
    "orderedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CebiaReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CebiaReport_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListingFeedConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'XML',
    "mappingConfig" TEXT,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "syncInterval" TEXT NOT NULL DEFAULT 'daily',
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingFeedConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListingImportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ListingImportLog_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ListingFeedConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedImportConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "mapping" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" DATETIME,
    "lastRunStatus" TEXT,
    "lastRunCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FeedImportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedImportLog_configId_fkey" FOREIGN KEY ("configId") REFERENCES "FeedImportConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inquiry_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inquiry" ("createdAt", "email", "id", "listingId", "message", "name", "phone", "read", "repliedAt", "reply", "senderId") SELECT "createdAt", "email", "id", "listingId", "message", "name", "phone", "read", "repliedAt", "reply", "senderId" FROM "Inquiry";
DROP TABLE "Inquiry";
ALTER TABLE "new_Inquiry" RENAME TO "Inquiry";
CREATE INDEX "Inquiry_listingId_idx" ON "Inquiry"("listingId");
CREATE INDEX "Inquiry_senderId_idx" ON "Inquiry"("senderId");
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");
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
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReasons" TEXT,
    "flaggedAt" DATETIME,
    "moderationStatus" TEXT,
    "lastResponseAt" DATETIME,
    "responseDeadline" DATETIME,
    "upsellStage" INTEGER NOT NULL DEFAULT 0,
    "upsellSentAt" DATETIME,
    "listingTier" TEXT NOT NULL DEFAULT 'PRIVATE',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "inquiryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "expiresAt" DATETIME,
    CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Listing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("bodyType", "brand", "city", "color", "condition", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "district", "doorsCount", "engineCapacity", "enginePower", "equipment", "expiresAt", "fuelType", "highlights", "id", "inquiryCount", "isPremium", "listingType", "mileage", "model", "odometerStatus", "originCountry", "ownerCount", "premiumUntil", "price", "priceNegotiable", "publishedAt", "seatsCount", "serviceBook", "slug", "status", "stkValidUntil", "transmission", "updatedAt", "userId", "variant", "vatStatus", "vehicleId", "viewCount", "vin", "wantsBrokerHelp", "year") SELECT "bodyType", "brand", "city", "color", "condition", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "district", "doorsCount", "engineCapacity", "enginePower", "equipment", "expiresAt", "fuelType", "highlights", "id", "inquiryCount", "isPremium", "listingType", "mileage", "model", "odometerStatus", "originCountry", "ownerCount", "premiumUntil", "price", "priceNegotiable", "publishedAt", "seatsCount", "serviceBook", "slug", "status", "stkValidUntil", "transmission", "updatedAt", "userId", "variant", "vatStatus", "vehicleId", "viewCount", "vin", "wantsBrokerHelp", "year" FROM "Listing";
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
CREATE INDEX "Listing_flagged_idx" ON "Listing"("flagged");
CREATE INDEX "Listing_moderationStatus_idx" ON "Listing"("moderationStatus");
CREATE INDEX "Listing_listingTier_idx" ON "Listing"("listingTier");
CREATE TABLE "new_Watchdog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "minYear" INTEGER,
    "maxYear" INTEGER,
    "fuelType" TEXT,
    "bodyType" TEXT,
    "city" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastNotified" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Watchdog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Watchdog" ("active", "bodyType", "brand", "city", "createdAt", "fuelType", "id", "lastNotified", "maxPrice", "maxYear", "minPrice", "minYear", "model", "userId") SELECT "active", "bodyType", "brand", "city", "createdAt", "fuelType", "id", "lastNotified", "maxPrice", "maxYear", "minPrice", "minYear", "model", "userId" FROM "Watchdog";
DROP TABLE "Watchdog";
ALTER TABLE "new_Watchdog" RENAME TO "Watchdog";
CREATE INDEX "Watchdog_userId_idx" ON "Watchdog"("userId");
CREATE INDEX "Watchdog_email_idx" ON "Watchdog"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Reservation_listingId_idx" ON "Reservation"("listingId");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_stripeSessionId_idx" ON "Reservation"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Reservation_expiresAt_idx" ON "Reservation"("expiresAt");

-- CreateIndex
CREATE INDEX "CebiaReport_listingId_idx" ON "CebiaReport"("listingId");

-- CreateIndex
CREATE INDEX "CebiaReport_vin_idx" ON "CebiaReport"("vin");

-- CreateIndex
CREATE INDEX "CebiaReport_orderedById_idx" ON "CebiaReport"("orderedById");

-- CreateIndex
CREATE INDEX "CebiaReport_status_idx" ON "CebiaReport"("status");

-- CreateIndex
CREATE INDEX "ListingFeedConfig_userId_idx" ON "ListingFeedConfig"("userId");

-- CreateIndex
CREATE INDEX "ListingImportLog_configId_idx" ON "ListingImportLog"("configId");

-- CreateIndex
CREATE INDEX "ListingImportLog_status_idx" ON "ListingImportLog"("status");

-- CreateIndex
CREATE INDEX "FeedImportConfig_userId_idx" ON "FeedImportConfig"("userId");

-- CreateIndex
CREATE INDEX "FeedImportConfig_active_idx" ON "FeedImportConfig"("active");

-- CreateIndex
CREATE INDEX "FeedImportLog_configId_idx" ON "FeedImportLog"("configId");

-- CreateIndex
CREATE INDEX "FeedImportLog_createdAt_idx" ON "FeedImportLog"("createdAt");
