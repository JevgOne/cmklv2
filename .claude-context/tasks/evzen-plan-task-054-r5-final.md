# Evžen report — TASK-054 plán R5 FINAL re-verify

**Datum:** 2026-04-16
**Kontrolor:** Evžen the King
**Task ID:** #22
**Artefakt:** `.claude-context/tasks/plan-task-054-hashtags-seo.md` (R5, 1347 ř.)
**Baseline:** Evžen R2 report + lead R5 checklist (9 items)

---

## VERDIKT: ⚠️ PODMÍNĚNĚ SCHVÁLENO

**Shrnutí:**
- **Všech 9 položek lead R5 checklistu je splněno kompletně a doslova.** ✅
- **Všech 4 R2 blokátorů je fixed.** ✅
- **Doslovná shoda s user zadáním (end-to-end, UX hezký, nothing hidden).** ✅
- **1 nová drobná Rule 1 zkratka objevená při re-verify** (vznikla v §6.8 při R4 rewrite) → viz §3 níže.

**Co doporučuji:**
- Buď krátký R6 s oprávou jediného řetězce (odhad: 2 min planner)
- Nebo explicit instrukce implementatorovi během Fáze D: `{count} m.` → `{count} makléřů` v §6.8 pill label + wireframe ř. 766-767

**Schválit to v R5 dnes nebo vrátit na R6?** — rozhodnutí na tobě, lead. Fix je trivia. Strict Rule 1 říká ZAMÍTNOUT; pragmaticky plán je 99.9 % hotov.

---

## §1 — R2 blokátory verifikace (1-4)

### R2 Blokátor #1: "Prům." + "ROI" zkratky v hero stats ✅ FIXED

**R2 nález:** §6.1 ř. 268 (wireframe) + ř. 282 (impl spec) měly zkratky "Prům." a "ROI".

**R5 stav:**
- **§6.2 ř. 386-391 (impl spec):** 4 stats chips finální kopírují:
  - `{count} makléřů`
  - `{totalSoldVehicles} úspěšných prodejů`
  - `{topLevelCount} TOP makléřů`
  - `{activeVehicles} aktivních vozidel`
- **§6.2 ř. 366-367 (wireframe):** `[12 makléřů] · [142 úspěšných prodejů] · [3 TOP makléřů] · [38 aktivních vozidel]` — **EXACT MATCH** s impl spec
- **§6.2 ř. 373 (R4 poznámka):** "Wireframe je IDENTICKÝ s implementation spec níže — žádné zkratky ('Prům.', 'ROI') v UI copy."

**Ověřeno:**
- Grep "Prům." v §6.2 → žádný nález
- Grep "ROI" v §6.2 → pouze v §13.1 (rationale pro substituci, ne v UI)
- "TOP" v `{topLevelCount} TOP makléřů` = full název levelu (TOP/SENIOR/BROKER/JUNIOR), ne zkratka. ✓

**Verdikt: ✅ FIX 1 KOMPLETNÍ**

### R2 Blokátor #2: Admin `/admin/tagy` bez nav entry ✅ FIXED

**R2 nález:** §4.3.17 jen "role check + table" — chyběla explicit nav entry → URL-only stránka = Rule 3 violation.

**R5 stav:**
- **§3 ř. 123:** `components/admin/AdminSidebar.tsx` v edit list s komentářem "**NOVÉ v R4** — přidat nav entry"
- **§4.3 step 17b (ř. 236-251):** detailed spec — nová NavSection "OBSAH" s item `{ id: "tags", href: "/admin/tagy", icon: "🏷️", label: "Tagy" }` a `roles: ["ADMIN"]`
- **§11.1 AC8 (ř. 1202):** "AdminSidebar obsahuje sekci 'OBSAH' s linkem 'Tagy' → `/admin/tagy` viditelným pouze pro roli ADMIN (R4 FIX 2 Rule 3 compliance — nav entry, ne jen URL)."

**Verdikt: ✅ FIX 2 KOMPLETNÍ** — admin najde stránku v nav, Rule 3 compliance OK.

### R2 Blokátor #3: TagInput spec roztržený odkazem na R1 ✅ FIXED

**R2 nález:** §7.2 říkal "Viz R1 plán §4.3.14 + doplnit" — R1 neexistuje. Core spec chyběl.

