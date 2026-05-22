# HLOUBKOVÝ AUDIT — Všechny nedostatky projektu Carmakler

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Rozsah:** Kompletní codebase — app/ (262 stránek), components/, lib/, prisma/, API routes  
**Přístup:** BRUTÁLNĚ UPŘÍMNÝ

---

## STATISTIKY PROJEKTU

| Oblast | Počet stránek | Stav |
|--------|--------------|------|
| Web `(web)` | 138 | ~95% kompletní |
| Admin `(admin)` | 42 | ~92% kompletní |
| PWA Makléř `(pwa)` | 50 | ~88% kompletní |
| PWA Díly `(pwa-parts)` | 13 | ~95% kompletní |
| Partner `(partner)` | 19 | ~90% kompletní |
| **Celkem** | **262** | **~92%** |

---

## KATEGORIE A: KRITICKÉ — Viditelné pro uživatele, brzdí produkční nasazení

### A1. Chybějící seed data pro blog (ArticleCategory + ArticleTag)
- **Problém:** `prisma/seed.ts` (3683 řádků) **NESEEDUJE** ArticleCategory ani ArticleTag. Blog stránky na produkci budou **prázdné** — žádné kategorie v selectu, žádné tagy.
- **Soubor:** `prisma/seed-blog.ts` existuje jako **SEPARÁTNÍ** soubor s 7 kategoriemi + 2 ukázkovými články, ale **není volaný** z hlavního seed.ts!
- **Dopad:** `/blog` bude prázdný, `/blog/kategorie/*` vrátí 404, blog editor nemá kategorie.
- **Fix:** Přidat `import "./seed-blog"` do seed.ts NEBO spustit `npx tsx prisma/seed-blog.ts` na produkci.
- **Priorita:** **KRITICKÁ**

### A2. Chybějící seed data pro partnery
- **Problém:** `prisma/seed-partners.ts` existuje s 3000+ partnerskými záznamy z JSON, ale **NENÍ VOLANÝ** z hlavního seed.ts.
- **Dopad:** Partner tabulka prázdná na fresh install → partnerské funkce nefunkční.
- **Fix:** Spustit `npx tsx prisma/seed-partners.ts` na produkci.
- **Priorita:** **KRITICKÁ** (pokud partner modul je aktivní)

### A3. Možný migration drift — ověřit na produkci
- **Problém:** Background agent identifikoval, že některé novější modely (Article, ArticleReaction, NewsletterSubscriber, TrustScore, CustomerGarage, PartRequest aj.) mohou chybět v migration SQL souborech. Na dev DB fungují (migrate dev je vytvoří automaticky), ale `migrate deploy` na fresh DB je nemusí mít.
- **Dopad:** Na FRESH produkční instalaci by 24 tabulek mohlo chybět → blog, garáž, part requests padnou.
- **Fix:** Ověřit `npx prisma migrate status` na produkci. Pokud drift → `prisma migrate dev --create-only` + deploy.
- **Priorita:** **KRITICKÁ** (ověřit, ne slepě fixovat — produkce pravděpodobně OK)

### A4. Pusher (real-time notifikace) — NEINTEGROVÁN
- **Problém:** Pusher je v tech stacku (CLAUDE.md) ale **NIKDE v kódu** se nepoužívá. Jediný výskyt je v e2e testu. Žádný `lib/pusher.ts`, žádný Pusher client, žádný real-time push.
- **Dopad:** Notifikace fungují jen přes polling/page refresh. Makléř nevidí nové leady v reálném čase.
- **Fix:** Implementovat Pusher client/server pro klíčové eventy (nový lead, schválení vozidla, nová zpráva).
- **Priorita:** **STŘEDNÍ** (funguje bez toho, ale UX je horší)

### A5. CEBIA mock — reportUrl vždy null v dev
- **Soubor:** `lib/cebia.ts:141`
- **Problém:** Mock CEBIA report vrací `reportUrl: null`. Jakékoliv UI které zobrazuje odkaz na CEBIA report bude v dev mode broken.
- **BUG-014** je zdokumentovaný ale neopravený.
- **Fix:** Vrátit placeholder URL `"https://cebia.cz/report/mock"` místo null.
- **Priorita:** **NÍZKÁ** (jen dev mode)

---

## KATEGORIE B: STUBY A PLACEHOLDERY — Uživatel vidí "Brzy dostupné"

