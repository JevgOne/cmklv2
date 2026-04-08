-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "stripeAccountUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeDetailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeDisabledReason" TEXT,
ADD COLUMN     "stripeOnboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "stripeOnboardingStartedAt" TIMESTAMP(3),
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeRequirementsCurrentlyDue" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Partner_stripeAccountId_idx" ON "Partner"("stripeAccountId");

-- CreateIndex
CREATE INDEX "Partner_stripePayoutsEnabled_idx" ON "Partner"("stripePayoutsEnabled");
