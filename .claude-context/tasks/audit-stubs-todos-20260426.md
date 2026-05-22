# Audit: TODOs, Stubs, Placeholders, Hardcoded Data, Dead Code
**Datum:** 2026-04-26  
**Auditor:** kontrolor  
**Rozsah:** celý codebase (`app/`, `components/`, `lib/`, `public/`, `scripts/`)

---

## METODIKA

- **P1** — blokuje produkci nebo viditelně nefunkční pro uživatele
- **P2** — nefunkční feature, hardcoded data místo DB, technický dluh
- **P3** — kosmetika, chybné komentáře, `as any` bez dopadu na runtime

---

## P1 — BLOKUJE

### 1. ShopTrustBar — text placeholders místo SVG logy
**Soubor:** `components/shop/ShopTrustBar.tsx:6-8`  
**Typ:** TODO(designer)  
**Detail:** Platební metody (Visa, MC, Apple Pay, Google Pay) a dopravci (Zásilkovna, DPD, PPL, GLS, Česká pošta) jsou zobrazeny jako text-badges. Komentář v kódu explicitně říká "Nahradit oficiálními brand SVG — vyžaduje brand asset approval". Tracked jako task #28 sekce 2.5 + KR 8.8.  
**Dopad:** Viditelný v shopu — profesionálně vypadá nehotově.

### 2. Partner messages — stub stránka
**Soubor:** `app/(partner)/partner/messages/page.tsx:27`  
**Typ:** Placeholder page  
**Detail:** Nadpis "Zprávy", ale pod ním text "Plná komunikace bude brzy k dispozici." Skutečný obsah jsou jen systémové notifikace z `prisma.notification` (max 50). Žádná P2P zpráva, žádný inbox, žádná odpověď.  
**Dopad:** PARTS_SUPPLIER partner vidí stránku "Zprávy" v navigaci, která nic neumí.

### 3. Zásilkovna route — mock fallback bez API klíče
**Soubor:** `app/api/shipping/zasilkovna-points/route.ts:19-32`  
**Typ:** Mock data  
**Detail:** Pokud `NEXT_PUBLIC_ZASILKOVNA_API_KEY` není nastaven, route vrátí hardcoded bod "Zásilkovna - Brno, Joštova 4". Na produkci je klíč nastaven → funkční. Lokální dev bez `.env` → misleading.  
**Dopad:** Dev/QA prostředí bez klíče dostane falešný výsledek místo prázdného seznamu. Může maskovat problémy s integrací.

---

## P2 — NEFUNKČNÍ / HARDCODED

### 4. Partner documents — hardcoded seznam + chybějící PDFky
**Soubor:** `app/(partner)/partner/documents/page.tsx:16-38`  
**Typ:** Hardcoded data + chybějící assety  
**Detail:** 3-položkový statický array `documents[]` odkazuje na:
- `/documents/partnerska-smlouva.pdf`
- `/documents/obchodni-podminky.pdf`

`public/documents/` adresář **neexistuje** — při kliknutí na "Stáhnout PDF" dostane uživatel 404.  
**Dopad:** Crash UX pro partnera.

### 5. Onboarding training — video placeholder
**Soubor:** `app/(pwa)/makler/onboarding/training/page.tsx:46-57`  
**Typ:** Placeholder  
**Detail:** Intro fáze zobrazuje styled gradient s play ikonou a textem "Video bude brzy dostupné". Žádný `<iframe>` embed. Nutí makléře kliknout "Zahájit školení" bez kontext videa.  
**Dopad:** Nekritické, ale onboarding flow je neúplný.

### 6. lib/seo/pricingAggregate.ts — TODO JSONB migrace
**Soubor:** `lib/seo/pricingAggregate.ts:16`  
**Typ:** Known limitation / TODO  
**Detail:** `compatibleBrands` je `String?` JSON array v DB. Query používá `contains: "Škoda"` — substring match → false positives (hledání "Škoda" matchne `["Škoda Roomster"]`). Vyžaduje migraci na PostgreSQL JSONB path query. Tracked jako TODO #87d.  
**Dopad:** Špatná SEO pricing data na `/dily/znacka/*` stránkách — minor, sub-brand pricing je stále reasonable.

