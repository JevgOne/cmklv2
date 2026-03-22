-- CreateTable
CREATE TABLE "PartsFeedConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "feedFormat" TEXT NOT NULL DEFAULT 'XML',
    "fieldMapping" TEXT,
    "updateFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "markupType" TEXT NOT NULL DEFAULT 'PERCENT',
    "markupValue" REAL NOT NULL DEFAULT 25,
    "categoryMarkups" TEXT,
    "defaultPartType" TEXT NOT NULL DEFAULT 'AFTERMARKET',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastImportAt" DATETIME,
    "lastImportCount" INTEGER,
    "lastImportErrors" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartsFeedConfig_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartsFeedImportLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "feedConfigId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "deactivated" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartsFeedImportLog_feedConfigId_fkey" FOREIGN KEY ("feedConfigId") REFERENCES "PartsFeedConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ico" TEXT,
    "address" TEXT,
    "city" TEXT,
    "region" TEXT,
    "zip" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "phone" TEXT,
    "email" TEXT,
    "web" TEXT,
    "contactPerson" TEXT,
    "estimatedSize" TEXT,
    "googleRating" REAL,
    "googleReviewCount" INTEGER,
    "source" TEXT,
    "notes" TEXT,
    "logo" TEXT,
    "description" TEXT,
    "openingHours" TEXT,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEOSLOVENY',
    "score" INTEGER NOT NULL DEFAULT 0,
    "rejectionReason" TEXT,
    "managerId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Partner_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Partner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartnerActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "nextContactDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerActivity_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PartnerActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PartnerLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVY',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartnerLead_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PartnerLead_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "partNumber" TEXT,
    "oemNumber" TEXT,
    "partType" TEXT NOT NULL DEFAULT 'USED',
    "condition" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "wholesalePrice" INTEGER,
    "markupPercent" REAL,
    "currency" TEXT NOT NULL DEFAULT 'CZK',
    "vatIncluded" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "weight" REAL,
    "dimensions" TEXT,
    "compatibleBrands" TEXT,
    "compatibleModels" TEXT,
    "compatibleYearFrom" INTEGER,
    "compatibleYearTo" INTEGER,
    "universalFit" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "feedConfigId" TEXT,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Part_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Part_feedConfigId_fkey" FOREIGN KEY ("feedConfigId") REFERENCES "PartsFeedConfig" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Part" ("category", "compatibleBrands", "compatibleModels", "compatibleYearFrom", "compatibleYearTo", "condition", "createdAt", "currency", "description", "dimensions", "id", "name", "oemNumber", "partNumber", "price", "slug", "status", "stock", "supplierId", "universalFit", "updatedAt", "vatIncluded", "viewCount", "weight") SELECT "category", "compatibleBrands", "compatibleModels", "compatibleYearFrom", "compatibleYearTo", "condition", "createdAt", "currency", "description", "dimensions", "id", "name", "oemNumber", "partNumber", "price", "slug", "status", "stock", "supplierId", "universalFit", "updatedAt", "vatIncluded", "viewCount", "weight" FROM "Part";
DROP TABLE "Part";
ALTER TABLE "new_Part" RENAME TO "Part";
CREATE UNIQUE INDEX "Part_slug_key" ON "Part"("slug");
CREATE INDEX "Part_supplierId_idx" ON "Part"("supplierId");
CREATE INDEX "Part_category_idx" ON "Part"("category");
CREATE INDEX "Part_status_idx" ON "Part"("status");
CREATE INDEX "Part_price_idx" ON "Part"("price");
CREATE INDEX "Part_partType_idx" ON "Part"("partType");
CREATE INDEX "Part_feedConfigId_idx" ON "Part"("feedConfigId");
CREATE INDEX "Part_externalId_idx" ON "Part"("externalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PartsFeedConfig_supplierId_idx" ON "PartsFeedConfig"("supplierId");

-- CreateIndex
CREATE INDEX "PartsFeedConfig_isActive_idx" ON "PartsFeedConfig"("isActive");

-- CreateIndex
CREATE INDEX "PartsFeedConfig_updateFrequency_idx" ON "PartsFeedConfig"("updateFrequency");

-- CreateIndex
CREATE INDEX "PartsFeedImportLog_feedConfigId_idx" ON "PartsFeedImportLog"("feedConfigId");

-- CreateIndex
CREATE INDEX "PartsFeedImportLog_createdAt_idx" ON "PartsFeedImportLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_ico_key" ON "Partner"("ico");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner"("userId");

-- CreateIndex
CREATE INDEX "Partner_type_idx" ON "Partner"("type");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- CreateIndex
CREATE INDEX "Partner_managerId_idx" ON "Partner"("managerId");

-- CreateIndex
CREATE INDEX "Partner_city_idx" ON "Partner"("city");

-- CreateIndex
CREATE INDEX "Partner_region_idx" ON "Partner"("region");

-- CreateIndex
CREATE INDEX "Partner_score_idx" ON "Partner"("score");

-- CreateIndex
CREATE INDEX "PartnerActivity_partnerId_idx" ON "PartnerActivity"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerActivity_createdAt_idx" ON "PartnerActivity"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerLead_partnerId_idx" ON "PartnerLead"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerLead_status_idx" ON "PartnerLead"("status");