**R5 stav (§7.2 ř. 896-1108, cca 212 řádek kompletní):**
- **Props interface** (ř. 900-906) ✓ `value, onChange, maxTags, placeholder`
- **State** (ř. 909-918) ✓ `inputText, suggestions, isOpen, activeIndex, isLoading, debounceRef, inputRef, listboxId`
- **Effects** (ř. 922-950) ✓ debounced fetch, filter already-selected
- **Handlers** (ř. 953-1001) ✓ `addTag, removeTag, handleKeyDown` (ArrowDown/Up/Enter/Escape/Backspace)
- **JSX** (ř. 1004-1090) ✓ full pill row + input + counter + dropdown + create-new option
- **A11y checklist** (ř. 1093-1098) ✓ `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`, `role="listbox"`, `role="option"`, `aria-selected`, `aria-label` na remove buttons
- **Validace + error states** (ř. 1100-1106) ✓

**Verdikt: ✅ FIX 3 KOMPLETNÍ** — implementator má kompletní spec bez závislosti na R1.

### R2 Blokátor #4: JSON-LD ItemList + Person chybí ✅ FIXED

**R2 nález:** §11.3 AC19 vyžadovalo 4 schemas, §6 specifikovalo jen FAQPage + BreadcrumbList.

**R5 stav:**
- **§6.3b (ř. 482-522):** nová subsekce "JSON-LD ItemList + Person (R4 — Evžen FIX 4)"
  - ItemList template s `numberOfItems`, `itemListElement[]`
  - Person nested v každém `ListItem.item` s `name`, `url`, `jobTitle`, `address.addressLocality`, optional `image`
  - Explicit "server-rendered, ne v client component (aby Google Bot to viděl v initial HTML)"
- **§11.2 AC23 (ř. 1222-1226):** 4 schemas explicitně vyjmenované s field-level ověřením:
  - ItemList (§6.3b)
  - Person (nested v ListItem.item)
  - FAQPage (§6.7)
  - BreadcrumbList (§6.1)
- Google Rich Results Test validation mandated ✓

**Verdikt: ✅ FIX 4 KOMPLETNÍ** — 4 schemas kryté + validace plán.

---

## §2 — R4/R5 extras verifikace (5-9)

### #5: Slug `elektromobily` bez `-ev` (strict Rule 1) ✅ FIXED

- **§2 ř. 63:** comment `// "praha", "bmw", "elektromobily"` ✅
- **§9 ř. 1145:** `{ slug: "elektromobily", label: "Elektromobily", category: "SPECIALIZATION" }` ✅
- **§9 ř. 1167:** Jan Novák tag list obsahuje `elektromobily` (bez `-ev`) ✅
- **§11.1 AC10c (ř. 1206):** "AC fail: URL obsahující 'ev'" — explicit negative check ✅
- **§13.3 (ř. 1274-1276):** označeno jako VYŘEŠENO
- **§17 R5 changelog (ř. 1316-1326):** přehled všech 6 stringových změn vs R4

**SEO mitigation (§17 ř. 1326):** "Query 'elektromobily ev' pokryta v subheadline / meta description via `lib/landing-copy.ts`" — dobře ošetřeno, neztrácí SEO equity.

**Verdikt: ✅ #5 KOMPLETNÍ**

### #6: 301 aliasy `/h/[slug]` + `/tag/[slug]` ✅ FIXED

- **§3 ř. 110-111:** 2 nové soubory s `permanentRedirect` pattern
- **§4.3 step 18b (ř. 272-284):** implementation spec — thin route handler, per-route `permanentRedirect` (2 soubory × 5 ř.)
- **§11.1 AC10b (ř. 1205):** test `curl -I` → `301` nebo `308` (Next.js default)
- **§8 Commit 3 msg (ř. 1124):** "...sitemap + 301 aliases (task #54)"

**Verdikt: ✅ #6 KOMPLETNÍ**

### #7: §14 level badges SENIOR/JUNIOR out-of-scope note ✅ ADDRESSED

**§14 ř. 1293:**
> "Level badge terminologie (`TOP/SENIOR/BROKER/JUNIOR`) — pre-existing pojmenování v celém Carmakleru (profily, achievements, admin tabulky). Změna mimo scope TASK-054 — by vyžadovala cross-task audit. Flagged Evženem jako 'worth flagging pro design systém' → vytvořit samostatný audit-task (nejedná se o Rule 1 violation, level names jsou plné názvy, ne zkratky)."

**Správně:** level names jsou plné názvy (ne zkratky) → ne Rule 1. Jen CZ konzistence (SENIOR/JUNIOR anglicky) — audit-task deferred. Nepřekáží release TASK-054.

**Verdikt: ✅ #7 ADDRESSED**

### #8: CTA `/registrace` (ne neexistující `/makler/join`) ✅ FIXED

