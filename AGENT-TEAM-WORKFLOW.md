# Carmakler - Agent Team Workflow

## Tým

| Agent | Role | Zodpovědnost | Spouštění |
|-------|------|-------------|-----------|
| **Product Owner** | Stratég | User stories, prioritizace, acceptance criteria, scope | `@product-owner` |
| **Developer** | Stavitel | Implementace kódu, architektura, API, DB, code review | `@developer` |
| **Designer** | Vizionář | UI/UX, komponenty, design systém, responzivita, a11y | `@designer` |
| **QA** | Strážce | Testy, bug reporty, performance, security audit | `@qa` |
| **Marketolog** | Růstař | SEO, copy, CRO, analytics, structured data | `@marketolog` |

---

## Workflow: Nová funkce (Feature Pipeline)

```
┌─────────────────────────────────────────────────────────────┐
│  1. DEFINICE                                                │
│  Product Owner → User Story + Acceptance Criteria           │
│  Marketolog    → SEO požadavky + Copy brief                 │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. NÁVRH                                                   │
│  Designer   → UI návrh (Tailwind komponenty, layout)        │
│  Developer  → Technický návrh (schema, API, architektura)   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. IMPLEMENTACE                                            │
│  Developer  → Kód (frontend + backend)                      │
│  Designer   → Finální CSS, animace, responsive tweaks       │
│  Marketolog → SEO metadata, structured data, copy texty     │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. KONTROLA                                                │
│  QA         → Testy (unit, E2E, performance, security)      │
│  Designer   → Visual review, a11y check                     │
│  PO         → Acceptance criteria ověření                   │
│  Marketolog → SEO audit, copy review                        │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  5. RELEASE                                                 │
│  Developer  → Merge + deploy                                │
│  Marketolog → Analytics tracking ověření                    │
│  QA         → Smoke test na staging/prod                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow: Bug Fix

```
QA/kdokoli → nahlásí bug
    ▼
Product Owner → priorita (P0-P3)
    ▼
Developer → fix + test
    ▼
QA → ověření opravy + regression test
```

---

## Workflow: Nová stránka

Při vytváření každé nové stránky se agenti spouštějí v tomto pořadí:

### Krok 1: Product Owner
```
Vstup:  Popis stránky (např. "Detail vozu")
Výstup: User stories, acceptance criteria, priorita
```

### Krok 2: Designer + Marketolog (paralelně)
```
Designer:
  Vstup:  User stories od PO
  Výstup: Layout, komponenty (Tailwind), responsive breakpoints

Marketolog:
  Vstup:  User stories od PO
  Výstup: SEO metadata, structured data, copy texty, CTA
```

### Krok 3: Developer
```
Vstup:  User stories + design + SEO/copy
Výstup: Implementovaná stránka (page.tsx, loading.tsx, error.tsx, API routes)
```

### Krok 4: QA + Designer review (paralelně)
```
QA:
  Vstup:  Implementovaná stránka + acceptance criteria
  Výstup: Test results, bug reporty

Designer:
  Vstup:  Implementovaná stránka
  Výstup: Visual bugs, a11y issues, responsive fixes
```

---

## Paralelní spouštění agentů

Kde je to možné, agenti běží paralelně pro maximální efektivitu:

| Fáze | Paralelně | Sekvenčně po |
|------|-----------|-------------|
| Definice | PO + Marketolog | - |
| Návrh | Designer + Developer | Definice |
| Implementace | Developer + Marketolog (copy) | Návrh |
| Review | QA + Designer | Implementace |

### Příklad paralelního volání
```
Uživatel: "Vytvoř stránku katalogu vozů"

→ @product-owner: "Rozpiš user stories pro katalog vozů /vozy"
→ @marketolog: "Připrav SEO a copy pro stránku katalogu vozů /vozy"
   (běží paralelně)

→ @designer: "Navrhni layout a komponenty pro katalog vozů"
→ @developer: "Navrhni API a datový model pro filtrování vozů"
   (běží paralelně)

→ @developer: "Implementuj stránku katalogu vozů"
   (sekvenčně - potřebuje výstupy od všech)

→ @qa: "Otestuj katalog vozů"
→ @designer: "Zkontroluj vizuál a responzivitu katalogu"
   (běží paralelně)
```

---

## Komunikace mezi agenty

### Předávání kontextu
Každý agent dostane do promptu:
1. **CLAUDE.md** - projektové instrukce (automaticky)
2. **Výstupy předchozích agentů** - vložené do promptu
3. **Relevantní soubory** - agent si je přečte sám

### Formát předávky
```
@developer Implementuj homepage podle:

PO výstup:
- US-001: Hero s vyhledáváním (P0, AC: ...)
- US-002: Kategorie vozů (P1, AC: ...)

Designer výstup:
- Layout: Hero full-width, kategorie Netflix-style scroll
- Komponenty: SearchBar, CategoryRow, VehicleCard

