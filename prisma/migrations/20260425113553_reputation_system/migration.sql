/*
  Warnings:

  - You are about to drop the column `totalSalesVolume` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BrokerSalesRecord` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BrokerSalesRecord" DROP CONSTRAINT "BrokerSalesRecord_brokerId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "totalSalesVolume";

-- DropTable
DROP TABLE "BrokerSalesRecord";

-- CreateTable
CREATE TABLE "BrokerPointTransaction" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "vehicleId" TEXT,
    "commissionId" TEXT,
    "description" TEXT,
    "revenueAtTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerPointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'NEW',
    "brokerScore" INTEGER,
    "supplierScore" INTEGER,
    "dealerScore" INTEGER,
    "investorScore" INTEGER,
    "sellerScore" INTEGER,
    "lastActiveAt" TIMESTAMP(3),
    "avgResponseMinutes" INTEGER,
    "responseRate" INTEGER,
    "metricsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTag" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "giverId" TEXT,
    "tag" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrokerPointTransaction_brokerId_idx" ON "BrokerPointTransaction"("brokerId");

-- CreateIndex
CREATE INDEX "BrokerPointTransaction_type_idx" ON "BrokerPointTransaction"("type");

-- CreateIndex
CREATE INDEX "BrokerPointTransaction_createdAt_idx" ON "BrokerPointTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrustScore_userId_key" ON "TrustScore"("userId");

-- CreateIndex
CREATE INDEX "TrustScore_score_idx" ON "TrustScore"("score");

-- CreateIndex
CREATE INDEX "TrustScore_tier_idx" ON "TrustScore"("tier");

-- CreateIndex
CREATE INDEX "SkillTag_targetId_context_idx" ON "SkillTag"("targetId", "context");

-- CreateIndex
CREATE INDEX "SkillTag_tag_idx" ON "SkillTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTag_targetId_giverId_tag_key" ON "SkillTag"("targetId", "giverId", "tag");

-- CreateIndex
CREATE INDEX "AutoBadge_userId_idx" ON "AutoBadge"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AutoBadge_userId_badge_key" ON "AutoBadge"("userId", "badge");

-- AddForeignKey
ALTER TABLE "BrokerPointTransaction" ADD CONSTRAINT "BrokerPointTransaction_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScore" ADD CONSTRAINT "TrustScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTag" ADD CONSTRAINT "SkillTag_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillTag" ADD CONSTRAINT "SkillTag_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoBadge" ADD CONSTRAINT "AutoBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