- **§6.6 `getCTACopy` ř. 649:** `secondary: { text: "Chci se stát makléřem", href: "/registrace" }` ✅
- **§6.6 `getCTACopy` ř. 655:** BRAND variant `href: "/registrace"` ✅
- **§13.3 (ř. 1274-1276):** "VYŘEŠENO — `/registrace` (existující route). Plán (§6.2 Hero, §6.6 CTA, lib/landing-copy.ts) používá `/registrace` všude."

**Verdikt: ✅ #8 KOMPLETNÍ**

### #9: Stats substituce topLevelCount + activeVehicles ✅ FIXED

- **§6.2 ř. 387-391:** 4 stats chip row — **exact impl spec**:
  - `{count} makléřů` (users.length)
  - `{totalSoldVehicles} úspěšných prodejů` (Vehicle status=SOLD)
  - `{topLevelCount} TOP makléřů` (count SENIOR+TOP brokerů) ← nahrazuje `avgRoi`
  - `{activeVehicles} aktivních vozidel` (Vehicle status=ACTIVE) ← nahrazuje `avgDays`
- **§6.2 ř. 393:** rationale "team-lead navrhl `průměrné ROI` + `průměrná doba prodeje`, ale tato data neexistují u brokerů (ROI = INVESTOR pole). Substituovány reálnými broker metrikami."
- **§13.1 (ř. 1255-1264):** detailed substituce rationale

**Verdikt: ✅ #9 KOMPLETNÍ** — substituce má smysl (data-driven, ne fiktivní metriky).

---

## §3 — NOVÝ NÁLEZ při re-verify: §6.8 Footer zkratka "m."

**Nová Rule 1 drobná violace v §6.8 (Section 8 "Další {category}"):**

**Wireframe ř. 766-767:**
```
│ [#Brno 2 m.] [#Ostrava 1 m.] [#Plzeň 1 m.] [#Liberec 1 m.]  │
│ [#Hradec Králové 1 m.] [#České Budějovice 1 m.] ...          │
```

**Impl spec ř. 800-801:**
```
- Per pill: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-orange-300 text-sm`
  - `#{label}` + `<span className="text-xs text-gray-400">{count} m.</span>`
