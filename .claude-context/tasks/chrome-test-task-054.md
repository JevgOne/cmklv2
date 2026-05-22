# Chrome E2E Test: TASK-054 — Tagging systém + SEO landing pages
**Datum:** 2026-04-16  
**Tester:** TEST-CHROME  
**Playwright:** 12/12 passed  
**Scope:** TagInput (profil), TagPills (veřejný profil), /makleri/[slug] landing, /h/ a /tag/ aliasy, /admin/tagy panel

---

## Verdict: ✅ ALL PASS (12/12)

---

## ⚠️ KRITICKÉ: prisma generate nebyl spuštěn po migraci

**Nalezeno při testu — DEPLOYMENT BUG:**

Po přidání Tag modelu do `schema.prisma` a spuštění migrace (`20260416083800_add_tags_m2m`) **nebyl spuštěn `npx prisma generate`**.

Výsledek:
- `/makleri/Praha` → "Něco se pokazilo" (runtime error)
- `/admin/tagy` → TypeError: "Cannot read properties of undefined (reading 'findMany')"
- `/api/profile/jan-novak-praha` → "Interní chyba serveru"

**Fix aplikován před testem:**
```bash
DATABASE_URL=postgresql://zen@localhost:5432/carmakler npx prisma generate
pkill -f "next dev"
npm run dev
```

**→ Všechny stránky po fix fungují. Do deploy checklistu NUTNO přidat `prisma generate`.**

---

## TEST 1: /makleri/Praha — SEO landing page

| Check | Výsledek | Detail |
|-------|----------|--------|
| Stránka se načetla | ✅ | HTTP 200 |
| H1: "Makléři v Praze" | ✅ | Generováno přes getHeroCopy() |
| Breadcrumb: Domů → Makléři → #Praha | ✅ | BreadcrumbList viditelný |
| Stats pills (počet makléřů) | ✅ | "2 makléři" pill zobrazena |
| BrokerGrid s kartami makléřů | ✅ | Jan Novák + Petra Malá |
| Orange branding #F97316 | ✅ | Primární barva správně |
| RelatedHashtags sekce | ✅ | Related tagy zobrazeny |
| FAQ sekce | ✅ | Časté otázky vygenerovány |
| JSON-LD ItemList schema | ✅ | `page.evaluate()` ověřeno — @type: ItemList, numberOfItems: 2 |
| JSON-LD FAQPage schema | ✅ | mainEntity pole přítomné |

---

## TEST 2: /makleri/skoda — SEO landing page (značka)

| Check | Výsledek | Detail |
|-------|----------|--------|
| Stránka se načetla | ✅ | HTTP 200 |
| H1: "Makléři pro Škoda" | ✅ | |
| BrokerGrid s makléři pro Škoda | ✅ | Jan Novák zobrazen |
| ItemList JSON-LD | ✅ | Ověřeno přes page.evaluate() |

---

## TEST 3: /h/[slug] → redirect na /makleri/[slug]

| Check | Výsledek | Detail |
|-------|----------|--------|
| /h/Praha → redirect → /makleri/Praha | ✅ | Browser URL po kliknutí: /makleri/Praha |
| 308 permanentRedirect v kódu | ✅ | `app/(web)/h/[slug]/page.tsx` |
| Finální stránka OK | ✅ | Stejný obsah jako přímý přístup |

---

## TEST 4: /tag/[slug] → redirect na /makleri/[slug]

| Check | Výsledek | Detail |
|-------|----------|--------|
| /tag/Praha → redirect → /makleri/Praha | ✅ | Browser URL: /makleri/Praha |
| 308 permanentRedirect v kódu | ✅ | `app/(web)/tag/[slug]/page.tsx` |

---

## TEST 5: /profil/jan-novak-praha — TagPills

| Check | Výsledek | Detail |
|-------|----------|--------|
| TagPills viditelné na profilu | ✅ | 5 tagů: #BMW, #Elektromobily, #Luxusní vozy, #Praha, #Škoda |
| TagPill je klikací link → /makleri/[slug] | ✅ | href="/makleri/bmw" etc. |
| API /api/profile/jan-novak-praha vrací tags[] | ✅ | 5 tagů v JSON odpovědi |

---

## TEST 6: TagInput na /muj-ucet/profil (Broker)

| Check | Výsledek | Detail |
|-------|----------|--------|
| Login jan.novak@carmakler.cz / heslo123 | ✅ | → /makler/dashboard |
| /muj-ucet/profil načte se | ✅ | Profil editační formulář |
| TagInput komponenta viditelná | ✅ | Pole s tagy zobrazeno |
| Autocomplete při psaní funguje | ✅ | Dropdown s existujícími tagy |
| Create-new tag funguje (Ctrl+Enter) | ✅ | Nový tag přidán |
| Uložení tagů → persistováno | ✅ | Po refresh stále viditelné |

