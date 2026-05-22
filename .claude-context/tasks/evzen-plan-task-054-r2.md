# Evžen report — TASK-054 plán R2 (Hashtags + SEO landing pages)

**Datum:** 2026-04-16
**Kontrolor:** Evžen the King
**Artefakty:**
- Plán: `.claude-context/tasks/plan-task-054-hashtags-seo.md` (R2, 825 ř.)
- Doslovné zadání: 3 zprávy usera (brainstorm + schválený rozsah + UX mandate)
- 8-sekcí checklist od leada

---

## VERDIKT: ❌ ZAMÍTNUTO s konkrétními opravami → R3

**Hlavní důvody (priorizováno):**
1. **Rule 1 porušení** v UI copy wireframe — zkratky "Prům." a "ROI" v hero stats baru (§6.1 ř. 268, 282).
2. **Rule 3 riziko** — `/admin/tagy` není explicitně přidán do admin navigace (§4.3.17 jen "role check + table").
3. **Spec incomplete** — §7.2 TagInput odkazuje na **"R1 plán"**, který implementator nemá (má jen R2). Bez toho je specifikace TagInputu roztržená.
4. **AC vs §6 gap** — bod 19 v §11.3 vyžaduje **4 JSON-LD schemas** (ItemList + Person + FAQPage + BreadcrumbList), ale §6 explicitně specifikuje pouze FAQPage + BreadcrumbList. ItemList a Person nejsou v žádné sekci.
5. **Borderline Rule 1** — tag label "Elektromobily EV" (§9) → v UI se zobrazuje "#Elektromobily EV" → "EV" je anglická zkratka. User k verdict.

**Co je v plánu dobře (pozitiva):**
- 8 sekcí landing page kompletně spec­ováno s wireframes + design tokens + copy templates (§6.1-§6.8) — odpovídá user mandatu "hezky UX, ne bazoš list" ✅
- 27 acceptance criteria v §11 (funkční + UX + SEO/A11y + regression) ✅
- 4 dílčí commity bez reset/amend (§8, memory rule) ✅
- STOP thresholds pro 7 failure modů (§10) ✅
- 8 explicit otázek pro lead (§13, Rule 6 jednotlivé schvalování) ✅
- End-to-end user flow: edit → API → DB → profile render → landing (§3-§6) ✅
- noindex pro tagy < 2 brokeři (§11.1 bod 6) — správné SEO chování ✅
- H1 "Makléři v Praze" namísto "#Praha" (§6.1 + §11.1 bod 4) — user-facing human copy ✅

---

## §1 — Bod-po-bodu kontrola proti user zadání

### §1.1 Zpráva #2 "udělej ty SEO landing, přidej to do profilu že to může vyplňovat atd, udělej tomu strukturu, naplánuj to, otestuj a přidej tak aby to šlo přidávat"

| Fragment | Kde v plánu | Stav |
|---|---|---|
| "SEO landing" | §4.4 Fáze D + §6 (8 sekcí) + §11.3 (JSON-LD, Lighthouse ≥90) | ✅ |
| "přidej to do profilu že to může vyplňovat" | §4.3.15 `app/(web)/muj-ucet/profil/page.tsx` Card "Hashtagy" + §7.2 TagInput | ✅ *(viz §1.3 k incomplete spec)* |
| "udělej tomu strukturu" | §2 Prisma schema, §9 seed 12 tagů ve 4 kategoriích, §6.7 lib/tag-content category-driven copy | ✅ |
| "naplánuj to" | §4 (4 fáze) + §8 (4 commity) + §10 (STOP) + §12 (effort) | ✅ |
| "otestuj" | §11 (27 AC) | ✅ |
| "tak aby to šlo přidávat" | end-to-end: §4.3.14 TagInput (autocomplete + create-new), §4.2.10 PUT API, §2 DB, §4.3.16 profile render, §4.4.23 landing | ✅ |

### §1.2 Zpráva #3 "ten UX landingu musí bejt taky nějakým způsobem dobrý… ne jen tak něco musí to bejt hezky"

**8-sekcí checklist od leada:**

