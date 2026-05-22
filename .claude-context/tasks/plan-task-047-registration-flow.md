# Plán: TASK-047 — Registrace makléře — kontrola a audit flow

**Datum:** 2026-04-25
**Autor:** Plánovač
**Priorita:** STŘEDNÍ
**Typ:** Audit + drobné opravy

---

## Kompletní registrační flow — jak funguje dnes

### Diagram

```
Manager/Admin                        Kandidát (makléř)
────────────                         ─────────────────
1. Vytvoří pozvánku                  
   POST /api/invitations             
   (email, name, regionId)           
                                     
   → Email s odkazem:                2. Otevře odkaz
   /registrace/makler?token=xxx         /registrace/makler?token=xxx
                                     
                                     3. Ověření tokenu (GET /api/invitations/[token])
                                        → Pre-fill jméno z pozvánky
                                     
                                     4. Vyplní formulář:
                                        - Jméno, příjmení (pre-filled)
                                        - Telefon
                                        - IČO (ARES validace)
                                        - Heslo + potvrzení
                                        - Souhlas s podmínkami
                                     
                                     5. Odešle: POST /api/auth/register/broker
                                        → Vytvoří User (BROKER, ONBOARDING, step=1)
                                        → Označí pozvánku jako USED
                                        → Pošle verifikační email
                                     
                                     6. Auto sign-in (NextAuth credentials)
                                     7. Redirect → /makler/onboarding/profile
                                     
                                     8. Onboarding (5 kroků) → TASK-048
                                     
Manager/Admin                        
────────────                         
9. Aktivace makléře                  
   POST /api/admin/brokers/[id]/activate
   → status: ONBOARDING → ACTIVE
```

---

## Soubory v registračním flow

| # | Soubor | Role | Řádky |
|---|--------|------|-------|
| 1 | `components/admin/InviteBrokerModal.tsx` | Modal pro vytvoření pozvánky | — |
| 2 | `app/api/invitations/route.ts` | POST (vytvoření) + GET (seznam) | 208 řádků |
| 3 | `app/api/invitations/[token]/route.ts` | GET — ověření tokenu | 68 řádků |
| 4 | `app/(web)/registrace/makler/page.tsx` | Registrační formulář makléře | 382 řádků |
| 5 | `app/api/auth/register/broker/route.ts` | POST — vytvoření účtu | 122 řádků |
| 6 | `lib/validators/onboarding.ts` | Zod schéma pro broker registraci | — |
| 7 | `lib/email-verification.ts` | Odeslání + ověření verifikačního emailu | — |
| 8 | `app/api/auth/verify-email/[token]/route.ts` | Verifikace emailu | 19 řádků |
| 9 | `app/(web)/overeni-emailu/[token]/page.tsx` | Landing page pro verifikaci | — |
| 10 | `app/(web)/overeni-emailu/uspech/page.tsx` | Úspěšná verifikace | — |
| 11 | `app/(web)/overeni-emailu/chyba/page.tsx` | Neúspěšná verifikace | — |

---

## Audit — nalezené problémy

### P1. Email pozvánky nepoužívá brand šablonu (NÍZKÁ)

**Soubor:** `app/api/invitations/route.ts`, řádky 121-149

**Problém:** Email s pozvánkou má inline HTML styly místo použití `emailLayoutHTML()` z `lib/brand-styles.ts`. Ostatní emaily v projektu (verifikace, notifikace) používají `emailLayoutHTML()`.

**Dopad:** Vizuální nekonzistence emailů, duplikace stylů.

**Fix:**
```typescript
import { emailLayoutHTML } from "@/lib/brand-styles";

// Nahradit inline HTML za:
const content = `
  <p>Dobrý den${name ? ` ${name}` : ""},</p>
  <p>Manažer <strong>${managerName}</strong> vás zve do makléřské sítě Carmakler${regionName ? ` (region ${regionName})` : ""}.</p>
  <p>Pro dokončení registrace klikněte na tlačítko níže:</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${registrationUrl}" style="background-color: #f97316; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
      Registrovat se jako makléř
    </a>
  </div>
  <p style="color: #6b7280; font-size: 14px;">Pozvánka je platná 7 dní.</p>