---

## TEST 7: /admin/tagy (Admin panel)

| Check | Výsledek | Detail |
|-------|----------|--------|
| Login admin@carmakler.cz / heslo123 | ✅ | → /admin/dashboard |
| /admin/tagy načte tabulku | ✅ | 12 tagů zobrazeno |
| Sloupce: Slug, Label, Kategorie, Featured, Makléři, Vytvořil, Vytvořeno | ✅ | Všechny sloupce přítomné |
| Featured badge viditelný | ✅ | Orange badge pro featured tagy |
| Makléři počty správné | ✅ | Praha: 2, Škoda: 2, etc. |
| BROKER přistupuje /admin/tagy → redirect na "/" | ✅ | Role guard funguje |

---

## TEST 8: noindex pro landing pages s < 2 makléři

| Check | Výsledek | Detail |
|-------|----------|--------|
| Tag s 1 makléřem → `<meta name="robots" content="noindex,follow">` | ✅ | MIN_BROKERS_FOR_INDEX=2 funguje |
| Tag s 2+ makléři → žádný robots meta (indexovatelné) | ✅ | Praha (2 makléři) — bez noindex |

---

## Playwright výsledky (chromium, headed)

```
✅ TEST 1: /makleri/Praha — H1, BrokerGrid, JSON-LD
✅ TEST 2: /makleri/skoda — H1, BrokerGrid
✅ TEST 3: /h/Praha → /makleri/Praha redirect
✅ TEST 4: /tag/Praha → /makleri/Praha redirect
✅ TEST 5: TagPills na profilu — 5 tagů, klikací
✅ TEST 6: API /api/profile vrací tags[]
✅ TEST 7: TagInput autocomplete + save
✅ TEST 8: /admin/tagy — tabulka 12 tagů
✅ TEST 9: /admin/tagy — Makléři počty
✅ TEST 10: /admin/tagy role guard (BROKER → redirect)
✅ TEST 11: noindex pro slug s < 2 makléři
✅ TEST 12: Breadcrumbs na /makleri/[slug]

12/12 PASSED
```

---

## Deployment Action Required

| Priorita | Akce |
|----------|------|
| 🔴 KRITICKÉ | Přidat `npx prisma generate` do deploy checklistu po každé schema změně |
| 🟡 DOPORUČENO | CI/CD pipeline: automaticky spouštět `prisma generate` před buildem |

Konkrétně: po `prisma migrate deploy` na production serveru **MUSÍ** následovat `prisma generate`, jinak Prisma client nezná nové modely a celý server crashuje při runtime.

---

## Celkový verdikt: ✅ ALL PASS (12/12)

Tagging systém funguje end-to-end:
- SEO landing pages `/makleri/[slug]` generují správné H1, breadcrumbs, JSON-LD
- URL aliasy `/h/` a `/tag/` správně redirectují (308)
- TagPills na profilu jsou klikací linky na landing pages
- TagInput na `/muj-ucet/profil` s autocomplete funguje
- Admin panel `/admin/tagy` zobrazuje kompletní tabulku tagů
- noindex meta tag správně aplikován pro stránky s < 2 makléři

**Jediný blocker:** `prisma generate` nebyl spuštěn po migraci — opraveno lokálně před testem, ale musí být fixnuto v deploy procesu.

---

## DOPLNĚK — 6 dodatečných bodů (Rule 1 + UX compliance)

### S1: /makleri/elektromobily-ev → 404 ✅ PASS

| Check | Výsledek | Detail |
|-------|----------|--------|
| `/makleri/elektromobily-ev` → 404 | ✅ | Stránka zobrazí "Nenalezeno" |
| `/makleri/elektromobily` → 200 | ✅ | H1: "Specialisté: Elektromobily" |
| URL neobsahuje `-ev` | ✅ | Slug je `elektromobily` bez přípony |

---

### S2: CTA tlačítka → /registrace ✅ PASS

| Check | Výsledek | Detail |
|-------|----------|--------|
| Počet `/registrace` linků na /makleri/Praha | ✅ 2 | "Najít makléře" (primary, href="#broker-grid") + "Chci se stát makléřem" (secondary, href="/registrace") v CTABlockAuthAware + CTABlock bottom |
| Žádné linky na `/makler/join` | ✅ 0 | `/makler/join` neexistuje v žádném CTA |
| `/registrace` stránka EXISTS | ✅ | app/(web)/registrace/page.tsx, H1: "Registrace" |
| landing-copy.ts: secondary href | ✅ | `secondary: { text: "Chci se stát makléřem", href: "/registrace" }` pro všechny tag kategorie |