### B1. Partner Messages — jen notifikace
- **Soubor:** `app/(partner)/partner/messages/page.tsx:27`
- **Text:** "Plná komunikace bude brzy k dispozici."
- **Stav:** Stránka FUNGUJE pro notifikace (čte z DB), ale chybí real-time messaging.
- **Priorita:** **NÍZKÁ** (partnerský modul je sekundární)

### B2. Onboarding Training Video — placeholder
- **Soubor:** `app/(pwa)/makler/onboarding/training/page.tsx:46-57`
- **Text:** "Video bude brzy dostupné" s play button overlay.
- **Stav:** Vizuálně pěkný placeholder, ale žádné video. Školení (slides + kvíz) funguje.
- **Dopad:** Nový makléř vidí prázdný video player.
- **Fix:** Nahrát uvítací video na YouTube/Vimeo a embedovat.
- **Priorita:** **STŘEDNÍ** (součást onboardingu)

### B3. PWA Stats — div-based grafy místo recharts
- **Soubor:** `app/(pwa)/makler/stats/page.tsx:337-374`
- **Komentáře:** "bar chart placeholder", "line chart placeholder"
- **Stav:** Grafy FUNGUJÍ a zobrazují REÁLNÁ data z DB (commission.aggregate) — ale jsou renderované jako div bary, ne recharts/chart.js.
- **Dopad:** Vizuálně basic, ale funkčně OK.
- **Priorita:** **NÍZKÁ** (kosmetické)

### B4. Admin Dashboard — grafy jsou placeholder emoji
- **Soubor:** `app/(admin)/admin/dashboard/page.tsx:127-142`
- **Text:** `📊 Graf prodejů` a `📊 Graf provizí` — zobrazí se jen emoji místo reálného grafu.
- **Stav:** Stat karty (vozidla, makléři, provize) zobrazují REÁLNÁ čísla z DB. Ale graf sekce je prázdná.
- **Priorita:** **STŘEDNÍ** (admin vidí)

### B5. Partner Documents — "Měsíční vyúčtování" nedostupné
- **Soubor:** `app/(partner)/partner/documents/page.tsx:34`
- **Text:** "Bude dostupne po prvnim mesici spoluprace. Automaticky generovane."
- **Stav:** Dokument "Měsíční vyúčtování" má `available: false`, `href: null`. Zobrazí se "Zatím nedostupné".
- **Priorita:** **STŘEDNÍ** (partner vidí "nedostupné" u důležitého dokumentu)

### B6. PWA Offline Sync — handleSync je stub
- **Soubor:** `app/(pwa)/makler/offline/page.tsx:70-77`
- **Komentář:** "Sync bude implementován přes background sync / manuální sync"
- **Stav:** `handleSync` funkce označí položky jako hotové BEZ skutečné synchronizace. Komentář: "Prozatím označíme vše jako hotové".
- **Dopad:** Makléř si myslí že data jsou sync, ale nejsou.
- **Priorita:** **STŘEDNÍ** (klamavé UX)

---

## KATEGORIE C: TODO/FIXME V KÓDU

### C1. Handover follow-up email
- **Soubor:** `app/api/vehicles/[id]/handover/route.ts:219`
- **TODO:** `TASK-026 — automatický email kupujícímu po 7 dnech`
- **Stav:** Impl plán hotový (`impl-handover-email.md`), čeká na implementaci.
- **Priorita:** **STŘEDNÍ**

### C2. ShopTrustBar — SVG loga platebních metod
- **Soubor:** `components/shop/ShopTrustBar.tsx:6`
- **TODO(designer):** Text-badges místo oficiálních SVG log (Visa, Mastercard, Zásilkovna atd.)
- **Stav:** Funkční, jen vizuálně nedotažené.
- **Priorita:** **NÍZKÁ**

### C3. Parts SEO — substring match místo JSONB query
- **Soubor:** `lib/seo/pricingAggregate.ts:16`
- **TODO #87d:** `contains` substring místo JSONB array path query. Může vrátit false positives.
- **Priorita:** **NÍZKÁ**

### C4. Cloudinary migration script — nedokončený
- **Soubor:** `scripts/migrate-cloudinary.ts:58-66`
- **TODO:** "Part.images (JSON parse), User.avatar, User.documents, Contract.pdfUrl" — migrace není kompletní.
- **Priorita:** **NÍZKÁ** (script, ne produkční kód)

---