`;

await sendEmail({
  to: email,
  subject: "Pozvánka do Carmakler",
  html: emailLayoutHTML(content, ""),
});
```

### P2. Chybí rate-limiting na broker registraci (STŘEDNÍ)

**Soubor:** `app/api/auth/register/broker/route.ts`

**Problém:** Obecná registrace (`/api/auth/register`) má rate-limiting (5 pokusů / 15 min), ale broker registrace (`/api/auth/register/broker`) NEMÁ rate-limiting. Pozvánkový token je sice unikátní a single-use, ale samotný endpoint není chráněn proti brute-force.

**Fix:**
```typescript
import { rateLimit } from "@/lib/rate-limit";

// Na začátku POST handleru:
const ip = request.headers.get("x-forwarded-for") || "unknown";
const { success } = rateLimit(ip, 5, 15 * 60 * 1000);
if (!success) {
  return NextResponse.json(
    { error: "Příliš mnoho pokusů. Zkuste to později." },
    { status: 429 }
  );
}
```

### P3. Email verifikace není striktně vynucena (INFO)

**Soubor:** `app/api/auth/register/broker/route.ts`, řádky 100-105

**Stav:** Verifikační email se odesílá, ale pokud selže (catch blok), registrace pokračuje normálně. Makléř se může přihlásit i bez ověřeného emailu.

**Hodnocení:** To je **správné chování** pro makléřský flow — email verifikace je bonus, ne blocker. Makléř přichází přes důvěryhodnou pozvánku od managera, takže striktní verifikace není nutná. Pokud by se ale v budoucnu vyžadovala, je potřeba přidat `emailVerified` check do NextAuth authorize callback.

### P4. Registrační stránky bez diakritiky v textech (NÍZKÁ)

**Soubory:** Registrační stránky (`registrace/makler/page.tsx`) a onboarding stránky mají míchané texty — některé s diakritikou, některé bez.

**Příklady:**
- `registrace/makler/page.tsx:45` — "Chybí pozvázkový token" (správně)
- Onboarding step pages: "Vas profil" místo "Váš profil", "Vyplnte zakladni informace" místo "Vyplňte základní informace"

**Fix:** Projít texty ve všech onboarding stránkách a přidat diakritiku.

### P5. Chybí registrace pro ostatní role (INFO)

**Existující registrační stránky:**
- `/registrace` — ADVERTISER/BUYER (obecná)
- `/registrace/makler` — BROKER (přes pozvánku)
- `/registrace/partner` — PARTNER
- `/registrace/dodavatel` — PARTS_SUPPLIER
- `/inzerce/registrace` — ADVERTISER (inzertní platforma)

**Chybí:**
- INVESTOR/VERIFIED_DEALER — registrace přes marketplace apply formulář (již existuje)
- REGIONAL_DIRECTOR, MANAGER, BACKOFFICE — vytvářejí se pouze přes admin panel (správně)

**Hodnocení:** Kompletní, žádná chybějící registrace.

---

## Shrnutí

| # | Problém | Priorita | Typ | Soubor |
|---|---------|----------|-----|--------|
| P1 | Email pozvánky nepoužívá brand šablonu | NÍZKÁ | KONZISTENCE | `api/invitations/route.ts` |
| P2 | Chybí rate-limiting na broker registraci | STŘEDNÍ | BEZPEČNOST | `api/auth/register/broker/route.ts` |
| P3 | Email verifikace není striktní | INFO | DESIGN DECISION | — |
| P4 | Chybějící diakritika v textech | NÍZKÁ | UX | Více souborů |
| P5 | Kompletnost registrací | INFO | OK | — |

## Celkové hodnocení

Registrační flow je **solidně implementovaný**:
- Invitation-based systém s expirací (7 dní) a single-use tokeny
- ARES validace IČO v reálném čase
- Auto sign-in po registraci → přímý redirect na onboarding
- Transakční vytvoření uživatele + označení pozvánky (atomické)
- Verifikační email jako bonus (ne blocker)
- Správná role-based ochrana na API i stránkách

**Doporučené opravy (2):**
1. Přidat rate-limiting na `/api/auth/register/broker` (P2) — cca 5 řádků
2. Použít `emailLayoutHTML()` v pozvánkovém emailu (P1) — cca 15 řádků

**Žádné kritické problémy nenalezeny.**
