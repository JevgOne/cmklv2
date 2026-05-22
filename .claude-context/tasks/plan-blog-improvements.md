# Plan: Blog vylepšení — "Blog vypadá fakt hrozně"

**Datum:** 2026-04-26
**Status:** PLAN READY
**Kontext:** Uživatel: "Blog vypada fakt hrozne", "nema to žádný obrazek a je to proste uplně obyčejny"

---

## Diagnóza — 3 nezávislé problémy

### Problem 1 (KRITICKÝ): `@tailwindcss/typography` NENÍ nainstalovaný

**Detail článku** (`app/(web)/blog/[slug]/page.tsx:288`) používá Tailwind `prose` classes:

```tsx
<article className="prose prose-lg max-w-none prose-headings:font-bold ..."
  dangerouslySetInnerHTML={{ __html: article.content }}
/>
```

**ALE:** Plugin `@tailwindcss/typography` není v `package.json` ani importovaný v `app/globals.css`. V Tailwind CSS 4 je potřeba:
1. `npm install @tailwindcss/typography`
2. Přidat `@plugin "@tailwindcss/typography"` do `globals.css`

**Důsledek:** Všechny `prose` classes jsou **inertní** — žádné styly se neaplikují. HTML content (`<h2>`, `<p>`, `<ul>`, `<blockquote>`) se renderuje jako neformátovaný text bez marginu, paddingu, správné velikosti fontů. To je hlavní důvod proč blog "vypadá fakt hrozně".

### Problem 2: Seed data na produkci

`prisma/seed-blog.ts` obsahuje **10 kvalitních článků** s:
- Plným HTML obsahem (`<h2>`, `<p>`, `<h3>`, `<ul>`, `<li>`, `<strong>`)
- Cover obrázky z Unsplash (1200x675, validní URLs)
- Excerpt, readTime, SEO title/description, views, tags

**ALE:** Tento seed file byl přidán nedávno (`chore(seed): add blog test articles`). Není jisté, zda byl spuštěn na produkci. Pokud ne, produkční blog má buď:
- Žádné články, nebo
- Články vytvořené přes admin editor (raw HTML textarea) — pravděpodobně bez HTML tagů

### Problem 3: Blog editor je jen textarea

**Admin editor** (`app/(admin)/admin/blog/[id]/edit/ArticleEditor.tsx:224-230`):

```tsx
<textarea
  value={content}
  onChange={(e) => setContent(e.target.value)}
  rows={20}
  placeholder="<h2>Nadpis</h2><p>Text článku...</p>"
  className={`${inputClass} font-mono text-xs`}
/>
```

Admin musí psát **surové HTML ručně**. Žádný WYSIWYG editor. To vede k plain text obsahu bez formátování.

---

## Plán oprav — seřazeno podle priority

### Krok 1: Nainstalovat `@tailwindcss/typography` (KRITICKÝ)

**Příkaz:**
```bash
npm install @tailwindcss/typography
```

**Edit:** `app/globals.css` — přidat plugin import:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

**Ověření:** Po buildu zkontrolovat, že `prose` classes generují styly (margins na `<p>`, velikost `<h2>`, indentace `<ul>`, border na `<blockquote>`).

**Složitost:** TRIVIÁLNÍ (1 install + 1 řádek CSS)
**Dopad:** OBROVSKÝ — okamžitě opraví vzhled VŠECH článků

### Krok 2: Spustit seed-blog.ts na produkci

```bash
ssh server
cd /var/www/carmakler
npx tsx prisma/seed-blog.ts
```

Seed používá `upsert` pro kategorie/tagy a `findUnique` check před vytvoření článku (skip existing). Bezpečné spustit opakovaně.

**Složitost:** TRIVIÁLNÍ (1 příkaz)
**Dopad:** 10 kvalitních článků s obrázky okamžitě na blogu

### Krok 3: Fallback pro články bez cover image

Aktuálně: článek bez cover image → karta v listingu nemá žádný vizuální element, jen text.

**Edit:** `app/(web)/blog/page.tsx` — přidat gradient placeholder pro karty bez obrázku:

```tsx
{article.coverImage ? (
  <div className="relative aspect-[16/9]">
    <Image src={article.coverImage} ... />
  </div>
) : (
  <div className="aspect-[16/9] bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
    <span className="text-4xl">{article.category?.icon || "📝"}</span>
  </div>
)}
```

Stejně pro related articles v `blog/[slug]/page.tsx`.

**Složitost:** MALÁ
**Dopad:** Každá karta má vizuální prvek, i bez obrázku

### Krok 4: Vylepšit blog listing page (NEPOVINNÉ)

Blog listing (`app/(web)/blog/page.tsx`) je funkční, ale vizuálně slabší:

#### 4a: Hero gradient header (jako detail má)
Přidat gradient header místo bílého pozadí:

```tsx
<div className="bg-gradient-to-b from-orange-50 to-white">
  <div className="max-w-7xl mx-auto px-4 py-12">
    <h1>Blog & Magazín</h1>
    <p>Rady, tipy, recenze...</p>
  </div>
</div>
```

