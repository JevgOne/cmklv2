-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "warranty" TEXT;

-- CreateIndex
CREATE INDEX "Part_manufacturer_idx" ON "Part"("manufacturer");
