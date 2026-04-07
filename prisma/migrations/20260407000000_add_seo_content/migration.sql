-- CreateTable
CREATE TABLE "SeoContent" (
    "id" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "category" TEXT,
    "h1" TEXT NOT NULL,
    "metaTitle" TEXT NOT NULL,
    "metaDesc" TEXT NOT NULL,
    "introHtml" TEXT NOT NULL,
    "sectionsJson" TEXT NOT NULL,
    "faqJson" TEXT NOT NULL,
    "aiSnippetText" TEXT NOT NULL,
    "quickFacts" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "generatedBy" TEXT NOT NULL DEFAULT 'template',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeoContent_pageType_idx" ON "SeoContent"("pageType");

-- CreateIndex
CREATE INDEX "SeoContent_brand_idx" ON "SeoContent"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "SeoContent_pageType_brand_model_year_category_key" ON "SeoContent"("pageType", "brand", "model", "year", "category");