#### 4b: Hover efekty na kartách
Přidat `hover:-translate-y-1 transition-all` na kartách (detail page related articles to mají, listing ne).

**Složitost:** MALÁ
**Dopad:** Vizuální konzistence s zbytkem webu

### Krok 5: Rich text editor (BUDOUCNOST — mimo scope)

Nahradit textarea za WYSIWYG editor (např. TipTap — Headless, React-native, 20kB).

**Proč zatím NE:**
- Vyžaduje novou závislost + konfiguraci
- Admin může psát HTML ručně (placeholder to naznačuje)
- AI draft generator (`AiDraftGenerator.tsx`) generuje content — pravděpodobně rovnou HTML
- Seed data + AI drafty pokrývají většinu obsahu

**Doporučení:** Přidat jako P3 do backlogu. Zatím stačí:
1. V editoru přidat tlačítko "Náhled" které zobrazí HTML s prose styly
2. V AI generátoru zajistit, že output je validní HTML

---

## Souhrn změn

| Krok | Soubor | Akce | Složitost | Priorita |
|------|--------|------|-----------|----------|
| 1 | `package.json` | `npm install @tailwindcss/typography` | TRIVIÁLNÍ | KRITICKÝ |
| 1 | `app/globals.css` | Přidat `@plugin "@tailwindcss/typography"` | TRIVIÁLNÍ | KRITICKÝ |
| 2 | produkce | `npx tsx prisma/seed-blog.ts` | TRIVIÁLNÍ | VYSOKÁ |
| 3 | `app/(web)/blog/page.tsx` | Gradient placeholder pro karty bez obrázku | MALÁ | STŘEDNÍ |
| 3 | `app/(web)/blog/[slug]/page.tsx` | Gradient placeholder pro related articles | MALÁ | STŘEDNÍ |
| 4a | `app/(web)/blog/page.tsx` | Hero gradient header | MALÁ | NÍZKÁ |
| 4b | `app/(web)/blog/page.tsx` | Hover efekty na kartách | MALÁ | NÍZKÁ |

**Celkem: 1 npm install, 3 edity souborů, 1 produkční příkaz.**

---

## Co už EXISTUJE a funguje (jen chybí typography plugin)

Blog kód je ve skutečnosti **kvalitní a feature-rich**:

| Feature | Stav | Soubor |
|---------|------|--------|
| Reading progress bar | ✅ Existuje | `blog/[slug]/ReadingProgress.tsx` |
| Share buttons (FB, X, LinkedIn, WhatsApp, copy) | ✅ Existuje | `blog/[slug]/ShareButtons.tsx` |
| Article reactions | ✅ Existuje | `components/web/blog/ArticleReactions.tsx` |
| Comments (moderated) | ✅ Existuje | `components/web/blog/ArticleComments.tsx` |
| Newsletter signup | ✅ Existuje | `components/web/blog/NewsletterSignup.tsx` |
| Author card | ✅ Existuje | In page.tsx |
| Related articles | ✅ Existuje | In page.tsx (tag-based + category) |
| Dark hero header | ✅ Existuje | In page.tsx |
| Cover image with overlap | ✅ Existuje | In page.tsx |
| Categories sidebar | ✅ Existuje | In listing page |
| Tags | ✅ Existuje | In listing page |
| Pagination | ✅ Existuje | In listing page |
| JSON-LD structured data | ✅ Existuje | Both pages |
| SEO metadata | ✅ Existuje | Both pages |
| Prose styling classes | ✅ Existuje | `prose prose-lg` + custom modifiers |
| **Typography plugin** | ❌ CHYBÍ | `package.json` + `globals.css` |

**Závěr:** Blog design NENÍ špatný. Hlavní problém je 1 chybějící npm balíček. Po instalaci `@tailwindcss/typography` + deployi seed dat bude blog vypadat profesionálně.

---

## Seed data — kvalita (pro referenci)

10 článků v `prisma/seed-blog.ts`:

| Článek | Kategorie | Slova | Cover |
|--------|-----------|-------|-------|
| Jak správně vybrat ojetinu v roce 2026 | Rady a tipy | ~400 | Unsplash |
| Škoda Superb 4 — první dojmy a recenze | Recenze | ~350 | Unsplash |
| Trh s ojetinami v ČR: trendy 2026 | Tržní analýzy | ~350 | Unsplash |
| Dovoz auta z Dubaje: průvodce 2026 | Dovozy z Dubaje | ~400 | Unsplash |
| Příprava na STK 2026 | Rady a tipy | ~300 | Unsplash |
| Elektromobily jako ojetiny | Tržní analýzy | ~350 | Unsplash |
| Dovoz ojetiny z USA | Dovozy z USA | ~400 | Unsplash |
| Pojištění ojetého auta | Rady a tipy | ~350 | Unsplash |
| CarMakléř spouští AI asistenta | CM novinky | ~250 | Unsplash |
| Financování ojetého auta | Rady a tipy | ~350 | Unsplash |

Všechny mají: HTML formátování, excerpt, readTime, SEO fields, tags, views. Jsou v češtině, relevantní pro cílovou skupinu.
