# Evžen prezentační gate — TASK-054 před GO-TO-USER

**Datum:** 2026-04-16
**Kontrolor:** Evžen the King
**Task:** #29 (re-verify), #30 (pending fix)
**Scope:** kontrola stavu před prezentací uživateli

---

## VERDIKT: ⛔ STOP — ne prezentovat, dokud nejsou 2 věci hotové

**Co brání GO-TO-USER:**
1. **Task #30 PENDING** — `min.` → `minimálně` fix v `lib/landing-copy.ts:236` nebyl commitnut
2. **Working tree DIRTY** — 14 uncommitted modifikací včetně TASK-054 souborů (simplify pass refactor)

---

## §1 — Stav #30 (Rule 1 finding z předchozího verify)

**Současný stav souboru** `lib/landing-copy.ts:236`:
```ts
answer: "Provize je 5 % z prodejní ceny, min. 25 000 Kč. V případě výkupu se provize strhává z ceny.",
```

**Task #30 status:** `pending`
**Task #30 description:** *"CANNOT dispatch yet — test-chrome běží na doplňkových 6 bodech, memory rule `feedback_no_parallel_impl_test` blokuje parallel impl+test-chrome. Dispatch až po test-chrome dokončení (pak všechny fixy z test-chrome + Evžen finding v jednom commitu)."*

**Důsledek:** Rule 1 violation **stále přítomna v kódu**. Bez fixu nemůže být prezentace uživateli čistá — uživatel uvidí `min. 25 000 Kč` v FAQ na `/makleri/vykup-do-24h`.

---

## §2 — Working tree stav (uncommitted)

`git status --short` → **14 souborů M** (nikoliv všechny TASK-054, ale 8 souborů patří do scope):

**TASK-054 soubory s pending changes:**
| Soubor | Delta | Povaha |
|---|---|---|
| `app/(web)/makleri/[slug]/loading.tsx` | -3 | Simplify — smazány JSX section komentáře |
| `app/(web)/makleri/[slug]/page.tsx` | +/- 16 | Simplify |
| `app/(web)/profil/[slug]/page.tsx` | +78 -88 | Simplify — extrakce `safeJsonArray` helper, konstanty `DAY_LABELS` |
| `components/web/BrokerCard.tsx` | -10 +5 | Simplify — import `getInitials` z `lib/utils` |
| `components/web/BrokerGrid.tsx` | -4 | Simplify — smazány doc comments |
| `components/web/CTABlock.tsx` | -4 | Simplify — smazány doc comments |
| `components/web/LandingHero.tsx` | -10 +5 | Simplify — import `getInitials`, cleanup |
| `components/web/RelatedHashtags.tsx` | -3 | Simplify — smazány doc comments |
| `lib/utils.ts` | +25 | **NEW** `getInitials()` + `parseCities()` helpers |

**Non-TASK-054 modifikace (mimo scope tohoto verify):**
- `.claude-context/tasks/...` (admin logs)
- `TASK-QUEUE.md`
- `public/sw.js`

### Vyhodnocení simplify pass

- **Funkční změny:** ŽÁDNÉ — pouze refactor (extrakce helperů, smazání doc komentářů)
- **Delete files:** 0 (v `git status` žádný `D` marker)
- **Rule 4 violation:** žádný — jen `delete` uvnitř souborů (komentáře), ne smazané soubory
- **Rule 6 violation:** ⚠️ **ANO pokud se nezkomituje před prezentací** — lead v message říká "6 commits na main" jako finální stav, ale working tree je dirty → divergence mezi "status" a reality

**Důležité:** Tento simplify pass je pravděpodobně kombinovaná oprava QA findings F1 (slugify/getInitials duplikace) + část Evžen minor. Pokud se bude commitovat spolu s `min.` fixem → 1 commit s čistou historií.

---

## §3 — Odpovědi na tvé 6 otázek (verifikace)

### 1. Rule 1 (žádné zkratky): něco přehlédnuté?

**Ne, jedno co jsem našel už v task #29 je stále tam:** `lib/landing-copy.ts:236` — `min. 25 000 Kč`.
Grep ověřeno: `\b(min|max|např|tzn|apod|atd|vč|resp|tj)\.` → **1 match** (jen ř. 236).

Kromě tohoto vše čisté:
- `{count} makléřů` plný tvar napříč Hero / Related / Siblings / Footer ✅
- Žádné `Prům.`, `ROI`, `EV` ✅
- Slug `elektromobily` bez `-ev` ✅
- Label „Elektromobily" bez „EV" ✅

### 2. Rule 3 (admin najde v navigaci)

**`components/admin/AdminSidebar.tsx:81-87` ověřeno:**
```tsx
{
  title: "OBSAH",
  items: [
    { id: "tags", href: "/admin/tagy", icon: "🏷️", label: "Tagy" },
  ],
  roles: ["ADMIN"],
}
```
✅ ADMIN role má nav entry. Žádný hidden URL-only page.

### 3. Rule 4/5 (nic skryté/smazané)

