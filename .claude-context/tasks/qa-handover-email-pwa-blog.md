# QA — Handover email (a878371) + PWA blog editor (2ea42b0)
**Datum:** 2026-04-26  
**Kontrolor:** kontrolor

---

## COMMIT 1: a878371 — Handover follow-up email

### Reverzní kontrola

| Požadavek | Kde | Stav |
|-----------|-----|------|
| Email kupujícímu | `handover/route.ts:238` — `if (buyerInquiry?.buyerEmail)` | ✅ |
| Email prodávajícímu | `handover/route.ts:266` — `if (vehicle.sellerEmail)` | ✅ |
| Graceful skip — kupující bez emailu | `buyerInquiry?.buyerEmail` — optional chaining | ✅ |
| Graceful skip — prodávající bez emailu | `if (vehicle.sellerEmail)` — podmíněný blok | ✅ |
| Fire-and-forget pattern | `.catch()` bez `await` na obou `sendEmail()` | ✅ |
| `sellerEmail` field existuje | `schema.prisma:301` — `sellerEmail String?` | ✅ |
| Follow-up notifikace makléři | `handover/route.ts:293` — `createNotification` 7 dní | ✅ |
| TODO komentář odstraněn | Žádný TODO v souboru | ✅ |

### Simplify

Emailové HTML šablony jsou inline (velké template strings v route souboru). Přijatelné pro MVP — pro FÁZE 2 doporučit extrakci do `lib/email-templates/`. **Neblokuje.**

### Verdikt: SCHVÁLENO ✅

---

## COMMIT 2: 2ea42b0 — PWA blog editor

### Reverzní kontrola — bod po bodu

| Bod | Soubor | Stav |
|-----|--------|------|
| `/makler/blog/page.tsx` — seznam článků | Existuje, statusLabels pro DRAFT/REVIEW/PUBLISHED/ARCHIVED | ✅ |
| `/makler/blog/[id]/edit/page.tsx` — editor existuje | Existuje | ✅ |
| Auth guard — makléř vidí jen své články | `page.tsx:27` — `article.authorId !== session.user.id` → error div | ✅ |
| Auth guard v API PATCH | `[id]/route.ts:68` — `authorId !== session.user.id && !admin` → 403 | ✅ |
| Editor pole: title | `BrokerArticleEditor.tsx` — ✅ |
| Editor pole: excerpt | `BrokerArticleEditor.tsx` — ✅ |
| Editor pole: coverImage (upload) | `ImageUpload` preset="cover" na řádku 175 | ✅ |
| Editor pole: content (textarea) | `BrokerArticleEditor.tsx` — ✅ |
| Editor pole: kategorie (select) | `BrokerArticleEditor.tsx` — ✅ |
| Editor pole: tagy (multi-select) | `BrokerArticleEditor.tsx` — ✅ |
| DRAFT flow — "Uložit koncept" | `BrokerArticleEditor.tsx:277` | ✅ |
| REVIEW flow — "Odeslat ke schválení" | `BrokerArticleEditor.tsx:127,285` — POST/PATCH s `status: "REVIEW"` | ✅ |
| tagIds v POST `/api/blog/articles` | `articles/route.ts:17` — `z.array(z.string()).max(5).optional()` | ✅ |
| tagIds v PATCH `/api/blog/articles/[id]` | `[id]/route.ts:18` — Zod schema + upsert na řádku 76–83 | ✅ |
| Odkaz v PWA navigaci | `SettingsContent.tsx:315` — `<Link href="/makler/blog">Moje články` | ✅ |
| `npm run build` projde | **1284/1284** stránek (nárůst o 2: `/makler/blog` + `/makler/blog/[id]/edit`) | ✅ |
| TypeScript 0 chyb | `npx tsc --noEmit` — 0 errors v nových souborech | ✅ |

### Simplify — P3 nálezy (neblokující)

**new/page.tsx → redirect na `/makler/blog/new/edit`**  
Soubor `new/page.tsx` redirectuje na `/makler/blog/new/edit`, které je obslouženo dynamickou route `[id]/edit` s `id="new"`. Správné Next.js chování. Mírně netransparentní, ale funguje.

**Auth guard v edit/page.tsx vrací error div místo redirect**  
`article.authorId !== session.user.id` → render error div (ne `redirect()` ani `notFound()`). Bezpečnostně OK (obsah není odhalen), ale nekonzistentní s API (které vrací 403). P3.

### Verdikt: SCHVÁLENO ✅

---

## Souhrnný Build

| Build | Stránek | Stav |
|-------|---------|------|
| Po commit a878371 + 2ea42b0 | **1284/1284** | ✅ PASS |

Oba commity schváleny pro deploy.