```

**Problém:** `{count} m.` → "m." je zkratka pro "makléři" / "makléřů". Rule 1 říká: "Vždy celý název (např. 'Backoffice administrátor' ne 'BO admin')."

**Inkonzistence navíc:**
- §6.2 stats chip: `{count} makléřů` (plné slovo) ✅
- §6.4 Related Hashtags pill: `{count} makléřů` (plné slovo, ř. 548) ✅
- §6.8 Footer pill: `{count} m.` ❌ zkratka

Dvě různé pill komponenty (Related vs Footer) s nekonzistentní copy. Footer byl patrně refactor během R4 rewrite a "m." se tam dostalo pro tight-space constraint.

**Navržená oprava (1 řádek):**
- §6.8 ř. 801: `{count} m.` → `{count} makléřů` **NEBO** jen `{count}` (bez suffixu — user pochopí z kontextu pill = "hashtag: N")
- §6.8 wireframe ř. 766-767: paralelní update

**Risk pokud neopraveno:**
- Implementator podle impl spec vyrenderuje "2 m." v pillu → Rule 1 violation v produkci
- User si všimne ve Chrome testu: "proč tu je 'm.' a ne 'makléřů'?" → vrací se na předělání

**Odhad opravy:** 2 min planner (1 commit v R6) nebo 30 sec implementatora (explicit instrukce v zadání Fáze C nebo Fáze D).

---

## §4 — Doslovná shoda s user zadáním (lead request)

Lead požádal o verifikaci, že plán doslovně odpovídá zadání:

### §4.1 "end-to-end hashtags feature"

Ověřeno přes §3 (seznam souborů) + §4 (4 fáze) + §5 (API) + §6 (landing):
- Databáze: §2 Prisma Tag model + M2M ✅
- Backend API: §4.2 + §5 (GET/PUT endpoints) ✅
- Frontend fill: §4.3 step 15 (muj-ucet/profil) ✅
- Frontend display (profile): §4.3 step 16 (profil/[slug] TagPill grid) ✅
- Frontend landing: §4.4 step 24 (makleri/[slug] 9 sekcí) ✅
- Sitemap: §4.3 step 18 ✅
- Seed: §4.1 step 4 + §9 ✅
- Admin overview: §4.3 step 17 + 17b ✅

**Verdikt: end-to-end ✅**

### §4.2 "profile fill → display → SEO landing page per tag"

- **Fill:** §4.3.15 — TagInput (§7.2) v `/muj-ucet/profil` Card "Hashtagy (max 10)" mezi Specializace a Služby ✅
- **Display:** §4.3.16 — TagPill grid v `/profil/[slug]` infocolumn ✅
- **Landing per tag:** §4.4.24 — `/makleri/[slug]` s 9 sekcemi (§6.1-§6.9) ✅

**Verdikt: 3-fázový flow ✅**

### §4.3 "UX musí být 'hezky' (premium, ne bazoš)"

Ověřeno přes §6 (9 sekcí, §6.1-§6.9):
1. **Breadcrumb** — BreadcrumbList JSON-LD ✅
2. **Hero** — orange gradient full-bleed, eyebrow chip, category-specific H1, subheadline, 4 stats chips, 4 featured avatars overlap, 2 CTAs ✅
3. **Broker Grid** — 3/2/1 responsive, featured larger + orange border, sort toggle, avatar+name+level+city+tags+bio+stats+CTA + pagination ✅
4. **Related Hashtags** — co-occurrence pills ✅
5. **Social Proof** — 3 recent SOLD vehicles + fallback ✅
6. **Mid CTA (auth-aware)** — orange gradient, category-driven copy, non-auth + BROKER variant ✅
7. **FAQ** — accordion s 4 otázek per category, FAQPage JSON-LD ✅
8. **Footer "Další {category}"** — sibling tagy pills ✅ (s drobnou "m." zkratkou — viz §3)
9. **Bottom CTA** — subtle grey, "Všichni makléři" → `/makleri` ✅

Premium design tokens v §6a (ř. 827-848): orange gradient, rounded-2xl, backdrop-blur, ring, overlap avatars, line-clamp, transition. ✅

**Verdikt: premium UX ✅** (s drobnou výhradou §3).

### §4.4 "nothing shortcuts/hidden"

- **Admin `/admin/tagy`** → přidán do AdminSidebar OBSAH sekce (§3 + §4.3 step 17b). Rule 3 OK ✅
- **Social proof** hide pokud 0 dat → user-approved chování, ne "skrytí feature" ✅
- **CTA auth-aware** → 2 varianty, ne skrývání ✅
- **noindex** pro tagy < 2 brokeři → SEO best practice, ne "hidden" ✅
- **§14 Out-of-scope items** (Fáze 2) explicitně vyjmenované, žádné "tajně odloženo" ✅
- **Žádné delete route** v §3 ✅

**Verdikt: nothing hidden ✅**

### §4.5 Zkratky v UI (Rule 1 systematický scan)

Checkováno systematicky vs všechny UI-facing strings v §6:

| Sekce | Copy | Stav |
|---|---|---|
| §6.1 Breadcrumb | `Domů › Makléři › #Praha` | ✅ full |
| §6.2 Hero eyebrow | `Lokalita / Značka / Specializace / Služba / Hashtag` | ✅ full |
| §6.2 Hero H1 (per category) | `Makléři v Praze`, `Specialisté na BMW`, `Výkup do 24h`, etc. | ✅ full |
| §6.2 Stats chips | `{count} makléřů`, `{totalSoldVehicles} úspěšných prodejů`, `{topLevelCount} TOP makléřů`, `{activeVehicles} aktivních vozidel` | ✅ full (TOP = full level name) |
| §6.2 CTAs | `Najít makléře`, `Chci se stát makléřem` | ✅ full |
| §6.3 Card | `Doporučený`, `Zobrazit profil`, `Kontaktovat`, `{totalSales} prodejů`, `{level}`, `{activeVehicles} aktivních vozidel` | ✅ full |
| §6.4 Related Hashtags | `Mohlo by vás zajímat`, `{count} makléřů` | ✅ full |
| §6.5 Social Proof | `Nedávné úspěchy makléřů v #Praha`, `— Jan Novák` | ✅ full |
| §6.6 CTA Block | `Také byste rádi prodali auto v Praze?`, `Najít makléře`, `Chci se stát makléřem` | ✅ full |
| §6.7 FAQ | full Czech věty v otázkách i odpovědích | ✅ full |
| §6.8 Footer Další | `Další lokality`, `Další značky`, `#{label}`, `{count} m.` | ❌ **"m." zkratka** |
| §6.9 Bottom CTA | `Nenašli jste to co hledáte?`, `Všichni makléři` | ✅ full |
| §7.2 TagInput | `Napište hashtag a stiskněte Enter...`, `{value.length}/{maxTags ?? 10} hashtagů`, `Vytvořit: #xyz`, `Maximum 10 hashtagů`, `Odebrat {label}` | ✅ full |

