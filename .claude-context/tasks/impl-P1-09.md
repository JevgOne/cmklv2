# Implementace P1-09: Password reset flow

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedene zmeny

### 1. `prisma/schema.prisma` — uz existoval (PasswordResetToken model)
- Model `PasswordResetToken` s email, token (unique), expiresAt, used
- Indexy na email, token, expiresAt

### 2. `app/api/auth/forgot-password/route.ts` (NOVY)
- POST: prijme email, rate-limit 3 requesty/hod, generuje 32-byte token
- Odesle email pres `sendEmail()` z `lib/resend.ts` s Carmakler brandingem
- Bezpecnost: stejna odpoved pro existujici i neexistujici email

### 3. `app/api/auth/reset-password/route.ts` (NOVY)
- POST: prijme token + nove heslo, validuje expiresAt + used flag
- Zmeni heslo (bcrypt, 12 rounds) a invaliduje vsechny tokeny pro dany email
- Pouziva $transaction pro atomicitu

### 4. `app/(web)/zapomenute-heslo/page.tsx` (NOVY)
- Formular pro zadani emailu
- Po odeslani: zprava "Zkontrolujte svuj email" s ikonou
- Link zpet na prihlaseni

### 5. `app/(web)/reset-hesla/[token]/page.tsx` (NOVY)
- Formular pro nove heslo + potvrzeni
- Min 8 znaku, kontrola shody
- Po uspechu: "Heslo zmeneno" + auto-redirect na login (3s)
- Chybovy stav s linkem na /zapomenute-heslo

### 6. `app/(web)/login/page.tsx` (UPRAVENO)
- Zmena `<a href="mailto:...">` na `<Link href="/zapomenute-heslo">`

## Bezpecnostni opatreni

- Stejna odpoved pro existujici i neexistujici email
- Rate limiting: max 3 tokeny za hodinu na email
- Token expirace: 1 hodina
- Jednorazovy token (used flag)
- Invalidace vsech tokenu pro email po zmene hesla
- Bcrypt hash 12 rounds

## Overeni

- [x] Model PasswordResetToken existuje v schema
- [x] POST forgot-password API s Zod validaci a rate limitem
- [x] POST reset-password API s token validaci a $transaction
- [x] Stranka /zapomenute-heslo funguje
- [x] Stranka /reset-hesla/[token] funguje
- [x] Login stranka ma Link misto mailto
- [x] Typecheck prochazi
- [x] Unit testy prochazi (141/141)
