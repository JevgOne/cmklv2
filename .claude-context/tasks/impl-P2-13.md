# Implementation Report: P2-13 Email Verification

## Status: COMPLETED

## Pre-existing Infrastructure
- `prisma/schema.prisma` — `EmailVerificationToken` model already existed
- `prisma/schema.prisma` — `User.emailVerified DateTime?` already existed
- All 3 register routes already import and call `sendVerificationEmail`
- `app/(web)/overeni-emailu/[token]/page.tsx` — Verification page existed
- `app/api/auth/verify-email/[token]/route.ts` — Verification API existed
- `types/next-auth.d.ts` — `isEmailVerified` already in session types
- `lib/auth.ts` — Already propagates `isEmailVerified` to session

## Changes Made

### 1. Email Verification Helper
**File:** `lib/email-verification.ts` (NEW)
- `sendVerificationEmail(email, firstName)` — Invalidates old tokens, generates 32-byte token, creates DB record, sends branded HTML email via Resend with 24h expiry
- `verifyEmailToken(token)` — Finds token, checks used/expired, marks used, sets emailVerified on User

### 2. Success Page
**File:** `app/(web)/overeni-emailu/uspech/page.tsx` (NEW)
- Green checkmark, "Email úspěšně ověřen!" heading, link to login

### 3. Resend Verification API
**File:** `app/api/auth/resend-verification/route.ts` (NEW)
- POST with email, rate-limited (3/hr per IP)
- Security: always returns same message regardless of email existence

### 4. Admin Bulk Send
**File:** `app/api/admin/send-verification-emails/route.ts` (NEW)
- Admin-only, finds all ACTIVE users without emailVerified, sends with 500ms delay

### 5. Login Page — Verification Banner
**File:** `app/(web)/login/page.tsx`
- After login checks isEmailVerified, shows amber banner with resend button
- Soft enforcement: login proceeds normally

## Approach: Soft Enforcement
Login NOT blocked for unverified users. Use admin bulk endpoint first, switch to hard later.

## Verification
- TypeScript type check: PASSED
