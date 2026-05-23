-- AlterTable
ALTER TABLE "AutoServis" ADD COLUMN "officialStationId" TEXT,
ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "AutoServis_officialStationId_key" ON "AutoServis"("officialStationId");

-- CreateIndex
CREATE INDEX "AutoServis_latitude_longitude_idx" ON "AutoServis"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "AutoServis_region_idx" ON "AutoServis"("region");
