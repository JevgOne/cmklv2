---
task_id: 102
type: PLAN (additive UI)
agent: planovac
status: ready_for_review
created: 2026-04-07
estimate: S (small) — ~30-45 min implementace
priority: P2
related_tasks:
  - "#101 PLAN — Marketplace odebrat z public menu (DONE)"
  - "#90 LEGAL — komisionářský model regulační analýza (DONE — čeká advokát brief)"
  - "#102b TBD — pokud advokát řekne AML povinné, vznikne separate task"
---

# #102 PLAN — Marketplace landing: přidat sekce Pravidla / Rizika / Komise / FAQ rozšíření

## §0 — Executive summary

**Scope:** Approval **Option (a) MVP** od user 2026-04-07 — text-only additive sekce v existing `app/(web)/marketplace/page.tsx`. Žádný backend, žádné API, žádné DB migrace, žádné nové komponenty, žádné nové soubory. Pure business copy v souladu s user pokyny.

**Účel:** „Ten kdo to najde nahodou super, ale musí videt podmínky/výhody/řád" — návštěvník (anonymní nebo non-VIP login) na marketplace landing musí vidět **pravidla vstupu, rizika, dělení zisku** a **rozšířenou FAQ** dříve než klikne „Chci investovat".

**Velikost změny:** 1 soubor (`app/(web)/marketplace/page.tsx`), ~120-150 řádků additive copy + JSX. Zero refactoring existujících sekcí.

**Critical constraint:** **NULA regulačního jazyka.** Carmakler/marketplace klasifikace pod AML zákonem č. 253/2008 Sb. zůstává nejasná do doby než advokát doručí #90 LEGAL brief. Do té doby UI **musí** zůstat neutrální — pure business spolupráce model (komisionářský), žádný „investiční produkt".

---

## §1 — Forbidden words checklist (HARD RULE)

Implementator NESMÍ použít v UI textech tato slova/fráze:

| Zakázaný term | Důvod |
|---|---|
| `KYC` | regulační, čeká na #90 LEGAL |
| `Know Your Customer` | regulační |
| `AML` | regulační |
| `Anti-Money Laundering` | regulační |
| `doklad totožnosti` | KYC kontext |
| `ověření identity` | KYC kontext |
| `původ prostředků` | AML kontext |
| `zdroj příjmů` | AML kontext |
| `účel investice` | finanční regulace |
| `investiční produkt` | finanční regulace |
| `investiční služba` | ČNB licence kontext |
| `investiční doporučení` | finanční poradenství |
| `ČNB licence` | regulační |
| `qualified investor` / `kvalifikovaný investor` | ZISIF §2 |
| `investor accreditation` | US-only term |
| `MiFID` | EU finanční regulace |
| `prospekt` | nabídka cenných papírů |
| `cenný papír` | regulační |
| `účastnické cenné papíry` | regulační |

**Povolené je výjimečně** v jednom místě (FAQ Q „Je to investiční fond regulovaný ČNB?" → A: „Ne, není."). Explicitně se říká NE — žádný regulační claim. To je OK.

**Implementator při review tohoto plánu si MUSÍ projet textový obsah grep-em na výše uvedené termy a ujistit se že jsou nulové.**

---

## §2 — Position v existing layout

**Aktuální pořadí sekcí v `app/(web)/marketplace/page.tsx`:**

| # | Sekce | Řádky | Akce |
|---|---|---|---|
| 1 | Hero (gradient + CTA) | 159-226 | NETKNOUT |
| 2 | Jak to funguje (4 steps) | 229-253 | NETKNOUT |
| 3 | Příklady ROI (3 cards) | 256-308 | NETKNOUT |
| 4 | Bezpečnostní záruky (4 cards `guarantees`) | 311-332 | NETKNOUT |
| **NEW A** | **Pravidla a podmínky vstupu** | INSERT after 332 | **PŘIDAT** |
| **NEW B** | **Rizika investice** | INSERT po A | **PŘIDAT** |
| **NEW C** | **Komise a poplatky** | INSERT po B | **PŘIDAT** |
| 5 | FAQ (`faqs` array) | 335-352 | **ROZŠÍŘIT** array o 6 nových položek (existing 7 → nový 13) |
| 6 | Apply CTA | 355-383 | NETKNOUT |

**Vizuální kontrast:** A (white bg) → B (orange/warning bg) → C (gray-50 bg) → FAQ (white bg) — alternující bg pomáhá scanning.

