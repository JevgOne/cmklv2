-- CreateTable
CREATE TABLE "AutoServis" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ico" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "zip" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "web" TEXT,
    "openingHours" TEXT,
    "categories" TEXT[],
    "brands" TEXT[],
    "certifications" TEXT[],
    "images" TEXT[],
    "logo" TEXT,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "recommendRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'NEOFICIALNI',
    "insurancePartner" BOOLEAN NOT NULL DEFAULT false,
    "insuranceNames" TEXT[],
    "stkLines" INTEGER,
    "stkWaitDays" INTEGER,
    "stkOnlineBooking" BOOLEAN NOT NULL DEFAULT false,
    "stkEmissions" BOOLEAN NOT NULL DEFAULT true,
    "stkMotorcycles" BOOLEAN NOT NULL DEFAULT false,
    "stkTrailers" BOOLEAN NOT NULL DEFAULT false,
    "stkHeavy" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "addedById" TEXT,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoServis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServisReview" (
    "id" TEXT NOT NULL,
    "servisId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorCity" TEXT,
    "authorUserId" TEXT,
    "rating" INTEGER NOT NULL,
    "recommend" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "ratingQuality" INTEGER,
    "ratingPrice" INTEGER,
    "ratingSpeed" INTEGER,
    "ratingComm" INTEGER,
    "serviceType" TEXT,
    "vehicleBrand" TEXT,
    "visitDate" TIMESTAMP(3),
    "ratingWaitTime" INTEGER,
    "ratingFairness" INTEGER,
    "passedInspection" BOOLEAN,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServisReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutoServis_slug_key" ON "AutoServis"("slug");

-- CreateIndex
CREATE INDEX "AutoServis_city_idx" ON "AutoServis"("city");

-- CreateIndex
CREATE INDEX "AutoServis_isPublished_idx" ON "AutoServis"("isPublished");

-- CreateIndex
CREATE INDEX "AutoServis_averageRating_idx" ON "AutoServis"("averageRating");

-- CreateIndex
CREATE INDEX "AutoServis_reviewCount_idx" ON "AutoServis"("reviewCount");

-- CreateIndex
CREATE INDEX "AutoServis_isFeatured_idx" ON "AutoServis"("isFeatured");

-- CreateIndex
CREATE INDEX "AutoServis_isVerified_idx" ON "AutoServis"("isVerified");

-- CreateIndex
CREATE INDEX "AutoServis_tier_idx" ON "AutoServis"("tier");

-- CreateIndex
CREATE INDEX "AutoServis_insurancePartner_idx" ON "AutoServis"("insurancePartner");

-- CreateIndex
CREATE INDEX "ServisReview_servisId_idx" ON "ServisReview"("servisId");

-- CreateIndex
CREATE INDEX "ServisReview_isPublished_idx" ON "ServisReview"("isPublished");

-- CreateIndex
CREATE INDEX "ServisReview_rating_idx" ON "ServisReview"("rating");

-- CreateIndex
CREATE INDEX "ServisReview_authorUserId_idx" ON "ServisReview"("authorUserId");

-- AddForeignKey
ALTER TABLE "AutoServis" ADD CONSTRAINT "AutoServis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoServis" ADD CONSTRAINT "AutoServis_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServisReview" ADD CONSTRAINT "ServisReview_servisId_fkey" FOREIGN KEY ("servisId") REFERENCES "AutoServis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServisReview" ADD CONSTRAINT "ServisReview_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
