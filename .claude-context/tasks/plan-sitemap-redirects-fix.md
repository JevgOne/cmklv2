# PLÁN: Fix sitemap — redirecty, 404, canonical problémy (Google Search Console)

**Datum:** 2026-05-20
**Priorita:** P1 (GSC hlásí problémy s indexováním)
**Cesta:** `app/sitemap.ts`

---

## EXECUTIVE SUMMARY

Google Search Console hlásí problémy s indexováním — stránky v sitemap vracejí redirect. Audit identifikoval **3 typy problémů** v `app/sitemap.ts`:

1. **Redirect stránky v sitemap** — sitemap neobsahuje redirect URL přímo, ALE existují redirect route aliases (`/h/[slug]`, `/tag/[slug]`, `/dodavatel/[slug]`, `/makler/[slug]`, `/prihlaseni`) které mohou být nalinkované z webu a Google je najde
2. **Potenciální 404** — sitemap generuje URL z DB dat (vehicles, parts, listings), pokud se status změní na neaktivní ale slug zůstane → 404
3. **Stránka `/pro-maklere`** je v sitemap ale nemá metadata
4. **Duplicitní content** — díly jsou v sitemap 2x (jako `/dily/[slug]` i `/shop/produkt/[slug]`)

---

## ANALÝZA SITEMAP.TS

### Statické stránky (31 URL)

Audit každé statické URL:

| URL | Existuje route? | Vrací 200? | Problém |
|-----|----------------|------------|---------|
| `/` | ✅ | ✅ | — |
| `/nabidka` | ✅ | ✅ | — |
| `/chci-prodat` | ✅ | ✅ | — |
| `/makleri` | ✅ | ✅ | — |
| `/inzerce` | ✅ | ✅ | — |
| `/shop` | ✅ | ✅ | — |
| `/sluzby/proverka` | ✅ | ✅ | — |
| `/sluzby/financovani` | ✅ | ✅ | — |
| `/sluzby/pojisteni` | ✅ | ✅ | — |
| `/recenze` | ✅ | ✅ | — |
| `/o-nas` | ✅ | ✅ | — |
| `/kariera` | ✅ | ✅ | — |
| `/blog` | ✅ | ✅ | — |
| `/kontakt` | ✅ | ✅ | — |
| `/cenik` | ✅ | ✅ | — |
| `/sluzby` | ✅ | ✅ | — |
| `/pro-maklere` | ✅ | ✅ | ⚠️ Chybí metadata (viz SEO audit) |
| `/jak-prodat-auto` | ✅ | ✅ | — |
| `/kolik-stoji-moje-auto` | ✅ | ✅ | — |
| `/obchodni-podminky` | ✅ | ✅ | — |
| `/ochrana-osobnich-udaju` | ✅ | ✅ | — |
| `/reklamacni-rad` | ✅ | ✅ | ⚠️ Stránka existuje ale byla odebrána z footer navigace |
| `/zasady-cookies` | ✅ | ✅ | — |
| `/jak-to-funguje` | ✅ | ✅ | — |
| `/marketplace` | ✅ | ✅ | — |
| `/marketplace/apply` | ✅ | ✅ | — |
| `/inzerce/katalog` | ✅ | ✅ | ⚠️ Chybí metadata |
| `/shop/katalog` | ✅ | ✅ | — |
| `/dily/katalog` | ✅ | ✅ | — |
| `/shop/vraceni-zbozi` | ✅ | ✅ | — |
| `/shop/reklamace` | ✅ | ✅ | — |
| `/nabidka/porovnani` | ✅ | ✅ | — |

**Výsledek:** Všech 31 statických URL existuje a vrací 200. Žádný redirect.

### SEO landing pages (generované z `lib/seo-data.ts`)

| Typ | Count | URL pattern | Status |
|-----|-------|-------------|--------|
| Značky | 16 | `/nabidka/{brand}` | ✅ OK |
| Modely | 12 | `/nabidka/{brand}/{model}` | ✅ OK |
| Karoserie | 7 | `/nabidka/{bodyType}` | ✅ OK |
| Ceny | 5-6 | `/nabidka/do-{price}` | ✅ OK |
| Města | 8 | `/nabidka/{city}` | ✅ OK |
| Díly kategorie | 11 | `/dily/kategorie/{slug}` | ✅ OK |
| Díly značky | 8 | `/dily/znacka/{brand}` | ✅ OK |
| Díly značka+model | ~24 | `/dily/znacka/{brand}/{model}` | ✅ OK |
| Díly značka+model+rok | ~72 | `/dily/znacka/{brand}/{model}/{year}` | ✅ OK |

**Výsledek:** Všechny SEO landing URL jsou staticky definované, route existuje. OK.

### Dynamické stránky (z Prisma DB)

