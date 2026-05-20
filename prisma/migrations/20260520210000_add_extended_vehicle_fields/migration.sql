-- AlterTable: Add extended vehicle fields to ScoutLead
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleVin" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleLicensePlate" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleFirstRegistration" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleFirstOwner" BOOLEAN;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleCrashedInPast" BOOLEAN;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleServiceBook" BOOLEAN;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleStkDate" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleCountryOfOrigin" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleCondition" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleDrive" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleGearboxLevels" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleEuroLevel" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleConsumption" DOUBLE PRECISION;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleCapacity" INTEGER;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleAirbags" INTEGER;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleAircondition" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleColorTone" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleColorType" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleModelDetail" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehiclePriceWithoutVat" INTEGER;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleVatDeductible" BOOLEAN;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleDistrict" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "vehicleVideos" TEXT;
ALTER TABLE "ScoutLead" ADD COLUMN "completenessScore" INTEGER DEFAULT 0;

-- CreateIndex
CREATE INDEX "ScoutLead_vehicleVin_idx" ON "ScoutLead"("vehicleVin");
