-- CreateTable
CREATE TABLE "SellerNotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerContactId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SellerNotificationPreference_sellerContactId_fkey" FOREIGN KEY ("sellerContactId") REFERENCES "SellerContact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SellerContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brokerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "note" TEXT,
    "totalVehicles" INTEGER NOT NULL DEFAULT 0,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "lastContactAt" DATETIME,
    "nextFollowUp" DATETIME,
    "followUpNote" TEXT,
    "notificationToken" TEXT,
    "smsOptOut" BOOLEAN NOT NULL DEFAULT false,
    "emailOptOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SellerContact_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SellerContact" ("address", "brokerId", "city", "createdAt", "email", "followUpNote", "id", "lastContactAt", "name", "nextFollowUp", "note", "phone", "totalSold", "totalVehicles", "updatedAt") SELECT "address", "brokerId", "city", "createdAt", "email", "followUpNote", "id", "lastContactAt", "name", "nextFollowUp", "note", "phone", "totalSold", "totalVehicles", "updatedAt" FROM "SellerContact";
DROP TABLE "SellerContact";
ALTER TABLE "new_SellerContact" RENAME TO "SellerContact";
CREATE UNIQUE INDEX "SellerContact_notificationToken_key" ON "SellerContact"("notificationToken");
CREATE INDEX "SellerContact_brokerId_idx" ON "SellerContact"("brokerId");
CREATE INDEX "SellerContact_phone_idx" ON "SellerContact"("phone");
CREATE INDEX "SellerContact_nextFollowUp_idx" ON "SellerContact"("nextFollowUp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SellerNotificationPreference_sellerContactId_idx" ON "SellerNotificationPreference"("sellerContactId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerNotificationPreference_sellerContactId_eventType_key" ON "SellerNotificationPreference"("sellerContactId", "eventType");