---

## §3 — Section A: „Pravidla a podmínky vstupu"

### §3.1 Data array (přidat nahoru, mezi `guarantees` a `faqs`)

```typescript
const entryRules = [
  {
    icon: "💰",
    title: "Minimální investice",
    desc: "10 000 Kč na jeden deal. Investovat lze do více dealů paralelně pro diverzifikaci.",
  },
  {
    icon: "⏱",
    title: "Délka jednoho dealu",
    desc: "Typicky 30-90 dní od financování po prodej. Kapitál je vázán po dobu konkrétního dealu.",
  },
  {
    icon: "🤝",
    title: "Vstup po schválení Carmakler týmem",
    desc: "Po vyplnění žádosti vás kontaktujeme do 48 hodin a probereme spolupráci. Carmakler si vyhrazuje právo odmítnout přihlášku bez udání důvodu.",
  },
  {
    icon: "🏢",
    title: "Auto se kupuje na firmu Carmakler",
    desc: "Každé auto je v majetku Carmakler s.r.o. po celou dobu dealu. Investor se nestává spoluvlastníkem auta — má smluvní podíl na zisku z konkrétního dealu.",
  },
  {
    icon: "📊",
    title: "Transparentní dělení zisku 40 / 40 / 20",
    desc: "Investor 40 %, realizátor 40 %, Carmakler 20 % z čistého zisku po odečtení nákupní ceny, oprav a provozních nákladů. Žádné skryté poplatky.",
  },
  {
    icon: "📝",
    title: "Smlouva ke každému dealu",
    desc: "Před prvním dealem podepisujete rámcovou smlouvu s Carmaklerem. Ke každému jednotlivému dealu pak detailní dodatek (kalkulace, harmonogram, vyúčtování).",
  },
  {
    icon: "⚠️",
    title: "Žádná garance výnosu",
    desc: "Carmakler negarantuje žádný konkrétní výnos. Příklady na této stránce vychází z reálných minulých dealů, ale minulé výsledky nezaručují budoucí.",
  },
];
```

### §3.2 JSX section (insert po `guarantees` sekci, line ~333)

```tsx
{/* Pravidla a podminky vstupu */}
<section className="py-16 md:py-20 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
        Pravidla a podmínky vstupu
      </h2>
      <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
        Než se přihlásíte, přečtěte si jak to celé funguje. Žádné překvapení.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {entryRules.map((rule) => (
        <Card key={rule.title} className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl shrink-0">
              {rule.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{rule.title}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{rule.desc}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
</section>
```

---

## §4 — Section B: „Rizika investice"

### §4.1 Data array

```typescript
const investmentRisks = [
  "Riziko ztráty části nebo celé investice — auto se nemusí prodat za očekávanou cenu",
  "Likvidita — kapitál je vázán po celou dobu dealu (typicky 30-90 dní), předčasný exit není možný",
  "Tržní riziko — cena podobných aut na trhu může klesnout během oprav",
  "Operativní riziko — oprava může trvat déle nebo se objeví nečekané závady (vyšší náklady)",
  "Carmakler si vyhrazuje právo zrušit deal kdykoli (např. při odhalení skrytých vad auta)",
  "Žádný deal nemá garantovanou výnosnost — minulé výsledky nezaručují budoucí",
];
```

### §4.2 JSX section (insert po §3.2)

```tsx
{/* Rizika investice */}
<section className="py-16 md:py-20 bg-orange-50/30">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-10">
      <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
        Rizika investice
      </h2>
      <p className="text-gray-500 mt-2">
        Buďte si vědomi rizik. Investice do aut není bez rizika.
      </p>
    </div>

    <Alert variant="warning" className="mb-8">
      <span className="text-sm leading-relaxed">
        <strong className="block mb-2">Důležité upozornění</strong>
        Investice do aut nese riziko ztráty kapitálu. Carmakler není finanční poradce
        a neposkytuje doporučení. Před vstupem do dealu si pečlivě přečtěte všechny
        podmínky a v případě potřeby se poraďte se svým finančním poradcem.
        Minulé výsledky nezaručují budoucí výnos.
      </span>
    </Alert>

    <Card className="p-6">
      <h3 className="font-bold text-gray-900 mb-4">Konkrétní rizika</h3>
      <ul className="space-y-3 list-none p-0 m-0">
        {investmentRisks.map((risk, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
            <span className="text-orange-500 font-bold shrink-0 mt-0.5">•</span>
            <span>{risk}</span>
          </li>
        ))}
      </ul>
    </Card>
  </div>
</section>
```

