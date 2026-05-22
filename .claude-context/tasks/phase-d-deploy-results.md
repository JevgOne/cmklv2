# Phase D: Deploy + Re-scrape Results

**Date:** 2026-05-21
**Duration:** ~2.5 hours (05:40 - 08:08 UTC)

## Summary

Full production deployment of updated lead-scout + Carmakler, old data cleanup, and fresh re-scrape.

## Steps Completed

### Step 1: Carmakler Deploy ✅
- Schema migration applied: `20260520210000_add_extended_vehicle_fields` (24 ALTER TABLE + VIN index)
- `prisma generate` + `npm run build` OK
- PM2 reload: `carmakler` (id 6) running

### Step 2: Lead-scout Deploy ✅
- rsync from local → `/var/www/lead-scout` (excluding .venv, data/, .env)
- PM2 scheduler (id 7) restarted

### Step 3: Delete Old PostgreSQL Leads ✅
- Deleted **158** SOUKROMNIK leads from `ScoutLead` table

### Step 4: Delete Old SQLite Leads ✅
- Deleted **291** leads (SAUTO/BAZOS/SBAZAR) from `data/leads.db`

### Step 5: Full Re-scrape ✅
- **Bazoš:** 5 new leads (auto-pushed by scheduler)
- **Sauto:** 50 pages scraped (05:40 - 08:07 UTC), 179 listings found, **38 saved** (after dedup)

### Step 6: Push to Carmakler ✅
- 38 Sauto leads pushed, 0 errors, 0 duplicates
- Bazoš leads already pushed by scheduler

### Step 7: Data Verification ✅

#### PostgreSQL Final State

| Source | Count | Avg Photos | VIN % | Equipment % |
|--------|-------|------------|-------|-------------|
| SAUTO  | 57    | 17.0       | 67%   | 88%         |
| BAZOS  | 23    | 17.9       | 0%    | 100%        |
| **Total** | **80** | **17.3** | **48%** | **92%** |

#### Key Observations
- 100% leads have photos
- Sauto VIN coverage 67% (good — depends on seller providing VIN)
- Bazoš VIN 0% (expected — Bazoš rarely exposes VIN)
- Equipment coverage 88-100%
- 80 total SOUKROMNIK leads vs previous 158 (expected — fresher, deduplicated data)

#### Known Gap
- `completeness_score` calculated in SQLite (Sauto avg 63.6, Bazoš avg 16.1) but NOT pushed to PostgreSQL
  - `client.py` SNAKE_TO_CAMEL mapping missing `completeness_score` → `completenessScore`
  - Fix: add mapping in next iteration

## Production Services Status
- `carmakler` (PM2 id 6): online
- `lead-scout-scheduler` (PM2 id 7): online
- `lead-scout-batch` (PM2 id 8): stopped (not needed for now)
