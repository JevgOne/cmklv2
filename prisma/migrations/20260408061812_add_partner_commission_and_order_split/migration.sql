-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "carmaklerFee" INTEGER,
ADD COLUMN     "commissionRateApplied" DECIMAL(4,2),
ADD COLUMN     "supplierPayout" INTEGER;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "commissionRate" DECIMAL(4,2) NOT NULL DEFAULT 15.00,
ADD COLUMN     "commissionRateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stripeAccountId" TEXT;

-- CreateTable
CREATE TABLE "PartnerCommissionLog" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "oldRate" DECIMAL(4,2) NOT NULL,
    "newRate" DECIMAL(4,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerCommissionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerCommissionLog_partnerId_changedAt_idx" ON "PartnerCommissionLog"("partnerId", "changedAt");

-- AddForeignKey
ALTER TABLE "PartnerCommissionLog" ADD CONSTRAINT "PartnerCommissionLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerCommissionLog" ADD CONSTRAINT "PartnerCommissionLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