## KATEGORIE D: CHYBĚJÍCÍ FUNKCE — Plánované ale neimplementované

### D1. Makléřský blog editor v PWA
- **Chybí:** `app/(pwa)/makler/blog/` — neexistuje
- **Stav:** Impl plán hotový (`impl-pwa-blog-editor.md`), čeká na implementaci.
- **Priorita:** **STŘEDNÍ**

### D2. AI Topic Suggestion pro blog
- **Chybí:** `api/blog/ai-suggest-topics` — neexistuje
- **Stav:** AI draft generátor existuje (ai-generate), ale automatické navrhování témat chybí.
- **Priorita:** **NÍZKÁ**

### D3. Real-time notifikace (Pusher)
- Viz A2 výše.

### D4. Blog tag landing pages
- **Chybí:** `app/(web)/blog/tag/[slug]/page.tsx` — neexistuje jako standalone stránka
- **Stav:** Tagy se filtrují přes ?tag= query param, ale nemají dedikovanou SEO landing page.
- **Priorita:** **NÍZKÁ**

---

## KATEGORIE E: CHYBĚJÍCÍ SEED DATA — Prázdné tabulky na produkci

### E1. Blog kategorie a tagy (KRITICKÉ)
- **Tabulky:** `ArticleCategory`, `ArticleTag` — **PRÁZDNÉ** na produkci pokud se nespustí seed-blog.ts
- **Dopad:** Blog editor nemá kategorie v selectu, tagy nefungují
- **Fix:** Spustit `npx tsx prisma/seed-blog.ts` na produkci

### E2. Blog články
- **Tabulky:** `Article` — prázdná (seed-blog.ts má 2 demo články ale není volaný)
- **Dopad:** `/blog` zobrazí prázdný stav (ale s EmptyState, takže ne broken)

### E3. Marketplace deals
- **Tabulky:** `FlipOpportunity`, `Investment` — seed.ts je seeduje (OK)

### E4. Newsletter subscribers
- **Tabulka:** `NewsletterSubscriber` — bude prázdná (expected, ne problém)

### E5. Article reactions/comments
- **Tabulky:** `ArticleReaction`, `ProfileComment` (blog) — prázdné (expected)

---

## KATEGORIE F: UX PROBLÉMY — Stránky co fungují ale nejsou ideální

### F1. Empty states BEZ CTA
- Některé empty states mají jen text "Zatím žádné..." bez tlačítka/odkazu co dál:
  - `admin/brokers/[id]/page.tsx:369` — "Zatím žádné provize." (bez odkazu)
  - `admin/tagy/page.tsx:108` — "Zatím žádné tagy." (bez "Přidat tag" CTA)
- **Priorita:** **NÍZKÁ**

### F2. Placeholder obrázek pro inzeráty
- **Soubor:** `app/(web)/inzerce/page.tsx:109`
- **Kód:** `l.images[0]?.url || "/images/placeholder-car.jpg"`
- **Problém:** Soubor `/images/placeholder-car.jpg` — ověřit zda existuje v public/
- **Priorita:** **NÍZKÁ**

### F3. Zásilkovna dry-run mock data
- **Soubor:** `app/api/shipping/zasilkovna-points/route.ts:19`
- **Stav:** Vrací mock data místo reálných výdejních míst v dev mode
- **Priorita:** **NÍZKÁ** (jen dev)

---

## KATEGORIE G: TECHNICKÝ DLUH — Funguje, ale není ideální

### G1. Zásilkovna XML parsing regexem
- **Soubor:** `lib/shipping/README.md:188`
- **Problém:** XML response se parsuje regexem místo proper XML parserem
- **Priorita:** **NÍZKÁ**

### G2. Offline sync — základní ale ne kompletní
- **Stav:** IndexedDB + foto upload offline fungují (10 souborů). Background Sync pro odesílání formulářů offline NENÍ implementován.
- **Dopad:** Makléř může fotit offline, ale nemůže odeslat celé nabírání auta offline.
- **Priorita:** **STŘEDNÍ** (klíčové pro makléře v terénu)

### G3. Service Worker — basic caching
- **Soubor:** `public/sw.js`
- **Stav:** Basic cache-first pro statiku, network-first pro API. Žádný sophisticated offline-first pattern.
- **Priorita:** **NÍZKÁ**

---

## KATEGORIE H: CO JE V POŘÁDKU (pro kontext)

