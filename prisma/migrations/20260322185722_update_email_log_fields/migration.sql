-- AlterTable
ALTER TABLE "EmailLog" ADD COLUMN "customText" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "recipientName" TEXT;

-- CreateIndex
CREATE INDEX "EmailLog_templateType_idx" ON "EmailLog"("templateType");