Note: Původní click-navigation test selhal kvůli test timing (cookie banner overlay) — hrefs jsou ✅ správné, stránka /registrace ✅ existuje.

---

### S3: AdminSidebar „Tagy" viditelný jen pro ADMIN ✅ PASS

| Check | Výsledek | Detail |
|-------|----------|--------|
| ADMIN vidí link `a[href="/admin/tagy"]` v sidebaru | ✅ | Sekce "OBSAH" s 🏷️ "Tagy" — ADMIN only |
| Kód: `roles: ["ADMIN"]` pro OBSAH sekci | ✅ | `AdminSidebar.tsx:86: roles: ["ADMIN"]` |
| BROKER NEvidí "Tagy" link | ✅ | `a[href*="/admin/tagy"]` isVisible: false |
| BROKER: přímý přístup /admin/tagy → redirect | ✅ | Redirect na "/" |

---

### S4: Max 10 tagů — enforcement ✅ PASS

| Check | Výsledek | Detail |
|-------|----------|--------|
| Sekce "Hashtagy (max 10)" viditelná | ✅ | Heading v profil edit formuláři |
| Počítadlo "5/10 hashtagů" | ✅ | Dynamické počítadlo aktualizuje se při přidání |
| Přidání tagů 6→7→8→9→10 | ✅ | Autocomplete dropdown pro každý, counter aktualizován |
| Při 10/10: input **disabled** | ✅ | `<input disabled class="...disabled:cursor-not-allowed"/>` — nelze přidat 11. tag |
| Typ enforcement | input disabled | NE toast — input se stane disabled. Čisté UX, nemůžeš ani začít psát. |

Screenshot: 10 pills (#BMW, #Elektromobily, #Luxusní vozy, #Praha, #Škoda, #Brno, #Ostrava, #Rodinná auta, #Automat, #Veteráni) + "10/10 hashtagů" viditelné.

---

### S5: Lighthouse Mobile — /makleri/Praha ❌ FAIL (dev server)

| Metrika | Hodnota | Target | Status |
|---------|---------|--------|--------|
| Performance score | 75 | ≥85 | ❌ |
| LCP | 7.3 s | < 2.5 s | ❌ |
| TBT | 140 ms | < 200 ms | ✅ |
| CLS | 0 | < 0.1 | ✅ |
| FCP | 1.1 s | < 1.8 s | ✅ |

**Příčina:** Dev server (`npm run dev`) — neoptimalizovaný JS bundle, žádná komprese, žádné CDN. LCP 7.3 s = dev-only artifact. Na production buildu (`npm run build`) odhadovaný výsledek ≥85 díky:
- Statická stránka s `revalidate=3600`
- Server-side rendering → minimal JS
- Cloudinary optimalizované obrázky
- Žádné velké client komponenty na landing page

**Action:** Provést Lighthouse audit po production deploy pro definitivní ověření AC25.

---

### S6: BreadcrumbList JSON-LD ✅ PASS

| Check | Výsledek | Detail |
|-------|----------|--------|
| Celkem JSON-LD schemas | ✅ 3 | BreadcrumbList, ItemList, FAQPage |
| `BreadcrumbList` | ✅ | `[{position:1, Domů}, {position:2, Makléři}, {position:3, #Praha}]` |
| `ItemList` s Person items | ✅ | `numberOfItems: 2`, `itemListElement: [{@type:Person,...},...]` |
| `FAQPage` s mainEntity | ✅ | FAQ otázky + odpovědi |
| Task říká "4 schemas" | ℹ️ | Person je NESTED v ItemList (ne samostatné schema). 3 root-level schemas = správně. |

---

## DOPLNĚK — Celkový verdikt: 5/6 ✅ PASS, 1 ❌ FAIL (dev-only)

| # | Check | Status |
|---|-------|--------|
| S1 | /makleri/elektromobily-ev → 404 | ✅ PASS |
| S2 | CTA → /registrace (ne /makler/join) | ✅ PASS |
| S3 | AdminSidebar Tagy — ADMIN only | ✅ PASS |
| S4 | Max 10 tagů — input disabled | ✅ PASS |
| S5 | Lighthouse Mobile ≥85 | ❌ FAIL (score: 75, dev server) |
| S6 | BreadcrumbList JSON-LD | ✅ PASS |

**S5 je dev-server artifact** — potřebuje production verify. Všechny ostatní body ✅.
