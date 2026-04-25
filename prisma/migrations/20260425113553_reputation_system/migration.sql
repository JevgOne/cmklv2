-- Reputation System Migration (idempotent for production)

-- Clean up: drop BrokerSalesRecord if it exists (dev artifact from rename migration)
DROP TABLE IF EXISTS "BrokerSalesRecord";

-- Clean up: drop totalSalesVolume if it exists (dev artifact)
ALTER TABLE "User" DROP COLUMN IF EXISTS "totalSalesVolume";

-- Ensure BrokerPointTransaction exists with correct schema
CREATE TABLE IF NOT EXISTS "BrokerPointTransaction" (
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

CREATE INDEX IF NOT EXISTS "BrokerPointTransaction_brokerId_idx" ON "BrokerPointTransaction"("brokerId");
CREATE INDEX IF NOT EXISTS "BrokerPointTransaction_type_idx" ON "BrokerPointTransaction"("type");
CREATE INDEX IF NOT EXISTS "BrokerPointTransaction_createdAt_idx" ON "BrokerPointTransaction"("createdAt");

-- BrokerPointTransaction FK (skip if exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BrokerPointTransaction_brokerId_fkey') THEN
    ALTER TABLE "BrokerPointTransaction" ADD CONSTRAINT "BrokerPointTransaction_brokerId_fkey"
      FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- NEW: Reputation System Tables
-- ============================================

-- CreateTable: TrustScore
CREATE TABLE IF NOT EXISTS "TrustScore" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "TrustScore_userId_key" ON "TrustScore"("userId");
CREATE INDEX IF NOT EXISTS "TrustScore_score_idx" ON "TrustScore"("score");
CREATE INDEX IF NOT EXISTS "TrustScore_tier_idx" ON "TrustScore"("tier");

ALTER TABLE "TrustScore" DROP CONSTRAINT IF EXISTS "TrustScore_userId_fkey";
ALTER TABLE "TrustScore" ADD CONSTRAINT "TrustScore_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: SkillTag
CREATE TABLE IF NOT EXISTS "SkillTag" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "giverId" TEXT,
    "tag" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillTag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SkillTag_targetId_context_idx" ON "SkillTag"("targetId", "context");
CREATE INDEX IF NOT EXISTS "SkillTag_tag_idx" ON "SkillTag"("tag");
CREATE UNIQUE INDEX IF NOT EXISTS "SkillTag_targetId_giverId_tag_key" ON "SkillTag"("targetId", "giverId", "tag");

ALTER TABLE "SkillTag" DROP CONSTRAINT IF EXISTS "SkillTag_targetId_fkey";
ALTER TABLE "SkillTag" ADD CONSTRAINT "SkillTag_targetId_fkey"
  FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillTag" DROP CONSTRAINT IF EXISTS "SkillTag_giverId_fkey";
ALTER TABLE "SkillTag" ADD CONSTRAINT "SkillTag_giverId_fkey"
  FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: AutoBadge
CREATE TABLE IF NOT EXISTS "AutoBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoBadge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AutoBadge_userId_idx" ON "AutoBadge"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "AutoBadge_userId_badge_key" ON "AutoBadge"("userId", "badge");

ALTER TABLE "AutoBadge" DROP CONSTRAINT IF EXISTS "AutoBadge_userId_fkey";
ALTER TABLE "AutoBadge" ADD CONSTRAINT "AutoBadge_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