| Typ | URL pattern | Potenciální problém |
|-----|-------------|---------------------|
| Vozidla | `/nabidka/{slug}` | ⚠️ SOLD/DELETED vozidlo → 404 |
| Makléři | `/profil/{slug}` | ⚠️ DEACTIVATED makléř → 404 |
| Tagy | `/makleri/{slug}` | ✅ Filtruje >= 2 aktivní brokeři |
| Vrakoviště | `/dily/vrakoviste/{slug}` | ⚠️ DEACTIVATED partner → 404 |
| Autobazary | `/bazar/{slug}` | ⚠️ DEACTIVATED partner → 404 |
| Blog | `/blog/{slug}` | ✅ Filtruje PUBLISHED |
| Díly | `/dily/{slug}` + `/shop/produkt/{slug}` | ⚠️ SOLD/DELETED díl → 404 |
| Inzeráty | `/inzerce/katalog/{slug}` | ⚠️ EXPIRED/DELETED listing → 404 |

**Hlavní riziko:** Sitemap se generuje z DB s filtrem `status: "ACTIVE"`, ale mezi generováním sitemap a crawlem Googlebota může status změnit → Google dostane 404 → GSC hlásí problém.

---

## NALEZENÉ PROBLÉMY

### Problém 1: Duplicitní URL pro díly

`sitemap.ts:418-431`:
```typescript
partPages = parts
  .filter((p) => p.slug)
  .flatMap((p) => [
    {
      url: `${BASE_URL}/dily/${p.slug}`,        // ← URL 1
      ...
    },
    {
      url: `${BASE_URL}/shop/produkt/${p.slug}`, // ← URL 2 (DUPLICITA!)
      ...
    },
  ]);
```

Každý díl je v sitemap 2x. Google to vidí jako **duplicitní content** a může penalizovat.

**Fix:** Zvolit jednu kanonickou URL. Doporučení: `/dily/[slug]` jako primární (eshop dílů), `/shop/produkt/[slug]` jen pokud je to jiný produkt (aftermarket shop).

Pokud `/dily/[slug]` a `/shop/produkt/[slug]` zobrazují STEJNÝ Part → ponechat jen jednu URL v sitemap a na druhé přidat `<link rel="canonical">`.

### Problém 2: Redirect aliases mimo sitemap ale nalinkované

Tyto redirect stránky NEJSOU v sitemap (správně), ale mohou být nalinkované z webu nebo z externích zdrojů:

| Redirect route | Cíl | Odkud může přijít |
|---------------|-----|-------------------|
| `/h/[slug]` → `/makleri/[slug]` | Staré makléřské URL | Starší SEO, sociální sítě |
| `/tag/[slug]` → `/makleri/[slug]` | Tag prefix | Interní linky? |
| `/dodavatel/[slug]` → `/dily/vrakoviste/[slug]` | Staré dodavatelské URL | Starší verze webu |
| `/makler/[slug]` → `/profil/[slug]` | Staré makléřské URL | Starší verze webu |
| `/prihlaseni` → `/login` | Český alias | Interní linky |
| `/auth/prihlasit` → `/login` | next.config redirect | Starší verze |

**Toto je pravděpodobný zdroj GSC problémů** — Google našel tyto URL (z interních odkazů nebo z dřívějšího indexu) a hlásí redirect.

**Fix:** 
1. Prohledat celý codebase na odkazy na tyto redirect URL
2. Nahradit odkazy kanonickými URL
3. Ponechat redirect routes pro backward compatibility (301 je správný)

### Problém 3: `/reklamacni-rad` v sitemap ale odebraný z navigace

Stránka `/reklamacni-rad` existuje a vrací 200, je v sitemap, ale byla odebrána z footer navigace. To samo o sobě NENÍ problém — stránka je stále platná a indexovatelná.

**Doporučení:** Ponechat v sitemap. Reklamační řád je povinný dokument, i bez odkazu v footeru by měl být indexován.

### Problém 4: Dynamické stránky mohou vracet 404

Sitemap generuje URL z DB s `WHERE status = 'ACTIVE'`. Pokud se status změní mezi generováním sitemap a crawlem:

- Vozidlo SOLD → `/nabidka/skoda-octavia-2019-xyz` → 404
- Díl SOLD → `/dily/motor-skoda-1-9-tdi` → 404

**Fix:** Na dynamických detail stránkách vrátit **410 Gone** místo 404 pro smazané/prodané položky. Google pak URL odstraní z indexu.

Alternativně přidat `lastModified` z DB a nastavit nízkou `changeFrequency` ("daily") → Google recrawluje často a zjistí 404 rychle.

**Aktuální stav:** Sitemap už správně používá `changeFrequency: "daily"` a `lastModified: v.updatedAt` pro dynamické stránky. To je dobré.

---

## IMPLEMENTAČNÍ PLÁN

### Fix 1: Odstranit duplicitní díly URL (P1)

**`app/sitemap.ts`** — změnit `flatMap` na `map`:

```typescript
// PŘED:
partPages = parts
  .filter((p) => p.slug)
  .flatMap((p) => [
    { url: `${BASE_URL}/dily/${p.slug}`, ... },
    { url: `${BASE_URL}/shop/produkt/${p.slug}`, ... },
  ]);

// PO:
partPages = parts
  .filter((p) => p.slug)
  .map((p) => ({
    url: `${BASE_URL}/dily/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