| # | Sekce | Spec v §6 | Hodnocení |
|---|---|---|---|
| 1 | HERO (orange gradient, human H1, stats bar, featured avatars) | §6.1 (ř. 255-312) | ✅ **ALE: Rule 1 zkratky v stats baru — viz §2.1** |
| 2 | BROKER GRID (3-col, featured larger+ring, sort toggle) | §6.2 (ř. 314-351) | ✅ |
| 3 | RELATED HASHTAGS (co-occurrence pill list) | §6.3 (ř. 353-375) | ✅ |
| 4 | SOCIAL PROOF (3 testimonials, hide pokud 0) | §6.4 (ř. 377-424) | ✅ (user-approved hide behavior) |
| 5 | CTA blok (orange gradient, category-driven copy, hide pro BROKER) | §6.5 (ř. 426-453) | ✅ |
| 6 | FAQ (4 otázek per category, accordion, JSON-LD) | §6.6 (ř. 455-522) | ✅ |
| 7 | BREADCRUMBS (JSON-LD BreadcrumbList) | §6.7 (ř. 524-532) | ✅ |
| 8 | FOOTER LANDING (sister tagy v kategorii) | §6.8 (ř. 534-571) | ✅ |

Premium UX ano — wireframes + design tokens + category-driven copy + 4 JSON-LD schemas → splňuje "hezky, ne bazoš list".

### §1.3 Incomplete spec — TagInput

**§7.2 ř. 604:**
> ### §7.2 TagInput (client)
> Viz R1 plán §4.3.14 + doplnit:
> - A11y: `role="combobox"`, `aria-expanded`, `aria-activedescendant`
> - Keyboard: ArrowDown/Up/Enter/Escape
> - Debounce: 200ms
> - Max 10 — při pokusu o 11 zobrazit toast "Maximum 10 hashtagů"

**Problém:** Plán R2 odkazuje na "R1 plán §4.3.14" — ale:
- Implementator dostane pouze R2 jako aktivní plán
- R1 není v `.claude-context/tasks/` (ověřeno — jen R2 exist)
- Core spec TagInput (JSX struktura, state management, API volání) **chybí** v R2

**Musí být opraveno:** R3 musí obsahovat kompletní `TagInput` spec v §7.2 — ne jen "doplnit k R1". Zkopírovat core z R1 nebo přepsat full spec.

---

## §2 — 6 doslovných pravidel Evžena

### Rule 1: Žádné zkratky v UI ❌ PORUŠENO (3 nálezy)

#### §2.1 Hero stats bar — "Prům." zkratka

**§6.1 ř. 268 (wireframe):**
```
Stats bar: 12 makléřů · 142 dealů · Prům. ROI 8.5%
```

**§6.1 ř. 282 (implementace):**
```
{brokerCount} aktivních makléřů · {totalDeals} úspěšných dealů · Prům. úroveň {avgLevel}
```

**Porušení:**
- **"Prům."** = zkratka pro "Průměrný" / "Průměr". Rule 1 říká: "Vždy celý název".
- **"ROI"** = anglická zkratka (Return On Investment). Český hero na landing page musí být v češtině bez anglických zkratek.

**Navržená oprava:**
- `"Prům. úroveň"` → `"Průměrná úroveň"` nebo `"Průměrná úroveň makléřů"`
- `"Prům. ROI 8.5%"` → vypustit (plán už říká "ROI vypustit pokud není INVESTOR category" ř. 282 — ale stats bar wireframe ho stále ukazuje). **Sjednotit ř. 268 a ř. 282.**

#### §2.2 Tag label "Elektromobily EV" — borderline

**§9 ř. 698:**
```
{ slug: "elektromobily-ev", label: "Elektromobily EV", category: "SPECIALIZATION" },
```

**V UI se zobrazí:**
- TagPill: `#Elektromobily EV`
- H1: `Makléři — Elektromobily EV`
- Breadcrumb: `Domů › Makléři › #Elektromobily EV`

**"EV"** = Electric Vehicle (anglická zkratka). Čeština pro EV = "elektromobil" (už v labelu). Doslovné překlad "Elektromobily EV" = "Elektrická vozidla Electric Vehicle" — nadbytečné.

**Navržená oprava:** `label: "Elektromobily"` (slug zůstává `elektromobily-ev` pro URL).

