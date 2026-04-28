-- AlterTable: make userId optional for guest comments
ALTER TABLE "ProfileComment" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable: add guest fields
ALTER TABLE "ProfileComment" ADD COLUMN "authorName" TEXT;
ALTER TABLE "ProfileComment" ADD COLUMN "authorEmail" TEXT;
ALTER TABLE "ProfileComment" ADD COLUMN "guestIp" TEXT;

-- AlterTable: change isHidden default to true (moderation-first)
ALTER TABLE "ProfileComment" ALTER COLUMN "isHidden" SET DEFAULT true;

-- CreateIndex
CREATE INDEX "ProfileComment_guestIp_idx" ON "ProfileComment"("guestIp");