- `git diff --diff-filter=D 6666db9^ 07fb6d7` → **0 souborů**
- `git status --diff-filter=D` → **0 souborů**
- Sitemap obsahuje tagPages ≥2 brokerů ✅
- 301 aliasy `/h/[slug]`, `/tag/[slug]` ✅

### 4. Rule 6 (individual changes)

**6 commits na main:** ✅ Match — každý commit má čistý scope (viz lead's message tabulka).

**ALE** — working tree má další ~88 řádek diffů, které ještě nejsou v historii. Pokud se bude prezentovat user demo **teď**, je nejasné, jaký kód actually běží:
- Pokud dev server čte working tree → user uvidí refactor verzi (bez doc komentářů, s `getInitials` helperem)
- Pokud se deploynul `07fb6d7` → user uvidí staré komentáře ve sourcu + `min. 25 000 Kč` v FAQ

Před prezentací musí být working tree buď:
- **Commitnut** (recommended — preserves work) + deploy nové HEAD
- **Stashnut/reverted** (pokud simplify pass není schválený)

### 5. Premium UX „hezky"

**9 sekcí + 4 JSON-LD + Czech grammar + ISR ověřeno:**
- Hero gradient orange, 4 stats chips, 4 featured avatar overlap ✅
- BrokerGrid featured card (2× width + orange border + „Doporučený" badge) ✅
- RelatedHashtags co-occurrence → featured fallback ✅
- SocialProof 3 recent SOLD + fallback ✅
- Mid CTA auth-aware (BROKER deep-link) ✅
- FAQ accordion 4 items per category ✅
- Footer siblings `{count} makléřů` ✅
- Bottom CTA → `/makleri` ✅
- JSON-LD: ItemList + Person + FAQPage + BreadcrumbList ✅
- `lib/landing-copy.ts` CITY_LOCATIVE (praha → Praze/Prahy, 8 měst) ✅
- ISR revalidate=3600 ✅
- noindex,follow pro <2 brokery ✅

**Verdikt pro UX:** splňuje „hezky" per user's 3. zpráva. Ne-bazoš-style.

### 6. End-to-end funkční

**Flow ověřen (read-only, dle commit diffs):**
1. Broker otevře `/muj-ucet/profil` → karta „Hashtagy (max 10)" (`page.tsx:379-390`) ✅
2. TagInput s autocomplete → PUT `/api/profile/tags` (transaction atomic, commit `522b4a6`) ✅
3. `/profil/[slug]` → TagPill grid render (commit `77485ef`) ✅
4. Klik na TagPill → `/makleri/[slug]` (linka komponenty `TagPill.tsx`) ✅
5. Landing zobrazí brokera v gridu + JSON-LD → SEO ✅
6. Test-chrome 12/12 PASS (potvrzeno lead) ✅

End-to-end flow **funkční**. Jen UI copy má 1 zkratku k opravě.

---

## §4 — Shrnutí QA findings (z tvé message)

| # | Finding | Severity | Můj názor |
|---|---|---|---|
| F1 | `slugify` import ze dvou modulů | minor | Code quality — simplify pass v working tree už to pravděpodobně řeší (`getInitials` přesunut do `lib/utils.ts`). Commit pending. |
| F3 | BrokerCard level badge position | minor | Vizuální nit — NE Rule violation (info stále zobrazena). Acceptable. |
| Evžen `min.` | Rule 1 abbreviation | minor | **Blokátor pro prezentaci.** 1-line fix. Task #30 pending. |

---

## §5 — Před prezentací uživateli (akční plán)

### KROK 1 — Dispatch task #30
Implementator: 1-line edit v `lib/landing-copy.ts:236`: `min.` → `minimálně`.

### KROK 2 — Rozhodnutí o working tree simplify pass
Lead musí rozhodnout:
- **(A)** Simplify pass je QA fix — **commit jako samostatný `refactor` commit** (Rule 6 individual)
- **(B)** Simplify pass je mid-implementace — **stash/revert** pokud ještě není schválený

Bez tohoto rozhodnutí je divergence mezi reportovaným stavem (6 commits) a reality (working tree ≠ HEAD).

### KROK 3 — Po obou commitech
- Evžen quick re-verify (jen `grep "min\."` a `git status` clean)
- GO-TO-USER s commit list + demo URL

**Effort:** <10 min total (1-line edit + 1-2 commits + 1 quick re-verify).

---

## §6 — Verdikt pro lead

**⛔ NEPREZENTOVAT dokud nejsou vyřešeny:**
1. Task #30 (1-line Rule 1 fix) — **pending, čekal na test-chrome dokončení → test-chrome je PASS → lze dispatche**
2. Working tree drift (simplify pass) — commit nebo revert, Rule 6 compliance

**Po resolve:** vše ostatní je ✅ — premium UX, end-to-end funkční, 3 user messages splněny, 5/6 rules clean, plán R6 match implementace.

**Optimistický scenario:** 10 minut práce → clean state → prezentace uživateli s čistým svědomím.