**Poznámka:** Použít existing `Alert` komponentu (řádek 5 je už importovaná). `variant="warning"` (oranžový background, dle `components/ui/Alert.tsx:4` enum).

---

## §5 — Section C: „Komise a poplatky" (mini-table)

### §5.1 Data array

```typescript
const profitSplit = [
  { party: "Investor", share: "40 %", note: "Plus návrat původního kapitálu", color: "text-success-500" },
  { party: "Realizátor", share: "40 %", note: "Za nalezení, opravu a exekuci dealu", color: "text-orange-500" },
  { party: "Carmakler", share: "20 %", note: "Platforma, due diligence, smluvní zajištění", color: "text-gray-700" },
];
```

### §5.2 JSX section (insert po §4.2)

```tsx
{/* Komise a poplatky */}
<section className="py-16 md:py-20 bg-gray-50">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-10">
      <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
        Dělení zisku
      </h2>
      <p className="text-gray-500 mt-2">
        Transparentní a fixní pro každý deal. Žádné skryté poplatky.
      </p>
    </div>

    <Card className="p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profitSplit.map((row) => (
          <div key={row.party} className="text-center">
            <div className={`text-4xl md:text-5xl font-extrabold ${row.color}`}>{row.share}</div>
            <div className="text-base font-bold text-gray-900 mt-2">{row.party}</div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{row.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-500 leading-relaxed text-center max-w-2xl mx-auto">
          Procenta jsou počítána z <strong className="text-gray-700">čistého zisku</strong>{" "}
          (prodejní cena – nákupní cena – náklady na opravu – provozní náklady). Pokud deal
          skončí ve ztrátě, investor obdrží zpět zbývající kapitál po odečtení podílu na ztrátě.
        </p>
      </div>
    </Card>
  </div>
</section>
```

---

## §6 — FAQ rozšíření (existing `faqs` array)

### §6.1 Edit `faqs` array (řádky 71-100 — append 6 nových položek)

```typescript
const faqs = [
  // ... 7 existing entries unchanged ...
  // Nové entries (#102):
  {
    q: "Co když chci vystoupit z dealu dříve?",
    a: "Předčasný exit z konkrétního dealu není možný. Kapitál vyplatíme po jeho dokončení (typicky 30-90 dní). Pokud chcete kdykoliv ukončit spolupráci, jednoduše se nepřidávejte do nových dealů — vyplatíme vás po doběhnutí toho posledního, ve kterém jste účastni.",
  },
  {
    q: "Mohu investovat do více dealů paralelně?",
    a: "Ano, diverzifikace je doporučená. Můžete být souběžně účastni v několika dealech různých realizátorů.",
  },
  {
    q: "Kdo se může přihlásit?",
    a: "Fyzické osoby starší 18 let a právnické osoby z EU. Po vyplnění apply formuláře vás kontaktuje Carmakler tým a probere s vámi spolupráci.",
  },
  {
    q: "Je to investiční fond regulovaný ČNB?",
    a: "Ne. Carmakler není investiční fond, správce aktiv ani investiční zprostředkovatel. Jedná se o spolupráci na konkrétních obchodních případech (komisionářský model — Carmakler kupuje a prodává auto, vy poskytujete kapitál proti smluvnímu podílu na zisku z konkrétního dealu).",
  },
  {
    q: "Jak se mi vrátí peníze?",
    a: "Po prodeji auta a uzavření dealu Carmakler vyplácí původní kapitál + 40 % z čistého zisku bankovním převodem na váš účet uvedený ve smlouvě. Vyúčtování dostanete písemně.",
  },
  {
    q: "Co když Carmakler skončí?",
    a: "Auta jsou v majetku Carmakler s.r.o. — v případě insolvence by se staly součástí konkursní podstaty a investoři by byli běžnými věřiteli. Riziko platformy je standardní podnikatelské riziko, které byste měli zvážit při rozhodování.",
  },
];
```

**Pozn.:** `faqJsonLd` (řádek 109-120) automaticky pokryje nové entries — je počítaný z `faqs.map()`. Žádný edit.

---

## §7 — Acceptance criteria

