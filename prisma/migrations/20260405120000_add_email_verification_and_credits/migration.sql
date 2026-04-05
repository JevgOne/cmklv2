-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_email_idx" ON "EmailVerificationToken"("email");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token");

-- AlterTable: Order — delivery method
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryMethod" TEXT NOT NULL DEFAULT 'PPL';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "zasilkovnaPointId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "zasilkovnaPointName" TEXT;

-- AlterTable: User — listing credits
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "listingCredits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: searchVector (tsvector) for fulltext search
ALTER TABLE "Part" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Fulltext: pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fulltext: GIN indexes
CREATE INDEX IF NOT EXISTS "Part_searchVector_idx" ON "Part" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "Vehicle_searchVector_idx" ON "Vehicle" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "Listing_searchVector_idx" ON "Listing" USING GIN ("searchVector");

-- Fulltext: Trigram indexes
CREATE INDEX IF NOT EXISTS "Part_name_trgm_idx" ON "Part" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Vehicle_brand_trgm_idx" ON "Vehicle" USING GIN ("brand" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Vehicle_model_trgm_idx" ON "Vehicle" USING GIN ("model" gin_trgm_ops);

-- Fulltext: Part trigger
CREATE OR REPLACE FUNCTION part_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."oemNumber", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."partNumber", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."description", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS part_search_vector_trigger ON "Part";
CREATE TRIGGER part_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "name", "oemNumber", "partNumber", "description"
  ON "Part"
  FOR EACH ROW
  EXECUTE FUNCTION part_search_vector_update();

-- Fulltext: Vehicle trigger
CREATE OR REPLACE FUNCTION vehicle_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."brand", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."model", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."vin", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicle_search_vector_trigger ON "Vehicle";
CREATE TRIGGER vehicle_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "brand", "model", "vin"
  ON "Vehicle"
  FOR EACH ROW
  EXECUTE FUNCTION vehicle_search_vector_update();

-- Fulltext: Listing trigger
CREATE OR REPLACE FUNCTION listing_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."brand", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."model", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."variant", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."description", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listing_search_vector_trigger ON "Listing";
CREATE TRIGGER listing_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "brand", "model", "variant", "description"
  ON "Listing"
  FOR EACH ROW
  EXECUTE FUNCTION listing_search_vector_update();

-- Backfill searchVector for existing records
UPDATE "Part" SET "searchVector" =
  setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("oemNumber", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("partNumber", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'C');

UPDATE "Vehicle" SET "searchVector" =
  setweight(to_tsvector('simple', coalesce("brand", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("model", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("vin", '')), 'B');

UPDATE "Listing" SET "searchVector" =
  setweight(to_tsvector('simple', coalesce("brand", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("model", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("variant", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'C');
