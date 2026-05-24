-- CreateTable
CREATE TABLE "seo_page_meta" (
    "id" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "canonical" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImageUrl" TEXT,
    "schemaTypesJson" TEXT,
    "lastAuditedAt" TIMESTAMP(3),
    "auditStatus" TEXT,
    "auditNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_page_meta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seo_page_meta_pagePath_key" ON "seo_page_meta"("pagePath");

-- CreateIndex
CREATE INDEX "seo_page_meta_section_idx" ON "seo_page_meta"("section");

-- CreateIndex
CREATE INDEX "seo_page_meta_pageType_idx" ON "seo_page_meta"("pageType");

-- CreateIndex
CREATE INDEX "seo_page_meta_auditStatus_idx" ON "seo_page_meta"("auditStatus");