| # | Kritérium | Verifikace |
|---|---|---|
| AC1 | 4 nové sekce přidány v `app/(web)/marketplace/page.tsx` (3 nové JSX sekce + FAQ rozšíření) | Visual review + grep `entryRules`, `investmentRisks`, `profitSplit` |
| AC2 | Pořadí: Hero → Jak funguje → ROI příklady → Bezpečnostní záruky → **Pravidla** → **Rizika** → **Komise** → FAQ → Apply CTA | Visual scroll |
| AC3 | Žádný refactor existujících sekcí (`howItWorks`, `roiExamples`, `guarantees`, `faqs` 7 původních entries) | `git diff` shows only additions, no deletions in těchto blocích |
| AC4 | Žádné nové soubory, žádné nové komponenty, žádné nové importy | Single file edit `app/(web)/marketplace/page.tsx` |
| AC5 | Mobile responsive (grid cols-1 → sm:cols-2 → lg:cols-3 patterns shodné s existing) | DevTools mobile preview |
| AC6 | **NULA forbidden words** (viz §1) | `grep -iE "(KYC\|AML\|doklad totoznosti\|původ prostredku\|investicni sluzba\|MiFID\|prospekt\|cenny papir\|qualified investor\|kvalifikovany investor\|cnb licenc)" app/(web)/marketplace/page.tsx` → 0 matches |
| AC7 | Žádný backend, žádné DB migrace, žádné API endpoints | `git diff` shows only `app/(web)/marketplace/page.tsx` |
| AC8 | Build pass | `npm run build` → 0 errors |
| AC9 | Lint pass | `npm run lint` → 0 new errors (537 pre-existing warnings OK) |
| AC10 | FAQ JSON-LD obsahuje všech 13 entries (7 existujících + 6 nových) | View source → search `"@type":"Question"` → 13 results |
| AC11 | Žádný PDF, žádný DocuSign, žádné electronic signature | grep `pdf\|docusign\|signature` → 0 matches |
| AC12 | Disclaimer Alert (warning variant) viditelný v sekci „Rizika" | Visual |

---

## §8 — Risk assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Forbidden words leak | LOW | §1 checklist, AC6 grep verification, code review by team-lead před merge |
| Layout shift na mobile | NONE | Použity stejné Tailwind grid patterns jako existing sections (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) |
| FAQ JSON-LD inconsistency | NONE | `faqJsonLd` je computed `faqs.map()` — automaticky pokryje nové entries |
| Existing copy conflict | NONE | Žádný edit existujících textů. Pouze append. |
| #90 LEGAL future override | MEDIUM | Pokud advokát řekne „AML povinné" → vznikne #102b separate task, který přidá KYC flow. Aktuální Option (a) je MVP — dočasné. Plánovač/team-lead počítá s revisí. |
| Délka FAQ sekce (13 entries) | LOW | UX přijatelný, alternativa accordion není v scope (žádný refactor). Pokud později problém → follow-up. |
| Apply CTA visibility shift | LOW | Apply CTA stále poslední — uživatel přečte risks/rules **před** kliknutím. Žádný impact na konverzi (spíš pozitivní). |

**Overall risk:** **VERY LOW** — additive only, single file, žádné breaking changes, žádné backend.

**Rollback:** `git revert <commit>` — single file restore.

---

## §9 — Implementation checklist (pro implementatora)

- [ ] **STEP 1** — Otevřít `app/(web)/marketplace/page.tsx`, ověřit aktuální strukturu (řádky 1-387)
- [ ] **STEP 2** — Po `guarantees` array (řádek 107) přidat 3 nové data arrays:
  - `entryRules` (viz §3.1)
  - `investmentRisks` (viz §4.1)
  - `profitSplit` (viz §5.1)
- [ ] **STEP 3** — Append 6 nových entries do `faqs` array (řádek 71-100) — viz §6.1
- [ ] **STEP 4** — Po section „Bezpečnostní záruky" (uzavírací `</section>` na řádku 332) vložit 3 nové JSX sekce v pořadí:
  - §3.2 Pravidla
  - §4.2 Rizika (s `<Alert variant="warning">`)
  - §5.2 Komise
- [ ] **STEP 5** — `npm run build` → 0 errors
- [ ] **STEP 6** — `npm run lint` → 0 nových errors
- [ ] **STEP 7** — Manual: `npm run dev`, otevřít `localhost:3000/marketplace`:
  - Skrolovat celou stránku → vidět všechny 4 nové sekce v správném pořadí
  - Mobile preview (DevTools 375px) → grid responzivně se přepíná na 1 sloupec
  - View source → `<script type="application/ld+json">` obsahuje 13 questions
