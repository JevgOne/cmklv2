-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "vehicleId" TEXT,
    "brokerId" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerPhone" TEXT NOT NULL,
    "sellerEmail" TEXT,
    "sellerAddress" TEXT,
    "sellerIdNumber" TEXT,
    "sellerIdCard" TEXT,
    "sellerBankAccount" TEXT,
    "content" TEXT,
    "price" INTEGER,
    "commission" INTEGER,
    "sellerSignature" TEXT,
    "brokerSignature" TEXT,
    "signedAt" DATETIME,
    "signedLocation" TEXT,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Contract_brokerId_idx" ON "Contract"("brokerId");

-- CreateIndex
CREATE INDEX "Contract_vehicleId_idx" ON "Contract"("vehicleId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");
