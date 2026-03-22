/*
  Warnings:

  - You are about to drop the column `content` on the `SellerCommunication` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `SellerCommunication` table. All the data in the column will be lost.
  - Added the required column `summary` to the `SellerCommunication` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SellerCommunication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT,
    "summary" TEXT NOT NULL,
    "duration" INTEGER,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerCommunication_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "SellerContact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SellerCommunication_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SellerCommunication" ("brokerId", "contactId", "createdAt", "id", "type") SELECT "brokerId", "contactId", "createdAt", "id", "type" FROM "SellerCommunication";
DROP TABLE "SellerCommunication";
ALTER TABLE "new_SellerCommunication" RENAME TO "SellerCommunication";
CREATE INDEX "SellerCommunication_contactId_idx" ON "SellerCommunication"("contactId");
CREATE INDEX "SellerCommunication_brokerId_idx" ON "SellerCommunication"("brokerId");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SellerContact_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SellerContact" ("brokerId", "createdAt", "email", "id", "name", "phone", "updatedAt") SELECT "brokerId", "createdAt", "email", "id", "name", "phone", "updatedAt" FROM "SellerContact";
DROP TABLE "SellerContact";
ALTER TABLE "new_SellerContact" RENAME TO "SellerContact";
CREATE INDEX "SellerContact_brokerId_idx" ON "SellerContact"("brokerId");
CREATE INDEX "SellerContact_phone_idx" ON "SellerContact"("phone");
CREATE INDEX "SellerContact_nextFollowUp_idx" ON "SellerContact"("nextFollowUp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