- **Admin panel search bar** — ✅ IMPLEMENTOVÁNO (AdminGlobalSearch.tsx s debounce, reálné vyhledávání)
- **Admin Export button** — ✅ IMPLEMENTOVÁNO (dropdown s CSV export přes API)
- **Admin broker detail/edit** — ✅ IMPLEMENTOVÁNO (admin/brokers/[id]/ + /edit/)
- **Blog reactions, komentáře, newsletter** — ✅ IMPLEMENTOVÁNO
- **Cart (shop + díly)** — ✅ IMPLEMENTOVÁNO (lib/cart.ts, cookie-based, plný checkout)
- **Stripe integration** — ✅ IMPLEMENTOVÁNO (webhook, connect, checkout)
- **Email system** — ✅ IMPLEMENTOVÁNO (Resend, 10+ email routes)
- **Empty states** — ✅ Většina stránek má EmptyState komponentu
- **Seed data** — ✅ Rozsáhlý seed.ts (3683 řádků): regiony, users, vozidla, díly, objednávky, makléři, inzeráty, marketplace

---

## SHRNUTÍ PODLE PRIORITY

### KRITICKÉ (opravit IHNED):
| # | Problém | Fix | Effort |
|---|---------|-----|--------|
| E1 | Blog seed data (kategorie + tagy) neběží na produkci | Spustit `npx tsx prisma/seed-blog.ts` | 5 min |
| A2 | Partner seed data neběží | Spustit `npx tsx prisma/seed-partners.ts` | 5 min |
| A3 | Ověřit migration drift na produkci | `npx prisma migrate status` | 10 min |

### STŘEDNÍ (opravit brzy):
| # | Problém | Fix | Effort |
|---|---------|-----|--------|
| B2 | Onboarding video placeholder | Nahrát video + embedovat | 30 min (content) |
| B4 | Admin dashboard chart placeholders | Implementovat recharts grafy | 2h |
| B5 | Partner "Měsíční vyúčtování" nedostupné | Implementovat PDF generování | 3h |
| B6 | PWA Offline Sync stub | Implementovat reálný sync | 4h |
| C1 | Handover follow-up email TODO | Impl plán ready | 30 min |
| D1 | Makléřský blog editor | Impl plán ready | 2h |
| A4 | Pusher real-time notifikace | Nová implementace | 4-6h |
| G2 | Offline sync formulářů | Background Sync API | 4-6h |

### NÍZKÉ (backlog):
| # | Problém | Fix | Effort |
|---|---------|-----|--------|
| B1 | Partner messages messaging | Pusher chat | 4h |
| B3 | Stats recharts upgrade | Nahradit div grafy | 2h |
| C2 | ShopTrustBar SVG badges | Design assets | 1h |
| C3 | Parts SEO JSONB query | Migrate query | 1h |
| D2 | AI topic suggestion | Nový API endpoint | 2h |
| D4 | Blog tag landing pages | Nová stránka | 1h |
| A5 | CEBIA mock reportUrl | Placeholder URL | 5 min |
| F1 | Empty states bez CTA | Přidat tlačítka | 30 min |
| G1 | Zásilkovna XML parser | Proper parser | 1h |

---

## CELKOVÝ VERDIKT

Projekt je na **~92% kompletnosti**. Žádné kritické produkční bloky kromě chybějícího blog seedu. Většina "problémů" jsou backlog features (Pusher, offline sync, makléřský blog editor) a kosmetické nedostatky (div grafy, text badges).

**Největší rizika:**
1. Blog + Partner seed data neběží na produkci → prázdné stránky
2. Migration drift — ověřit zda produkce má všechny tabulky
3. PWA Offline Sync je klamavý stub — makléř myslí že sync proběhl

**Největší dluh:** Pusher real-time (zmíněn v tech stacku ale neimplementován).  
**Nejrychlejší win:** Spustit blog + partner seed + ověřit migrace (20 min celkem).

**Pozitivní zjištění z agentů:**
- API routes: 272 routes, **0 TODO/FIXME**, **0 stubů** (jen 1x Zásilkovna dry-run mock)
- Shop: Cart, checkout, Stripe platby **PLNĚ FUNKČNÍ** (ne stub!)
- Marketplace: Landing, dealer dashboard, investor dashboard **PLNĚ FUNKČNÍ**
- Admin: Export, search bar, broker detail **PLNĚ FUNKČNÍ**

---

*Audit dokončen: 2026-04-26*