- [ ] **STEP 8** — Forbidden words check (KRITICKÉ):
  ```bash
  grep -iE "(KYC|AML|doklad totoznosti|původ prostredku|investicni sluzba|MiFID|prospekt|cenny papir|qualified investor|kvalifikovany investor|cnb licenc)" "app/(web)/marketplace/page.tsx"
  ```
  Expected: **0 matches**. Pokud cokoli vrátí → STOP, refactor copy.
- [ ] **STEP 9** — Commit s message:
  ```
  feat(#102): marketplace landing — Pravidla / Rizika / Komise / FAQ rozšíření

  Additive only — 3 nové JSX sekce mezi guarantees a FAQ:
  - Pravidla a podmínky vstupu (7 bullets)
  - Rizika investice (warning Alert + 6 bullets)
  - Dělení zisku (40/40/20 visual split)
  - FAQ rozšíření o 6 nových Q&A

  Zero backend, zero KYC/AML, čeká na #90 LEGAL brief.
  Pure business spolupráce model (komisionářský).

  User pokyn: „ten kdo to najde nahodou super, ale musí videt
  podmínky/výhody/řád"
  ```

**Total time estimate:** 30–45 min včetně manual testů.

---

## §10 — Estimate

| Krok | Estimate |
|---|---|
| Edit data arrays (§3.1, §4.1, §5.1) | 5 min |
| Append FAQ entries (§6.1) | 5 min |
| Insert 3 JSX sekce (§3.2, §4.2, §5.2) | 10 min |
| Build + lint check | 5 min |
| Manual browser test (mobile + JSON-LD) | 10 min |
| Forbidden words grep + commit | 5 min |
| **CELKEM** | **~40 min** |

**Velikost:** S (single file, additive only).

---

## §11 — Návaznosti

### §11.1 — Návaznost na #90 LEGAL

`#90 LEGAL` je v queue s outcome „čeká advokát brief". Až brief dorazí, advokát řekne:
- (a) **AML povinné** → vzniká **#102b PLAN** (KYC flow, doklad totožnosti, AML form, audit log) — separate scope, separate plan
- (b) **AML nepovinné, jen smlouva** → současný #102 stačí, žádná další akce
- (c) **Komisionářský model rebalanced** → může vzniknout #102c (úprava 40/40/20 split, smluvní text)

**Aktuální #102 je MVP** — pokrývá user pokyn „musí videt podmínky/výhody/řád" bez čekání na advokáta. Pokud se ukáže AML povinnost, **přidáváme** novou sekci, **neměníme** existing copy.

### §11.2 — Návaznost na #101

#101 (Marketplace odebrat z public menu) MUSÍ být dokončen **PŘED** #102 commit, jinak by se může stát že VIP user uvidí marketplace odkaz ale landing ještě nemá nové sekce. Sekvenování: #101 IMPL → #102 IMPL.

**Aktuální stav:** #101 PLAN done, #104 IMPL pending. **Doporučení:** #102 IMPL až po merge #104, NE batch v #104 (jiný scope, jiný soubor, jiné AC).

### §11.3 — Návaznost na sitemap.ts

Marketplace landing **zůstává** v `app/sitemap.ts` (Google index OK). Žádný edit sitemap pro #102.

### §11.4 — Návaznost na #82 PERF audit