```

A přidat canonical link na `/shop/produkt/[slug]/page.tsx`:
```tsx
export async function generateMetadata({ params }) {
  return {
    // ... existing
    alternates: {
      canonical: `https://carmakler.cz/dily/${slug}`,
    },
  };
}
```

### Fix 2: Audit interních odkazů na redirect URL (P1)

Prohledat codebase:
```bash
grep -rn '"/h/' --include="*.tsx" --include="*.ts" app/ components/
grep -rn '"/tag/' --include="*.tsx" --include="*.ts" app/ components/
grep -rn '"/dodavatel/' --include="*.tsx" --include="*.ts" app/ components/
grep -rn '"/makler/' --include="*.tsx" --include="*.ts" app/ components/
grep -rn '"/prihlaseni' --include="*.tsx" --include="*.ts" app/ components/
grep -rn '"/auth/prihlasit' --include="*.tsx" --include="*.ts" app/ components/
```

Pokud nalezeny → nahradit kanonickými URL:
- `"/h/{slug}"` → `"/makleri/{slug}"`
- `"/tag/{slug}"` → `"/makleri/{slug}"`
- `"/dodavatel/{slug}"` → `"/dily/vrakoviste/{slug}"`
- `"/makler/{slug}"` → `"/profil/{slug}"`
- `"/prihlaseni"` → `"/login"`

### Fix 3: 410 Gone pro smazané dynamické stránky (P2)

Na detail stránkách přidat handling pro neexistující/neaktivní záznamy:

```tsx
// app/(web)/nabidka/[slug]/page.tsx
import { notFound } from "next/navigation";

// V generateMetadata i v page komponentě:
const vehicle = await prisma.vehicle.findUnique({ where: { slug } });
if (!vehicle || vehicle.status !== "ACTIVE") {
  notFound(); // Next.js vrátí 404
}
```

**Pozn.:** Next.js `notFound()` vrací 404, ne 410. Pro 410 by bylo potřeba custom middleware nebo route handler. Pro MVP stačí 404 — Google ho také zpracuje, jen pomaleji.

### Fix 4: Přidat metadata na chybějící stránky (P1)

Viz `plan-seo-meta-celyweb.md` — `/inzerce/katalog` a `/pro-maklere`.

---

## DIFF SUMMARY

| Soubor | Změna | Priorita |
|--------|-------|----------|
| `app/sitemap.ts` | Odstranit duplicitní `/shop/produkt/` URL | P1 |
| `app/(web)/shop/produkt/[slug]/page.tsx` | Přidat `canonical` → `/dily/[slug]` | P1 |
| Interní odkazy | Nahradit redirect URL kanonickými | P1 |
| Detail stránky (nabidka, dily, bazar, profil) | Ověřit `notFound()` handling | P2 |
| `app/(web)/inzerce/katalog/page.tsx` | Přidat metadata export | P1 |
| `app/(web)/pro-maklere/page.tsx` | Přidat metadata export | P1 |

---

## TESTOVÁNÍ

1. **Sitemap validace:**
   ```bash
   curl -s https://carmakler.cz/sitemap.xml | xmllint --noout -
   ```

2. **Redirect check:**
   ```bash
   # Ověřit, že redirect stránky NEJSOU v sitemap
   curl -s https://carmakler.cz/sitemap.xml | grep -E '/h/|/tag/|/dodavatel/|/makler/|/prihlaseni'
   # Mělo by vrátit prázdno
   ```

3. **Duplicity check:**
   ```bash
   curl -s https://carmakler.cz/sitemap.xml | grep -oP 'https://[^<]+' | sort | uniq -d
   # Neměly by být žádné duplicity
   ```

4. **GSC re-submit:**
   Po nasazení fixů → GSC → Sitemaps → Re-submit sitemap.xml

5. **Status code check pro dynamické stránky:**
   ```bash
   # Sample 10 random vehicle URLs from sitemap
   curl -s https://carmakler.cz/sitemap.xml | grep '/nabidka/' | head -10 | \
     xargs -I{} curl -o /dev/null -s -w "%{http_code} {}\n" {}
   ```

---

## STOP PRAVIDLA

- **STOP-1:** Pokud `/dily/[slug]` a `/shop/produkt/[slug]` zobrazují RŮZNÝ obsah (ne stejný Part) → NEMAZAT z sitemap, řešit jinak
- **STOP-2:** Pokud grep na redirect URL najde odkazy v externích systémech (email šablony, třetí strany) → ty nemůžeme opravit, redirect musí zůstat
- **STOP-3:** Pokud GSC hlásí jiný typ problémů než redirect (soft 404, server error) → rozšířit audit

---

## GSC SPECIFICKÉ AKCE

Po nasazení fixů provést v Google Search Console:

1. **Sitemaps → Remove old** → re-submit `sitemap.xml`
2. **URL Inspection** na problémové URL → Request indexing
3. **Page indexing report** → sledovat pokles "Redirect" a "Not found (404)" errors
4. **Core Web Vitals** → ověřit, že sitemap změny neovlivnily
