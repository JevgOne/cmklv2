-- CreateTable
CREATE TABLE "SellerContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brokerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SellerContact_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SellerCommunication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerCommunication_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "SellerContact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SellerCommunication_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "exclusiveUntil" DATETIME,
    "exclusiveContractId" TEXT,
    "reservedFor" TEXT,
    "reservedAt" DATETIME,
    "reservedPrice" INTEGER,
    "soldPrice" INTEGER,
    "soldAt" DATETIME,
    "handoverCompleted" BOOLEAN NOT NULL DEFAULT false,
    "handoverDate" DATETIME,
    "sellerContactId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "Vehicle_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Vehicle_sellerContactId_fkey" FOREIGN KEY ("sellerContactId") REFERENCES "SellerContact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("bodyType", "brand", "brokerId", "city", "color", "commission", "condition", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "district", "doorsCount", "drivetrain", "engineCapacity", "enginePower", "equipment", "exclusiveContractId", "exclusiveUntil", "fuelType", "handoverCompleted", "handoverDate", "highlights", "id", "inspectionData", "latitude", "leadSource", "leadUrl", "longitude", "mileage", "model", "odometerStatus", "originCountry", "overallRating", "ownerCount", "price", "priceNegotiable", "publishedAt", "rejectionReason", "reservedAt", "reservedFor", "reservedPrice", "seatsCount", "sellerEmail", "sellerName", "sellerPhone", "sellerType", "serviceBook", "serviceBookStatus", "slug", "soldAt", "soldPrice", "status", "stkValidUntil", "transmission", "trustScore", "updatedAt", "variant", "vatStatus", "vehicleSource", "viewCount", "vin", "vinLocked", "year") SELECT "bodyType", "brand", "brokerId", "city", "color", "commission", "condition", "contactEmail", "contactName", "contactPhone", "createdAt", "description", "district", "doorsCount", "drivetrain", "engineCapacity", "enginePower", "equipment", "exclusiveContractId", "exclusiveUntil", "fuelType", "handoverCompleted", "handoverDate", "highlights", "id", "inspectionData", "latitude", "leadSource", "leadUrl", "longitude", "mileage", "model", "odometerStatus", "originCountry", "overallRating", "ownerCount", "price", "priceNegotiable", "publishedAt", "rejectionReason", "reservedAt", "reservedFor", "reservedPrice", "seatsCount", "sellerEmail", "sellerName", "sellerPhone", "sellerType", "serviceBook", "serviceBookStatus", "slug", "soldAt", "soldPrice", "status", "stkValidUntil", "transmission", "trustScore", "updatedAt", "variant", "vatStatus", "vehicleSource", "viewCount", "vin", "vinLocked", "year" FROM "Vehicle";
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
CREATE INDEX "SellerContact_brokerId_idx" ON "SellerContact"("brokerId");

-- CreateIndex
CREATE INDEX "SellerCommunication_contactId_idx" ON "SellerCommunication"("contactId");

-- CreateIndex
CREATE INDEX "SellerCommunication_brokerId_idx" ON "SellerCommunication"("brokerId");
