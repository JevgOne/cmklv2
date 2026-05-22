# Audit: Zbývající placeholdery + SEO + Komentáře

**Datum:** 2026-04-28
**Autor:** planovač
**Task:** #46

---

## 1. ZBÝVAJÍCÍ PLACEHOLDERY / STUBY / HARDCODED DATA

### Po Task #42 (recenze z DB) — co je VYŘEŠENO ✅

- ✅ `/recenze/page.tsx` — server component z DB (`prisma.review.findMany`)
- ✅ Homepage testimonials — z DB (featured reviews), sekce se skryje pokud prázdná
- ✅ Chci-prodat testimonial — z DB
- ✅ Schema.org recenze — reálný DB aggregate
- ✅ O nás tým — `prisma.teamMember.findMany()` (Task #38)
- ✅ Admin dashboard grafy — reálné CSS bar charts (Task #43)
- ✅ Makléř stats — data JSOU reálná (jen komentáře jsou zavádějící)

### Co ZBÝVÁ ❌

| # | Soubor | Problém | Závažnost |
|---|--------|---------|-----------|
| P1 | `app/(partner)/partner/documents/page.tsx:66` | **"Připravujeme"** — 2 ze 3 dokumentů jsou `available: false`. Partneři nemohou nahrávat/stahovat dokumenty. | STŘEDNÍ |
| P2 | `app/(web)/kariera/page.tsx:32-48` | **Hardcoded 3 pozice** (`const positions = [...]`). Stránka je `"use client"`, nelze exportovat metadata (řešeno v layout). | STŘEDNÍ |
| P3 | `app/(web)/kariera/layout.tsx:21-49` | **Hardcoded pozice i v layoutu** — duplikace pro JobPosting JSON-LD structured data. Pozice jsou hardcoded na DVOU místech. | STŘEDNÍ |
| P4 | `app/(pwa)/makler/onboarding/training/page.tsx:46` | **Placeholder pro video** — `"Placeholder for video — replace src with actual YouTube/Vimeo embed"`. Chybí skutečné training video. | NÍZKÝ (business content) |
| P5 | `app/(pwa)/makler/stats/page.tsx:138,337,358` | **Zavádějící komentáře** — říkají "placeholder" ale data JSOU reálná (`prisma.commission.aggregate()`). | NÍZKÝ (jen komentáře) |
| P6 | `lib/tecdoc.ts` | **Celý soubor je mock** — 50 generic dílů, 5 hardcoded vehicles. Vyžaduje TecDoc API smlouvu. | BUSINESS BLOKÁTOR |
| P7 | `lib/cebia.ts:24-89` | **Mock fallback** — bez `CEBIA_API_KEY` vrací fake "vše OK" report. | VYSOKÝ* (závisí na env) |
| P8 | `lib/shipping/base.ts` | **Dry-run mode** — bez carrier API klíčů vrací fake tracking čísla (`DRY-PPL-...`). | VYSOKÝ* (závisí na env) |
| P9 | `components/shop/ShopTrustBar.tsx:6-8` | **TODO(designer)** — text badges místo brand SVG ikon (Visa, MC, DPD...). | NÍZKÝ (vizuální) |

\* = Na produkci závisí na env proměnných. Pokud jsou API klíče nastaveny → funguje správně.

### Plány existují pro:
- **P1** (partner documents): `plan-partner-documents-20260428.md` ✅
- **P2+P3** (kariéra): `plan-reviews-from-db-20260428.md` sekce 1.6 ✅

---

## 2. SEO AUDIT

### 2.1 Sitemap (`app/sitemap.ts`) — ✅ SOLIDNÍ

Pokrývá:
- 26 statických stránek
- 16 SEO brand landing pages
- 12 SEO model pages
- 7 body type pages
- 5 price range pages
- 8 city pages
- 11 parts category pages
- 8 parts brand pages
- ~24 parts model pages
- ~72 parts model+year pages
- Dynamické: vozidla, makléři, hashtag tags, vrakoviště, bazary, inzeráty, blog články

**Chybí v sitemap:**
| Stránka | Priorita |
|---------|----------|
| `/cenik` | STŘEDNÍ — veřejná pricing stránka, důležitá pro konverze |
| `/sluzby` | STŘEDNÍ — přehled služeb (jednotlivé služby jsou v sitemap) |
| `/dily/[slug]` (jednotlivé díly) | NÍZKÝ — dynamické, ale produktové stránky by měly být v sitemap |
| `/shop/produkt/[slug]` (eshop produkty) | NÍZKÝ — dynamické produktové stránky |

### 2.2 Robots.txt (`app/robots.ts`) — ✅ OK

Správně blokuje:
- `/api/`, `/admin/`, `/makler/`
- `/marketplace/dashboard`, `/marketplace/investor`, `/marketplace/dealer`
- `/login`, `/prihlaseni`, `/registrace`
- Obsahuje sitemap odkaz

**Chybí v robots.txt disallow:**
| Cesta | Důvod |
|-------|-------|
| `/partner/` | Partner portal — private, neměl by být indexován |
| `/parts/` | PWA dodavatel dílů — private |
| `/muj-ucet/` | Uživatelský profil — private |
| `/moje-inzeraty/` | Private |
| `/shop/moje-objednavky/` | Private |
| `/dily/moje-objednavky/` | Private |

### 2.3 Metadata — ✅ DOBRÝ (96/~110 stránek)

- **96 stránek** má `export const metadata` nebo `generateMetadata`
- Zbylé stránky jsou buď **private** (vyžadují login) nebo **redirecty** (301)
- Client components (`"use client"`) řeší metadata v parent `layout.tsx`

**Stránky s metadata ale BEZ `openGraph`:**
| Stránka | Důležitost |
|---------|------------|
| `/cenik` | VYSOKÁ — pricing page, sdílení na sociálních sítích |
| `/bazar/[slug]` | STŘEDNÍ — partner landing pages |
| `/shop/produkt/[slug]` | STŘEDNÍ — produktové stránky |
| `/blog/kategorie/[slug]` | NÍZKÝ |
| `/dily/[slug]` | NÍZKÝ |
| `/marketplace/deals/[id]` | NÍZKÝ (gated behind login) |
| `/marketplace/dealer/` | NÍZKÝ (private) |
| `/marketplace/investor/` | NÍZKÝ (private) |

### 2.4 Canonical URLs — ✅ DOBRÝ (88 stránek)

- **88 stránek** používá `pageCanonical()` nebo `alternates`
- `lib/canonical.ts` centralizuje generování canonical URL
- Client components mají canonical v layout.tsx

**Stránky BEZ canonical:**
| Stránka | Důležitost |
|---------|------------|
| `/cenik` | STŘEDNÍ — duplicate content risk |
| `/marketplace/deals/[id]` | NÍZKÝ (gated) |
| `/marketplace/dealer/nova` | NÍZKÝ (private) |
| `/marketplace/dealer/` | NÍZKÝ (private) |
| `/marketplace/investor/` | NÍZKÝ (private) |
| `/nabidka/[slug]/platba` | NÍZKÝ (checkout) |

### 2.5 Structured Data (JSON-LD) — ✅ SOLIDNÍ

**Existující:**
- `BreadcrumbList` — na většině stránek
- `FAQPage` — chci-prodat, jak-prodat-auto, díly landing pages
- `Vehicle` (Car) — detail vozidla
- `JobPosting` — kariéra (v layout.tsx)
- `Article` — blog články
- `ItemList` — nabídka, díly
- `Service` — služby
- `Organization` — homepage

**Chybí:**
| Typ | Stránka | Důležitost |
|-----|---------|------------|
| `LocalBusiness` | `/kontakt` nebo homepage | STŘEDNÍ — lepší lokální SEO |
| `Product` | `/shop/produkt/[slug]` | STŘEDNÍ — eshop produkty by měly mít Product schema |
| `Product` | `/dily/[slug]` | STŘEDNÍ — díly produkty |
| `AggregateRating` | `/recenze` | NÍZKÝ — je v layout.tsx (pokud jsou data) |
| `WebSite` + `SearchAction` | homepage | NÍZKÝ — sitelinks search box v Google |

### 2.6 Celkové SEO hodnocení

| Oblast | Stav | Hodnocení |
|--------|------|-----------|
| Sitemap | 200+ URL, dynamické z DB | ⭐⭐⭐⭐ |
| Robots.txt | Správně nastaveno, chybí pár private cest | ⭐⭐⭐⭐ |
| Metadata | 96/~110 stránek pokryto | ⭐⭐⭐⭐ |
| OpenGraph | 82 stránek, chybí na pár důležitých | ⭐⭐⭐⭐ |
| Canonical | 88 stránek, centralizovaný systém | ⭐⭐⭐⭐⭐ |
| Structured data | 8+ typů implementováno | ⭐⭐⭐⭐ |
| SEO landing pages | 48+ branded pages | ⭐⭐⭐⭐⭐ |

**Celkově:** SEO je na VELMI DOBRÉ úrovni. Zbývají drobné optimalizace.

---

## 3. KOMENTÁŘOVÝ SYSTÉM

### 3.1 Současný stav — FUNKČNÍ, ale VYŽADUJE LOGIN

**Komponenty:**
- `components/web/blog/ArticleComments.tsx` — client component, form + seznam
- `app/api/blog/articles/[id]/comments/route.ts` — GET (public) + POST (auth required)
- `app/api/blog/articles/[id]/comments/[commentId]/route.ts` — PATCH/DELETE
- `app/api/comments/[id]/route.ts` — hide/delete (owner, admin, item owner)
- `app/api/admin/comments/[id]/route.ts` — admin moderation
- `app/(admin)/admin/blog/comments/page.tsx` — admin UI pro moderaci
- `app/(admin)/admin/blog/comments/CommentsModeration.tsx` — moderation component

**Model:** `ProfileComment` v Prisma (existující)

**Flow:**
1. Uživatel musí být **přihlášen** → `session?.user` check (API line 71, UI line 113)
2. Nepřihlášený vidí: _"Pro komentování se přihlaste"_ + link na `/prihlaseni`
3. Komentář se vytvoří s `isHidden: true` → čeká na admin schválení
4. Admin schvaluje v `/admin/blog/comments`
5. Rate limit: 3 komentáře za minutu per user
6. Max 1000 znaků, min 5 znaků

**Kde se komentáře zobrazují:**
- Blog články: `app/(web)/blog/[slug]/page.tsx:364-374`
- Profil stránky: komentáře pod vozidly/inzeráty (profileComments count)

### 3.2 Požadavek uživatele: komentáře BEZ registrace

**Co je potřeba změnit:**

#### A) API route — povolit anonymní komentáře

**Soubor:** `app/api/blog/articles/[id]/comments/route.ts`

```typescript
// Aktuální (line 71):
if (!session?.user) {
  return NextResponse.json({ error: "Pro komentování se přihlaste" }, { status: 401 });
}

// Nový:
const session = await getServerSession(authOptions);
const isAnonymous = !session?.user;
```

Pro anonymní komentáře potřebujeme:
1. **Jméno** — povinné pole (authorName)
2. **Email** — volitelné, pro notifikace o odpovědi
3. **Honeypot** — anti-spam pole (skryté, pokud vyplněno → spam)
4. **Rate limit po IP** — místo per-user → per-IP (5 komentářů za hodinu)

#### B) ProfileComment model — rozšířit

```prisma
model ProfileComment {
  // ... existing fields ...
  userId     String?                    // NULLABLE — anonymní komentáře
  authorName String?                    // pro anonymní (povinné pokud no userId)
  authorEmail String?                   // pro anonymní (optional)
}
```

Alternativa: Nový `BlogComment` model oddělený od `ProfileComment` (čistší separace, ale více kódu).

#### C) UI — ArticleComments.tsx

Místo `isLoggedIn ? <form> : <přihlaste se>` → vždy zobrazit formulář:
- Přihlášený: automaticky jméno z profilu
- Nepřihlášený: pole pro jméno + volitelný email

#### D) Anti-spam opatření (KRITICKÉ pro anonymní komentáře)

1. **Honeypot pole** — skryté CSS pole, bot ho vyplní → reject
2. **Rate limit per IP** — 5 komentářů za hodinu per IP
3. **Min delay** — komentář nelze odeslat dřív než 5s po načtení stránky
4. **isHidden: true** default — admin moderace zůstává
5. **Optional:** CAPTCHA (reCAPTCHA v3) — ale přidává dependency

### 3.3 Implementační plán

| Soubor | Akce |
|--------|------|
| `prisma/schema.prisma` | ProfileComment: userId nullable, +authorName, +authorEmail |
| `app/api/blog/articles/[id]/comments/route.ts` | POST: povolit bez session, validovat authorName, honeypot, IP rate limit |
| `components/web/blog/ArticleComments.tsx` | Form vždy viditelný, jméno pole pro anon |
| `app/(admin)/admin/blog/comments/CommentsModeration.tsx` | Zobrazit authorName pro anon komentáře |

**Effort:** ~2-3h

---

## 4. DOPORUČENÉ AKCE (prioritizováno)

### VYSOKÁ priorita

| # | Akce | Effort | Důvod |
|---|------|--------|-------|
| 1 | Komentáře bez registrace | 2-3h | Uživatel to explicitně požaduje |
| 2 | Partner documents — nahradit "Připravujeme" | 3-5h | Plán existuje, poslední user-facing stub |
| 3 | Kariéra z DB (JobPosition model) | 2-3h | Plán existuje, hardcoded na 2 místech |

### STŘEDNÍ priorita

| # | Akce | Effort | Důvod |
|---|------|--------|-------|
| 4 | Sitemap: přidat `/cenik`, `/sluzby` | 15min | Chybí 2 důležité veřejné stránky |
| 5 | `/cenik` — přidat openGraph + canonical | 10min | Pricing page bez OG = špatné sdílení |
| 6 | Robots.txt — přidat `/partner/`, `/parts/`, `/muj-ucet/` | 5min | Private cesty by neměly být indexovány |
| 7 | Product JSON-LD na `/shop/produkt/[slug]` | 1h | Eshop produkty bez structured data |

### NÍZKÁ priorita

| # | Akce | Effort | Důvod |
|---|------|--------|-------|
| 8 | Smazat zavádějící komentáře v `makler/stats` | 5min | Kód říká "placeholder" ale data jsou reálná |
| 9 | ShopTrustBar SVG ikony | 1h | Vizuální, ne funkční |
| 10 | LocalBusiness JSON-LD na kontakt/homepage | 30min | Lepší lokální SEO |
| 11 | WebSite+SearchAction JSON-LD na homepage | 30min | Sitelinks search box v Google |

---

## STOP PRAVIDLA

1. **STOP** — komentáře: `isHidden: true` default ZŮSTÁVÁ (admin moderace)
2. **STOP** — anonymní komentáře: honeypot + IP rate limit POVINNÉ
3. **STOP** — žádné CAPTCHA dependency pokud honeypot + rate limit stačí
4. **STOP** — ProfileComment model rozšířit, NE nový model
5. **STOP** — sitemap: přidávat jen VEŘEJNÉ stránky