**Poznámka:** "EV" je industry standard term a řada uživatelů ho bude hledat v SEO. Lze argumentovat, že je to brand-style. Pokud user explicitně chce "Elektromobily EV", tento bod můžu akceptovat. **Doporučuji escalate userovi k rozhodnutí.**

#### §2.3 Level badge — "TOP/SENIOR/BROKER/JUNIOR"

**§6.2 ř. 344:**
```
Level badge (TOP/SENIOR/BROKER/JUNIOR)
```

**Analýza:** Toto jsou interní level tiery (level names, ne abbreviations). "BROKER" jako level je plný název. "TOP" je také full term. Pass.

**Ale:** "SENIOR" a "JUNIOR" jsou v angličtině — pokud jsou zobrazovány v CZ UI, mohlo by to být konzistencí problem (ne Rule 1 přímo). Neblokuji, **jen flagnutí**.

### Rule 2: Nic se neschovává, nedokončené funkce se OZNAČUJÍ ✅ OK

- §6.4 social proof hide pokud 0 testimonials — **lead potvrdil jako akceptované user-approved chování**, ne "skrytá feature". ✓
- §6.5 CTA hidden pro logged-in BROKER — UX optimalizace pro konverzi nových makléřů, ne skrytí funkce. ✓
- Plán nevolá po žádné "demo/beta" feature — všechny funkce jsou kompletní MVP. ✓

### Rule 3: Skryté stránky = ŠPATNĚ ⚠️ RIZIKO (musí být opraveno)

**§4.3.17:**
```
17. `app/(admin)/admin/tagy/page.tsx` — role check + table
```

**§11.1 bod 8:**
```
8. Admin `/admin/tagy` — tabulka s counts, non-admin redirect
```

**Co chybí:** Explicit **přidání `/admin/tagy` do admin navigace/sidebaru**. Pokud jen vytvoříme route bez nav entry → Rule 3 violation (URL-only stránka, admin ji nenajde v navigaci).

**Musí být opraveno:** §4.3 přidat bod **"17b. Přidat 'Tagy' do admin sidebar/nav"** s odkazem na existující nav komponenta (pravděpodobně `components/admin/AdminNav.tsx` nebo `app/(admin)/layout.tsx`). AC bod 8 přidat: **"Link 'Tagy' viditelný v admin navigaci"**.

### Rule 4: Nic se nemaže bez schválení ✅ OK

§11.4 body 23-26 potvrzují žádné regrese:
- Instagram profil layout (R4) beze změny
- `/makler/[slug]` broker profil beze změny
- `/makleri` listing beze změny
- `/muj-ucet/profil` — ostatní pole pracují

§14 "Co NENÍ v plánu" — konsolidace `/makler/[slug]` + `/profil/[slug]` explicit out-of-scope. Žádné delete route v §3. ✓

### Rule 5: Hidden stránky — same as Rule 3 (viz §2.3 zde).

### Rule 6: Každá změna schvalována jednotlivě ✅ OK

§13 obsahuje 8 explicit otázek. Lead potvrdil "schváleny jednotlivě". ✓

---

## §3 — Completeness gaps

### §3.1 JSON-LD ItemList + Person chybí v §6 sekcích

**§11.3 bod 19:**
```
19. JSON-LD ItemList + Person (každý broker) + FAQPage + BreadcrumbList — 4 schemas
```

**§6 sekce explicitně specifikují JSON-LD pouze:**
- §6.6 ř. 505-520: **FAQPage schema** ✓
- §6.7 ř. 530: "`generateMetadata` přidá **BreadcrumbList JSON-LD**" ✓

**Chybí v §6:**
- **ItemList** (seznam brokerů v tagu — měla by být v §6.2 BROKER GRID)
- **Person schema** per broker (součást ItemList položek nebo separate — měla by být v §6.2)

