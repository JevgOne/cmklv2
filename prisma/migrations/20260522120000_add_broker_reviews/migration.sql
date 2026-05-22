-- CreateTable
CREATE TABLE "BrokerReview" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorCity" TEXT,
    "authorUserId" TEXT,
    "rating" INTEGER NOT NULL,
    "recommend" BOOLEAN NOT NULL DEFAULT true,
    "text" TEXT NOT NULL,
    "ratingCommunication" INTEGER,
    "ratingSpeed" INTEGER,
    "ratingFairness" INTEGER,
    "ratingProfessionalism" INTEGER,
    "transactionType" TEXT,
    "vehicleBrand" TEXT,
    "vehicleModel" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "vehicleId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerReview_pkey" PRIMARY KEY ("id")
);

-- Add aggregate columns to User
ALTER TABLE "User" ADD COLUMN "brokerAvgRating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "brokerReviewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "brokerRecommendRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "BrokerReview_brokerId_idx" ON "BrokerReview"("brokerId");
CREATE INDEX "BrokerReview_isPublished_idx" ON "BrokerReview"("isPublished");
CREATE INDEX "BrokerReview_rating_idx" ON "BrokerReview"("rating");
CREATE INDEX "BrokerReview_authorUserId_idx" ON "BrokerReview"("authorUserId");

-- AddForeignKey
ALTER TABLE "BrokerReview" ADD CONSTRAINT "BrokerReview_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrokerReview" ADD CONSTRAINT "BrokerReview_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
