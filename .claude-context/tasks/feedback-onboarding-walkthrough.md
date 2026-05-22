# Feedback z proklikání onboardingu — 2026-04-25

> Uživatel prochází celý onboarding flow na produkci a zapisuje problémy.

---

## Registrace makléře (`/registrace/makler`)

### F1. IČO nepovinné při registraci
- **Problém:** Makléř nemusí mít IČO hned při registraci
- **Fix:** Udělat IČO volitelné při registraci, povinné až před podpisem smlouvy (krok 4)
- **Soubor:** `app/(web)/registrace/makler/page.tsx` + API route

### F2. Bankovní účet — český formát místo IBAN
- **Problém:** IBAN (CZ65 0800 0000 1920 0014 5399) je pro Čechy nepřirozený
- **Fix:** Změnit na český formát: číslo účtu / kód banky (např. 1234567890/0800)
- **Soubory:** `components/pwa/onboarding/ProfileForm.tsx`, `app/api/onboarding/profile/route.ts`

## Profil makléře (`/profil/[slug]`)

### F3. "Ověřená identita" badge — zbytečný
- **Problém:** Každý přijatý makléř má automaticky ověřenou identitu, badge je zbytečný
- **Fix:** HOTOVO — odstraněno lokálně, deployováno na produkci (rebuild + PM2 reload)

### F4. Profil vypadá špatně — potřebuje víc práce
- **Problém:** "vypada to fakt napíču ten profile look"
- **Fix:** Součást TASK-046/TASK-052 — další iterace designu

## Obecná registrace (`/registrace`)

### F5. "Autobazar" vs "Dealer" — matoucí
- **Problém:** "autobazart? dealer?? co to kurva je" — synonyma, matoucí pro uživatele
- **Fix:** Přejmenovat nebo sloučit. Návrh: "Soukromý" / "Autobazar/Autosalon" (sloučit)

## Onboarding krok 2 — Dokumenty (`/makler/onboarding/documents`)

### F6. Živnostenský list — nepovinný
- **Problém:** Makléř nemusí mít živnostenský list hned, může si ho chtít dodělat
- **Fix:** Živnostenský list udělat volitelný. Povinné jen OP (přední + zadní). Živnosťák může nahrát později (v profilu nebo před podpisem smlouvy)
- **Soubor:** `components/pwa/onboarding/DocumentUpload.tsx`, `app/api/onboarding/documents/route.ts`

## AI Asistent (plovoucí chat bubble)

### F7. AI Asistent nefunguje — chybí API klíč
- **Problém:** "Chyba při komunikaci s AI" — ANTHROPIC_API_KEY chybí v produkčním .env
- **Fix:** Přidat ANTHROPIC_API_KEY do .env na serveru
- **Blokuje:** Makléř nemůže používat AI asistenta

---

*Další feedback se bude doplňovat průběžně z uživatelova proklikávání.*
