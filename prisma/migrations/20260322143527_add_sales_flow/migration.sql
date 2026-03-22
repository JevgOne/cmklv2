-- CreateTable
CREATE TABLE "VehicleInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerPhone" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "reply" TEXT,
    "repliedAt" DATETIME,
    "viewingDate" DATETIME,
    "viewingResult" TEXT,
    "offeredPrice" INTEGER,
    "agreedPrice" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleInquiry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VehicleInquiry_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DamageReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "images" TEXT,
    "repaired" BOOLEAN NOT NULL DEFAULT false,
    "repairedAt" DATETIME,
    "repairNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DamageReport_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DamageReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vin" TEXT NOT NULL,
    "vinLocked" BOOLEAN NOT NULL DEFAULT false,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "slug" TEXT,
    "fuelType" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "enginePower" INTEGER,
    "engineCapacity" INTEGER,
    "bodyType" TEXT,
    "color" TEXT,
    "doorsCount" INTEGER,
    "seatsCount" INTEGER,
    "drivetrain" TEXT,
    "ownerCount" INTEGER,
    "serviceBookStatus" TEXT,
    "odometerStatus" TEXT,
    "originCountry" TEXT,
    "condition" TEXT NOT NULL,
    "stkValidUntil" DATETIME,
    "serviceBook" BOOLEAN NOT NULL DEFAULT false,
    "price" INTEGER NOT NULL,
    "priceNegotiable" BOOLEAN NOT NULL DEFAULT true,
    "vatStatus" TEXT,
    "equipment" TEXT,
    "description" TEXT,
    "highlights" TEXT,
    "vehicleSource" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "sellerType" TEXT NOT NULL DEFAULT 'broker',
    "brokerId" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "leadSource" TEXT,
    "leadUrl" TEXT,
    "sellerName" TEXT,
    "sellerPhone" TEXT,
    "sellerEmail" TEXT,
    "commission" INTEGER,
    "inspectionData" TEXT,
    "overallRating" INTEGER,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "reservedFor" TEXT,
    "reservedAt" DATETIME,
    "reservedPrice" INTEGER,
    "soldPrice" INTEGER,
    "soldAt" DATETIME,
    "handoverCompleted" BOOLEAN NOT NULL DEFAULT false,
    "handoverDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "Vehicle_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("bodyType", "brand", "brokerId", "city", "color", "commission", "condition", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "district", "doorsCount", "drivetrain", "engineCapacity", "enginePower", "equipment", "fuelType", "highlights", "id", "inspectionData", "latitude", "leadSource", "leadUrl", "longitude", "mileage", "model", "odometerStatus", "originCountry", "overallRating", "ownerCount", "price", "priceNegotiable", "publishedAt", "rejectionReason", "seatsCount", "sellerEmail", "sellerName", "sellerPhone", "sellerType", "serviceBook", "serviceBookStatus", "slug", "status", "stkValidUntil", "transmission", "trustScore", "updatedAt", "variant", "vatStatus", "vehicleSource", "viewCount", "vin", "vinLocked", "year") SELECT "bodyType", "brand", "brokerId", "city", "color", "commission", "condition", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "district", "doorsCount", "drivetrain", "engineCapacity", "enginePower", "equipment", "fuelType", "highlights", "id", "inspectionData", "latitude", "leadSource", "leadUrl", "longitude", "mileage", "model", "odometerStatus", "originCountry", "overallRating", "ownerCount", "price", "priceNegotiable", "publishedAt", "rejectionReason", "seatsCount", "sellerEmail", "sellerName", "sellerPhone", "sellerType", "serviceBook", "serviceBookStatus", "slug", "status", "stkValidUntil", "transmission", "trustScore", "updatedAt", "variant", "vatStatus", "vehicleSource", "viewCount", "vin", "vinLocked", "year" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");
CREATE INDEX "Vehicle_brand_model_idx" ON "Vehicle"("brand", "model");
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");
CREATE INDEX "Vehicle_brokerId_idx" ON "Vehicle"("brokerId");
CREATE INDEX "Vehicle_price_idx" ON "Vehicle"("price");
CREATE INDEX "Vehicle_year_idx" ON "Vehicle"("year");
CREATE INDEX "Vehicle_sellerType_idx" ON "Vehicle"("sellerType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "VehicleInquiry_vehicleId_idx" ON "VehicleInquiry"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleInquiry_brokerId_idx" ON "VehicleInquiry"("brokerId");

-- CreateIndex
CREATE INDEX "VehicleInquiry_status_idx" ON "VehicleInquiry"("status");

-- CreateIndex
CREATE INDEX "VehicleInquiry_createdAt_idx" ON "VehicleInquiry"("createdAt");

-- CreateIndex
CREATE INDEX "DamageReport_vehicleId_idx" ON "DamageReport"("vehicleId");

-- CreateIndex
CREATE INDEX "DamageReport_reportedById_idx" ON "DamageReport"("reportedById");
