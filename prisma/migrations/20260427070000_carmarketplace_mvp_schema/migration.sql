-- AlterTable: FlipOpportunity — nová pole pro CarMarketplace MVP
ALTER TABLE "FlipOpportunity" ADD COLUMN "agreedDealerSharePct" INTEGER;
ALTER TABLE "FlipOpportunity" ADD COLUMN "agreedInvestorSharePct" INTEGER;
ALTER TABLE "FlipOpportunity" ADD COLUMN "carmaklerFeePct" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "FlipOpportunity" ADD COLUMN "dealScore" INTEGER;
ALTER TABLE "FlipOpportunity" ADD COLUMN "dealScoreUpdatedAt" TIMESTAMP(3);
ALTER TABLE "FlipOpportunity" ADD COLUMN "dealerRating" DOUBLE PRECISION;
ALTER TABLE "FlipOpportunity" ADD COLUMN "repairProgress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "FlipOpportunity" ADD COLUMN "repairMilestones" TEXT;

-- CreateTable: DealNegotiation
CREATE TABLE "DealNegotiation" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "fromRole" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "dealerSharePct" INTEGER NOT NULL,
    "investorSharePct" INTEGER NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "round" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealNegotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DealComment
CREATE TABLE "DealComment" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealNegotiation_opportunityId_idx" ON "DealNegotiation"("opportunityId");
CREATE INDEX "DealNegotiation_fromUserId_idx" ON "DealNegotiation"("fromUserId");
CREATE INDEX "DealNegotiation_toUserId_idx" ON "DealNegotiation"("toUserId");
CREATE INDEX "DealNegotiation_status_idx" ON "DealNegotiation"("status");

CREATE INDEX "DealComment_opportunityId_idx" ON "DealComment"("opportunityId");
CREATE INDEX "DealComment_userId_idx" ON "DealComment"("userId");
CREATE INDEX "DealComment_parentId_idx" ON "DealComment"("parentId");

-- AddForeignKey
ALTER TABLE "DealNegotiation" ADD CONSTRAINT "DealNegotiation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "FlipOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DealNegotiation" ADD CONSTRAINT "DealNegotiation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DealNegotiation" ADD CONSTRAINT "DealNegotiation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DealComment" ADD CONSTRAINT "DealComment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "FlipOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DealComment" ADD CONSTRAINT "DealComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DealComment" ADD CONSTRAINT "DealComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DealComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
