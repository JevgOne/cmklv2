-- AlterTable: Add dealer CRM fields to Inquiry
ALTER TABLE "Inquiry" ADD COLUMN "viewingDate" TIMESTAMP(3),
ADD COLUMN "viewingResult" TEXT,
ADD COLUMN "note" TEXT,
ADD COLUMN "priority" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
