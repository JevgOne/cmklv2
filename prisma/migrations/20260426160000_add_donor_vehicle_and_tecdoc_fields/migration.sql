-- CreateTable
CREATE TABLE "DonorVehicle" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "kTypeId" INTEGER,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "variant" TEXT,
    "engine" TEXT,
    "fuel" TEXT,
    "transmission" TEXT,
    "disposalType" TEXT NOT NULL,
    "damageZones" JSONB,
    "photos" JSONB,
    "totalParts" INTEGER NOT NULL DEFAULT 0,
    "publishedParts" INTEGER NOT NULL DEFAULT 0,
    "totalValue" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorVehicle_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Part — add TecDoc + donor car fields
ALTER TABLE "Part" ADD COLUMN "tecdocArticleId" INTEGER;
ALTER TABLE "Part" ADD COLUMN "tecdocProductGroup" TEXT;
ALTER TABLE "Part" ADD COLUMN "donorVehicleId" TEXT;
ALTER TABLE "Part" ADD COLUMN "partGrade" TEXT;

-- CreateIndex
CREATE INDEX "DonorVehicle_supplierId_idx" ON "DonorVehicle"("supplierId");
CREATE INDEX "DonorVehicle_vin_idx" ON "DonorVehicle"("vin");
CREATE INDEX "DonorVehicle_kTypeId_idx" ON "DonorVehicle"("kTypeId");
CREATE INDEX "DonorVehicle_status_idx" ON "DonorVehicle"("status");
CREATE INDEX "Part_donorVehicleId_idx" ON "Part"("donorVehicleId");
CREATE INDEX "Part_tecdocArticleId_idx" ON "Part"("tecdocArticleId");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_donorVehicleId_fkey" FOREIGN KEY ("donorVehicleId") REFERENCES "DonorVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorVehicle" ADD CONSTRAINT "DonorVehicle_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