Marketolog výstup:
- Title: "Carmakler | Prodej aut přes ověřené makléře"
- H1: "Prodejte auto bez starostí"
- CTA: "Najít makléře" (primary), "Prohlédnout vozy" (secondary)
```

---

## Rozhodovací matice

| Otázka | Rozhoduje |
|--------|-----------|
| Co stavět? Jaká priorita? | **Product Owner** |
| Jak to vypadá? UX flow? | **Designer** |
| Jak to implementovat? Jaký stack? | **Developer** |
| Je to kvalitní? Funguje to? | **QA** |
| Jak to najdou uživatelé? Konvertuje to? | **Marketolog** |

### Konflikty
Při konfliktu mezi agenty:
- **UX vs Technické omezení** → Developer navrhne alternativu, Designer schválí
- **Scope vs Deadline** → Product Owner rozhodne (MVP first)
- **SEO vs Design** → Marketolog + Designer najdou kompromis
- **Quality vs Speed** → QA stanoví minimum, PO rozhodne

---

## Checklist pro každou stránku

### Product Owner
- [ ] User stories definovány
- [ ] Acceptance criteria napsána
- [ ] Priorita přiřazena
- [ ] Edge cases identifikovány

### Designer
- [ ] Mobile layout (320px+)
- [ ] Tablet layout (768px+)
- [ ] Desktop layout (1024px+)
- [ ] Hover/focus/active stavy
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Error state
- [ ] Accessibility (kontrast, aria, focus)

### Developer
- [ ] Server Components kde možné
- [ ] TypeScript strict (žádné any)
- [ ] Zod validace na API inputs
- [ ] loading.tsx
- [ ] error.tsx
- [ ] Prisma queries optimalizované (select/include)
- [ ] Edge cases ošetřeny

### QA
- [ ] Happy path test
- [ ] Edge cases testy
- [ ] Mobile responsivita
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] Performance (LCP < 2.5s)
- [ ] Accessibility (axe scan)
- [ ] Security (auth, injection)

### Marketolog
- [ ] Title tag (< 60 znaků)
- [ ] Meta description (< 155 znaků)
- [ ] H1 s klíčovým slovem
- [ ] Structured data (JSON-LD)
- [ ] Open Graph tags
- [ ] Internal links
- [ ] CTA jasné a viditelné
- [ ] Copy přesvědčivý a CZ

---

## Fáze projektu → Zapojení agentů

| Fáze | PO | Dev | Design | QA | Marketing |
|------|:--:|:---:|:------:|:--:|:---------:|
| 0: Příprava | - | ## | # | - | - |
| 1: MVP Web | ## | ## | ## | # | ## |
| 2: PWA Makléři | ## | ## | ## | # | # |
| 3: Admin Panel | # | ## | # | # | - |
| 4: BOOM Funkce | ## | ## | ## | ## | ## |
| 5: Launch | # | # | # | ## | ## |

`##` = hlavní zapojení, `#` = podpůrné, `-` = minimální

---

## Cyklus zpracování úkolu

```
1. LEAD (ty): vezme úkol / dostane požadavek od uživatele
   │
2. PRODUCT OWNER: rozpiš user stories + acceptance criteria
   │
3. DESIGNER + MARKETOLOG (paralelně): návrh UI + SEO/copy
   │
4. DEVELOPER: implementace podle výstupů všech agentů
   │
5. QA + DESIGNER (paralelně): review + testy
   │
   ├── Všechno OK? → Hotovo, další úkol
   │
   └── Něco chybí/nefunguje?
       │
       └── Zpět na krok 4 (DEVELOPER dostane bug reporty)
           Opakuj dokud není vše ✅
```

---

## Quick Commands

```bash
# Nová stránka - kompletní pipeline
"Vytvoř stránku [název] - spusť celý pipeline (PO → Design+Marketing → Dev → QA)"

# Jen definice
"@product-owner rozpiš user stories pro [funkce]"

# Jen design
"@designer navrhni komponenty pro [stránka/funkce]"

# Jen implementace
"@developer implementuj [stránka/funkce]"

# Jen testy
"@qa otestuj [stránka/funkce]"

# Jen SEO/copy
"@marketolog připrav SEO a copy pro [stránka]"

# Review existující stránky
"Spusť review na [stránka] - QA + Designer + Marketolog paralelně"

# Bug fix
"@qa nahlásil bug [popis] - @developer oprav"
```

---

## Pravidla týmu

1. **MVP first** - Vždy nejdřív minimální funkční verze, pak vylepšování
2. **Žádný agent nepřeskakuje** - Developer neimplementuje bez user stories od PO
3. **Paralelizuj kde můžeš** - Designer + Marketolog mohou běžet současně
4. **Kontext je klíč** - Každý agent dostane výstupy předchozích
5. **Iteruj** - Po QA review se vrať k Developerovi, ne k PO (pokud scope OK)
6. **Jeden zdroj pravdy** - Kód v repu je pravda, ne výstupy agentů
7. **Czech first** - Všechny UI texty, copy, SEO v češtině
8. **Kompletní zadání** - Zadání se NIKDY nezkracuje ani neparafrázuje

---

## Spuštění kompletního pipeline

```
Přečti AGENT-TEAM-WORKFLOW.md a CLAUDE.md.

Úkol: [popis úkolu]

Spusť kompletní pipeline:
1. @product-owner - definice
2. @designer + @marketolog (paralelně) - návrh
3. @developer - implementace
4. @qa + @designer (paralelně) - review
```

---

## Chování při problémech

- **Agent se zasekl**: Pošli zprávu, timeout 5 min, pak restart
- **Rate limit**: Zapiš do logu čas, počkej, automaticky pokračuj
- **Opakovaná chyba (3x stejný problém)**: Oznám uživateli, přejdi na další task
- **Kritická chyba (build padá)**: Stop, oznámit uživateli
- **Konflikt mezi agenty**: Rozhoduje matice výše
