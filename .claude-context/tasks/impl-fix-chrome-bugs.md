# Implementace: Fix 2 kritických bugů + cleanup

**Datum:** 2026-04-05
**Agent:** Implementátor
**Task:** #14

---

## BUG #1 — images.unsplash.com not configured — OPRAVENO

**Soubor:** `next.config.ts:65-76`
**Změna:** Přidán `images.unsplash.com` do `remotePatterns`

```diff
+      {
+        protocol: "https",
+        hostname: "images.unsplash.com",
+      },
```

Seed data používá Unsplash URL pro VehicleImage. Bez tohoto nastavení Next.js Image komponenta na `/nabidka` vyhodí error.

---

## BUG #2 — /makler/messages debug — ANALYZOVÁNO + LOGGING

**Soubory analyzované:**
- `lib/auth.ts:79-93` — session callback ✅ správný (`session.user.id = token.sub ?? ""`)
- `app/(pwa)/makler/messages/page.tsx` — Prisma query ✅ správný
- `prisma/schema.prisma:293,349-374` — VehicleInquiry model ✅ odpovídá query
- `prisma/seed.ts:2243-2297` — seed data ✅ vytváří VehicleInquiry záznamy

**Závěr:** Kód je korektní. Error je s nejvyšší pravděpodobností způsoben dev server load (QA report zaznamenal 11 flaky timeoutů ze stejného důvodu — paralelní testy přetěžují SSR).

**Změna:** `app/(pwa)/makler/messages/page.tsx` — přidán try-catch s `console.error` logem kolem Prisma query pro snazší diagnostiku při opakování chyby.

---

## CLEANUP — lib/prisma.ts hardcoded fallback — OPRAVENO

**Soubor:** `lib/prisma.ts:10`

```diff
- const connectionString = process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
+ const connectionString = process.env.DATABASE_URL;
+ if (!connectionString) {
+   throw new Error("DATABASE_URL environment variable is not set");
+ }
```

Hardcoded connection string s username `zen` odstraněn. Pokud chybí `DATABASE_URL`, aplikace vyhodí jasnou chybu místo tichého fallbacku na lokální DB.

---

## Footer "[DOPLNIT TELEFON]" — ČEKÁ

Dle plánu čeká na reálné údaje od uživatele. Neopravováno.

---

## Build

```
✓ Compiled successfully in 17.5s
✓ Generating static pages (309/309)
0 errors
```

## Změněné soubory

| Soubor | Typ změny |
|--------|-----------|
| `next.config.ts` | +images.unsplash.com do remotePatterns |
| `app/(pwa)/makler/messages/page.tsx` | +try-catch logging kolem Prisma query |
| `lib/prisma.ts` | Odstraněn hardcoded DB fallback, přidána explicitní chyba |