**Jediný nález:** §6.8 `{count} m.` — viz §3 výše.

---

## §5 — Další pozorování (positive + notes)

**Pozitiva R5 vs R4:**
- §13.3 "`/makler/join` VYŘEŠENO" — planovač explicitně řeší pre-existing route audit. Žádné guess­work.
- §17 R5 changelog — transparentní delta vs R4, 6 stringových změn.
- §16 R4 changelog — paralelní transparency vs R3.
- §13.1 stats substituce rationale — planovač nepřekrývá user návrh, ale uvádí reálné důvody pro substituci (Deal model neexistuje, ROI je INVESTOR pole). User může zvážit.
- §10 STOP thresholds sjednoceny s §11 AC (memory rule `feedback_planovac_consistent_ranges.md`).

**Minor flagnuti (ne blokátory):**
- **§6.8 ř. 798:** "Všechny hashtagy →" link je v wireframe, ale §13.2 option (a) (= odstranit) = default. Inkonzistence wireframe vs spec. Planner/implementator si musí ujasnit. 5 sec.
- **§6.5 Vehicle field name (`userId` vs `brokerId`):** ř. 588 říká "Implementátor ověří field name ve schema" — OK, má to jasnou instrukci.

---

## §6 — Rekomapace pro lead (bodový report)

| R2 Blokátor | R5 Stav | Lokace |
|---|---|---|
| 1. "Prům."/"ROI" zkratky | ✅ FIXED | §6.2 ř. 366-391 (wireframe + impl sync) |
| 2. Admin nav entry | ✅ FIXED | §3 ř. 123 + §4.3 step 17b + §11.1 AC8 |
| 3. TagInput spec | ✅ FIXED | §7.2 ř. 896-1108 (212 ř. kompletní) |
| 4. ItemList + Person JSON-LD | ✅ FIXED | §6.3b ř. 482-522 + §11.2 AC23 |

| R4/R5 Extra | R5 Stav | Lokace |
|---|---|---|
| 5. `elektromobily` slug | ✅ FIXED | §2 ř. 63 + §9 ř. 1145 + AC10c |
| 6. 301 aliasy | ✅ FIXED | §3 ř. 110-111 + §4.3 step 18b + AC10b |
| 7. Level badges out-of-scope | ✅ ADDRESSED | §14 ř. 1293 |
| 8. `/registrace` CTA | ✅ FIXED | §6.6 + §13.3 |
| 9. Stats substituce | ✅ FIXED | §6.2 + §13.1 |

| Nový nález | Priority | Oprava |
|---|---|---|
| §6.8 `{count} m.` zkratka | LOW (cosmetic, 1 řádek) | `m.` → `makléřů` NEBO vypustit suffix |

---

## §7 — Finální rozhodnutí pro lead

**Moje doporučení:**

### Varianta A — Krátký R6 (precise, Evžen-strict)
Vrátit planovači pro R6 pouze s opravou `§6.8 ř. 766-767 + 801` — trivia 1-řádek fix. Pak plán je 100 % Rule 1 compliant a implementator nemá žádný scope pro drobnou zkratku. Odhad: +2 min planner.

### Varianta B — Přímý dispatch implementatorovi s note
Dispatchnout R5 přímo s explicit instrukcí v zadání: "V §6.8 rendrovat `{count} makléřů` (plný název), NE `{count} m.` jak je v impl spec ř. 801 — konzistence s §6.2 a §6.4." Implementator při Fáze D udělá 1-char fix inline.

### Varianta C — Plain schválení (lenient)
Schválit R5 as-is. Implementator s vysokou pravděpodobností i tak napíše `{count} makléřů` protože je to očividně konzistentní s ostatními sekcemi. Risk: explicit spec ř. 801 říká "m.", pokud implementator bude doslova dodržovat spec, "m." se vyrenderuje → Chrome test flagne, cycle back.

**Moje preference: Varianta B** — lead rozhodne v zadání Fáze D s 1 řádkou, implementator má explicit instrukci, žádná R6 iterace needed.

Strict interpretace Evžen role by byla Varianta A (ZAMÍTNOUT dokud není 100 %). Ale vzhledem k extensive R4+R5 práci a triviale nálezu, Varianta B je reasonable kompromis.

**Rozhodnutí je tvoje, lead.** Ať už zvolíš A, B, nebo C, plán je substantivně připravený pro dispatch po této jedné opravě.
