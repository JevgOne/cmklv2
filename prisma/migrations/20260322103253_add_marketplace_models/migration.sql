-- CreateTable
CREATE TABLE "FlipOpportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealerId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "vin" TEXT,
    "condition" TEXT NOT NULL,
    "photos" TEXT,
    "purchasePrice" INTEGER NOT NULL,
    "repairCost" INTEGER NOT NULL,
    "estimatedSalePrice" INTEGER NOT NULL,
    "repairDescription" TEXT,
    "repairPhotos" TEXT,
    "actualSalePrice" INTEGER,
    "soldAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "fundedAmount" INTEGER NOT NULL DEFAULT 0,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FlipOpportunity_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investorId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentReference" TEXT,
    "returnAmount" INTEGER,
    "paidOutAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Investment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Investment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "FlipOpportunity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FlipOpportunity_dealerId_idx" ON "FlipOpportunity"("dealerId");

-- CreateIndex
CREATE INDEX "FlipOpportunity_status_idx" ON "FlipOpportunity"("status");

-- CreateIndex
CREATE INDEX "Investment_investorId_idx" ON "Investment"("investorId");

-- CreateIndex
CREATE INDEX "Investment_opportunityId_idx" ON "Investment"("opportunityId");

-- CreateIndex
CREATE INDEX "Investment_paymentStatus_idx" ON "Investment"("paymentStatus");