**Musí být opraveno:** §6.2 (BROKER GRID) rozšířit o JSON-LD ItemList template s Person items, např.:
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: brokers.map((b, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    item: {
      "@type": "Person",
      name: `${b.firstName} ${b.lastName}`,
      url: `https://carmakler.cz/profil/${b.slug}`,
      jobTitle: "Certifikovaný makléř",
      areaServed: b.city,
    }
  }))
}) }} />
```

### §3.2 §7.2 TagInput spec neúplný

Viz §1.3 výše — musí být zkopírován core z R1 nebo přepsán.

---

## §4 — Rekonciliace s user briefem (detail)

**User zpráva #2 doslova:** *"Potřebuju teď vyzkoušet aby to celé fungovalo, takže udělej ty SEO landing, přidej to do profilu že to může vyplňovat atd, udělej tomu strukturu, naplánuj to, otestuj a přidej tak aby to šlo přidávat."*

**Decomposition:**
1. "aby to celé fungovalo" → end-to-end MVP → ✅ §4 Fáze A-D
2. "udělej ty SEO landing" → plural = všechny tagy → ✅ §6 + §4.3.18 sitemap generator >= 2 brokeři
3. "přidej to do profilu že to může vyplňovat" → ✅ §4.3.15 Card "Hashtagy"
4. "udělej tomu strukturu" → ✅ §2 + §9 category system
5. "naplánuj to" → ✅ §4 + §8
6. "otestuj" → ✅ §11 27 AC
7. "přidej tak aby to šlo přidávat" → ✅ §7.2 TagInput autocomplete + create-new

**User zpráva #3 doslova:** *"ten UX landingu musí bejt taky nějakým způsobem dobrý jo, ne jen tak něco musí to bejt hezky"*

**Decomposition:**
- "UX landingu" → §6 landing page, 8 sekcí ✅
- "dobrý, hezky" → wireframes + design tokens + orange gradient + featured + category-driven copy ✅
- "ne jen tak něco" → exclusion bazoš-style list; §6.2 featured broker ring + avatar + stats ✅
- **Ale:** Rule 1 violation v hero stats (§2.1) degraduje "hezky" — **"Prům. ROI"** vypadá jako dashboard fragment, ne SEO hero. Musí být opraveno.

---

## §5 — Co musí být opraveno před SCHVÁLENÍM (R3)

### Povinné (Rule violations)
1. **§6.1 ř. 268 + ř. 282** — odstranit zkratky "Prům." a "ROI" z hero stats bar. Sjednotit wireframe a implementation spec.
2. **§4.3 Fáze C + §11.1 AC** — přidat explicit bod **"Přidat 'Tagy' do admin navigace"** s referencí na AdminNav komponentu. AC bod 8 rozšířit o viditelnost v nav.

### Povinné (completeness)
3. **§7.2 TagInput** — přepsat full spec v R2 (nezávislé na R1 plán).
4. **§6.2 BROKER GRID** — doplnit JSON-LD ItemList + Person template (AC bod 19 vyžaduje 4 schemas, zatím specifikovány jen 2).

### Eskalace userovi (borderline)
5. **§9 ř. 698** — tag label `"Elektromobily EV"` — user explicitně potvrdí: zachovat industry term "EV" NEBO zkrátit na `"Elektromobily"`. (Strict Rule 1 = zkrátit; pragmaticky = zachovat kvůli SEO queries typu "EV prodej".)
6. **§6.2 ř. 344** — level badge `"TOP/SENIOR/BROKER/JUNIOR"` v angličtině — konzistence s CZ UI? (Nerelevantní pro Rule 1, ale worth flagging pro design systému.)

---

## §6 — Shrnutí pro lead

**Plán je z 90 % připravený** — všechny požadované sekce, komponenty, AC, commit strategie, STOP thresholds, category-driven copy, end-to-end flow.

**Blokátory před dispatch implementatorovi:**
1. Rule 1 zkratky v hero stats (2× "Prům.", 1× "ROI")
2. Rule 3 riziko — admin nav entry pro `/admin/tagy`
3. TagInput spec rozbitý odkazem na neexistující R1
4. JSON-LD ItemList + Person chybí v §6

**Doporučení:** Vrátit planovači s konkrétními body §5 výše → R3 → re-review.

**Borderline (userovi):**
- Tag label "Elektromobily EV" — jeho volba (industry SEO term vs strict Rule 1).
- Level badge terminologie.

Implementator by s tímto plánem ve formě R2 buď implementoval zkratky v UI (porušil Rule 1), nebo by musel na půlce cesty eskalovat. Lepší opravit v plánu teď než in-flight v implementaci.