### 7. public/sw.js — console.logs bez env guard
**Soubor:** `public/sw.js`  
**Typ:** Debug noise  
**Detail:** Service worker obsahuje `console.log` výstupy (detekováno v minifikovaném souboru). Žádný `if (self.__DEV__)` nebo `if (process.env.NODE_ENV !== 'production')` guard. Loguje do DevTools v produkci.  
**Dopad:** Noise v produkční konzoli, minimální bezpečnostní risk (info leak o cache strategii).

### 8. scripts/migrate-cloudinary.ts — unimplementované TODOs
**Soubor:** `scripts/migrate-cloudinary.ts:58,66`  
**Typ:** TODO  
**Detail:**  
```
// TODO: Part.images (JSON parse), User.avatar, User.documents, Contract.pdfUrl
// TODO: Implementovat:
```
Migrační script je neúplný — nepřenáší obrazky dílů, avatary uživatelů, dokumenty, PDF smlouvy.  
**Dopad:** Jednorázový script → produkci neblokuje, ale při spuštění migrace by tato data zůstala nekonvertovaná.

---

## P3 — TECHNICKÝ DLUH / CLEANUP

### 9. `as any` casty v PWA photo upload
**Soubory:**
- `components/pwa/vehicles/quick/QuickStep2.tsx:100`
- `components/pwa/vehicles/new/PhotosStep.tsx:139`

**Detail:** `updateSection("photos", { photos: [...] as any })` — obchází type checking pro array photos v section state. Funkčně OK, ale maskuje potenciální type mismatch.

### 10. Partner parts/new — hardcoded enum options
**Soubor:** `app/(partner)/partner/parts/new/page.tsx:12-32`  
**Typ:** Hardcoded options (přijatelné)  
**Detail:** `categoryOptions` a `conditionOptions` jsou statické arrays matchující Prisma enum hodnoty (ENGINE, TRANSMISSION, ... / USED_GOOD, USED_FAIR, ...). Nevytahuje z DB — ale enumerace jsou stable, takže P3 nikoliv P2.

---

## OVĚŘENO — NEJDE O STUBS

| Soubor | Původní podezření | Verdikt |
|--------|-------------------|---------|
| `lib/seo.ts` — `generateFaqPageJsonLd` | Dead code (alias) | **Aktivně použito** v 3× `/dily/znacka/*` pages |
| `lib/seo.ts` — `generatePersonJsonLd` | Dead code | **Aktivně použito** v `profil/[slug]/page.tsx:296` |
| `app/(partner)/partner/messages/page.tsx` | Prázdná stránka | Zobrazuje notifikace — stub jen pro messaging část |
| `app/api/shipping/zasilkovna-points/route.ts` | Celá route je mock | Mock jen jako fallback; real fetch funguje s API klíčem |

---

## DOPORUČENÁ AKCESCHOPNOST

### Okamžitě před příštím deplojem (P1):
1. **Partner documents** — vytvořit `public/documents/` a přidat PDFky, nebo přepsat na CMS-driven data (Prisma `Document` model)
2. **ShopTrustBar** — buď schválit brand assety, nebo přidat info note uživateli ("brand assety v přípravě") a odebrat TODO

### Do příštího sprintu (P2):
3. **Onboarding video** — nahradit placeholder skutečným YouTube/Vimeo embed
4. **Partner messages** — rozhodnout: odebrat z navigace než bude real messaging, nebo přejmenovat na "Notifikace"
5. **SW console.logs** — přidat `DEBUG` env flag nebo odstranit

### Backlog / není blocker (P3):
6. **`as any` casty** — fixnout types v photo upload sekci
7. **pricingAggregate TODO #87d** — JSONB migrace při příležitosti
8. **scripts/migrate-cloudinary.ts** — dokončit nebo smazat pokud nepotřebné

---

## SOUHRN

| Priorita | Počet | Kritické? |
|----------|-------|-----------|
| P1 | 3 | ✅ Řešit ASAP |
| P2 | 5 | ⚠️ Příští sprint |
| P3 | 2 | ℹ️ Backlog |
| **Celkem** | **10** | |

Build: `npm run build` prochází — žádný ze stubů nezpůsobuje build chybu. Blokátory jsou UX/produkční, ne kompilační.