Marketplace landing aktuálně **nemá `revalidate` marker** a má `searchParams` (viz line 122-126 komentář: „Landing má searchParams → nesmí mít revalidate"). #82 PERF Phase 1 mu žádný caching nepřinese. **Žádný impact na #102** — additive copy nemění caching strategii.

**Pozn.:** Pokud #82 v2 plán (#105) přinese možnost cachovat `searchParams`-handling stránky přes `Cache-Control` headers nebo route segment split, marketplace landing může profitovat. Mimo scope #102.

---

## §12 — Open questions pro team-leada

### Q1 — Délka dealu: 30-90 dní vs 3-12 měsíců? ⚠️ KONFLIKT

**Konflikt v zadání:**
- Existing copy (řádek 82, FAQ): „Typicky 30-90 dní od financování po prodej"
- Existing copy (řádek 24, howItWorks step 1): odpovídá kratšímu horizontu
- **Tvůj task spec (#102 description):** „Investiční horizont 3-12 měsíců per deal"

**3-12 měsíců** je 4-12× delší než existing kopie říká. Toto je:
- (a) Záměrná aktualizace (musíme upravit i existing copy aby seděla — out of scope #102, nový task)
- (b) Tvůj překlep — meant 30-90 dní (`days` confused with `months`)
- (c) Různý kontext: 30-90 dní = aktuální dokončený deal cycle, 3-12 měsíců = plánovaný target pro novější/složitější dealy

**Můj návrh v plánu:** Použít **30-90 dní** (consistent with existing copy). Pokud chceš 3-12 měsíců, vznikne follow-up task na update všech 30-90 dní textů + howItWorks step descriptions (3 místa min).

**Akce:** ⏸ Čekám na tvé rozhodnutí. **Default:** 30-90 dní.

### Q2 — Minimální investice: 10 000 Kč vs jiná částka?

Existing copy (řádek 31, 78) říká **10 000 Kč**. Tvůj spec říká „10 000 Kč (TBD — plánovač upřesní s ohledem na business)".

**Můj návrh:** Zachovat **10 000 Kč** — konzistentní s existing, žádný konflikt, dostatečně nízká bariéra pro retail investory.

**Akce:** ✅ Default 10 000 Kč. Pokud chceš jinou částku, dej mi vědět před implementací.

### Q3 — Disclaimer „Carmakler není finanční poradce"?

V §4.2 (Rizika) Alert obsahuje větu „Carmakler není finanční poradce a neposkytuje doporučení". Toto je **not regulační claim** — je to **neutral disclaimer** který chrání Carmakler před nárokováním finančního poradenství.

**Otázka:** Je to OK, nebo to také vynechat? Můj názor: **OK, je to defensive copy bez regulačních termů.**

**Akce:** ✅ Default INCLUDE. Pokud chceš ne, uprav před implementací.

### Q4 — Sekce „Co když Carmakler skončí?" (FAQ §6.1 nový entry)

Tento entry zmiňuje insolvenci, konkursní podstatu, věřitele. Je to **business risk disclosure**, ne regulace, ale je to dost „heavy" pro marketing landing.

**Můj návrh:** Zachovat — radikální transparentnost je v souladu s user pokynem „musí videt rizika". Pokud to považuješ za příliš pesimistické, můžu zjemnit (např. odkázat na FAQ rizik v sekci B).

**Akce:** ✅ Default INCLUDE. Pokud nechceš, dej vědět.

### Q5 — Pořadí 4 nových sekcí?

Aktuální plán: Pravidla → Rizika → Komise → FAQ rozšíření

Alternativa: Komise → Pravidla → Rizika → FAQ (komise je nejlákavější/nejdůležitější, mohlo by být nahoru)

**Můj návrh:** Aktuální pořadí (Pravidla → Rizika → Komise) — informuje od „jak to funguje" k „co to stojí", end-to-end flow uživatelského rozhodování. Komise jako poslední sekce před FAQ funguje jako „closing argument".

**Akce:** ✅ Default Pravidla → Rizika → Komise → FAQ. Pokud chceš jinak, dej vědět.

---

## §13 — Souhrn pro Evžen review

**Co plán řeší:**
- 4 nové additive sekce na marketplace landing dle user pokynu „musí videt podmínky/výhody/řád"
- Pure business copy v souladu s **Option (a) MVP** — žádný backend, žádné regulační language
- Forbidden words checklist (§1) — implementator MUSÍ verifikovat

**Co plán NEŘEŠÍ:**
- KYC/AML (čeká na #90 LEGAL advokát brief → případně #102b)
- Vzor smlouvy PDF, DocuSign, electronic signatures (out of scope)
- Backend audit log (out of scope)
- Refactor existujících sekcí (zero touching howItWorks/roiExamples/guarantees)

**Doporučení:** Schválit plán + odpovědět Q1 (délka dealu 30-90 vs 3-12) → implementator může okamžitě začít. Odhadovaný čas: ~40 min od dispatch po commit. Risk: very low.

**Sekvenování:** #102 IMPL až **PO** merge #104 (#100 + #101 batch). Žádný batch s #104 — different scope, different file, different reviewer focus.

---

**Plan ready.** Čekám na tvé schválení + Q1 odpověď před dispatchem implementatora.
