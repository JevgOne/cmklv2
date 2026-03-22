-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "token" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitation_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invitation_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatar" TEXT,
    "role" TEXT NOT NULL DEFAULT 'BROKER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "managerId" TEXT,
    "regionId" TEXT,
    "specializations" TEXT,
    "cities" TEXT,
    "bio" TEXT,
    "slug" TEXT,
    "bankAccount" TEXT,
    "documents" TEXT,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "quizScore" INTEGER,
    "brokerContractUrl" TEXT,
    "brokerSignature" TEXT,
    "accountType" TEXT,
    "companyName" TEXT,
    "ico" TEXT,
    "icoVerified" BOOLEAN NOT NULL DEFAULT false,
    "logo" TEXT,
    "emailVerified" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("accountType", "avatar", "bio", "cities", "companyName", "createdAt", "email", "emailVerified", "firstName", "ico", "icoVerified", "id", "lastName", "logo", "managerId", "passwordHash", "phone", "regionId", "role", "slug", "specializations", "status", "updatedAt") SELECT "accountType", "avatar", "bio", "cities", "companyName", "createdAt", "email", "emailVerified", "firstName", "ico", "icoVerified", "id", "lastName", "logo", "managerId", "passwordHash", "phone", "regionId", "role", "slug", "specializations", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_managerId_idx" ON "User"("managerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_managerId_idx" ON "Invitation"("managerId");

-- CreateIndex
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");
