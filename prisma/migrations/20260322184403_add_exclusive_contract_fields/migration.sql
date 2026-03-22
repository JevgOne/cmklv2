-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "exclusiveContractId" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN "exclusiveUntil" DATETIME;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "stripePaymentIntent" TEXT,
    "variableSymbol" TEXT,
    "confirmedAt" DATETIME,
    "confirmedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SellerPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerBankAccount" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "commissionAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "bankReference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerPayout_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SellerPayout_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrokerPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brokerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "invoiceUrl" TEXT,
    "invoiceNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_INVOICE',
    "approvedById" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrokerPayout_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BrokerPayout_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brokerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "salePrice" INTEGER NOT NULL,
    "commission" INTEGER NOT NULL,
    "rate" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "brokerShare" INTEGER,
    "companyShare" INTEGER,
    "managerBonus" INTEGER,
    "payoutId" TEXT,
    "soldAt" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commission_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Commission_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Commission_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "BrokerPayout" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Commission" ("brokerId", "commission", "createdAt", "id", "paidAt", "rate", "salePrice", "soldAt", "status", "updatedAt", "vehicleId") SELECT "brokerId", "commission", "createdAt", "id", "paidAt", "rate", "salePrice", "soldAt", "status", "updatedAt", "vehicleId" FROM "Commission";
DROP TABLE "Commission";
ALTER TABLE "new_Commission" RENAME TO "Commission";
CREATE INDEX "Commission_brokerId_idx" ON "Commission"("brokerId");
CREATE INDEX "Commission_status_idx" ON "Commission"("status");
CREATE INDEX "Commission_soldAt_idx" ON "Commission"("soldAt");
CREATE INDEX "Commission_payoutId_idx" ON "Commission"("payoutId");
CREATE TABLE "new_Contract" (
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
    "exclusiveDuration" INTEGER,
    "exclusiveStartDate" DATETIME,
    "exclusiveEndDate" DATETIME,
    "earlyTermination" BOOLEAN NOT NULL DEFAULT false,
    "terminationReason" TEXT,
    "terminationDate" DATETIME,
    "violationReported" BOOLEAN NOT NULL DEFAULT false,
    "violationDetails" TEXT,
    "penaltyAmount" INTEGER,
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
INSERT INTO "new_Contract" ("brokerId", "brokerSignature", "commission", "content", "createdAt", "id", "pdfUrl", "price", "sellerAddress", "sellerBankAccount", "sellerEmail", "sellerIdCard", "sellerIdNumber", "sellerName", "sellerPhone", "sellerSignature", "signedAt", "signedLocation", "status", "type", "updatedAt", "vehicleId") SELECT "brokerId", "brokerSignature", "commission", "content", "createdAt", "id", "pdfUrl", "price", "sellerAddress", "sellerBankAccount", "sellerEmail", "sellerIdCard", "sellerIdNumber", "sellerName", "sellerPhone", "sellerSignature", "signedAt", "signedLocation", "status", "type", "updatedAt", "vehicleId" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE INDEX "Contract_brokerId_idx" ON "Contract"("brokerId");
CREATE INDEX "Contract_vehicleId_idx" ON "Contract"("vehicleId");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Payment_vehicleId_idx" ON "Payment"("vehicleId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_stripeSessionId_idx" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Payment_variableSymbol_idx" ON "Payment"("variableSymbol");

-- CreateIndex
CREATE INDEX "SellerPayout_vehicleId_idx" ON "SellerPayout"("vehicleId");

-- CreateIndex
CREATE INDEX "SellerPayout_paymentId_idx" ON "SellerPayout"("paymentId");

-- CreateIndex
CREATE INDEX "SellerPayout_status_idx" ON "SellerPayout"("status");

-- CreateIndex
CREATE INDEX "BrokerPayout_brokerId_idx" ON "BrokerPayout"("brokerId");

-- CreateIndex
CREATE INDEX "BrokerPayout_period_idx" ON "BrokerPayout"("period");

-- CreateIndex
CREATE INDEX "BrokerPayout_status_idx" ON "BrokerPayout"("status");
