# Plán — Task #44 (FIX #28a): Broken footer links na main webu

**Priorita:** HIGH (regrese z #28 footer redesignu, UX blocker — 404 z footer)
**Typ:** Bugfix (mini-plán)
**Zadal:** team-lead (test-chrome #42 detekce)
**Datum:** 2026-04-06

---

## 1. Cíl

Opravit **4 broken links** v footeru (všech 4 platforem), které byly zavedeny při #28 redesignu. Bez vytváření nových stránek.

## 2. Discovery — co test-chrome #42 detekoval + co jsem našel navíc

| # | Link | Zdroj | Sloupec | Dotčené platformy | Stránka existuje? |
|---|------|-------|---------|-------------------|-------------------|
| 1 | `/stan-se-maklerem` | `components/main/Footer.tsx:14` | Služby | main | ❌ NE |
| 2 | `/blog` | `components/main/Footer.tsx:15` | Služby | main | ❌ NE |
| 3 | `/faq` | `components/common/FooterBase.tsx:174` | Podpora | **main + shop + inzerce + marketplace** | ❌ NE |
| 4 | `/cookies` ⚠️ **BONUS** | `components/common/FooterBase.tsx:273` | Bottom bar legal | **main + shop + inzerce + marketplace** | ❌ NE (správně `/zasady-cookies`) |

⚠️ **Bonus bug #4** — nedetekoval test-chrome #42 (je v bottom baru), ale našel jsem při discovery. Page existuje jako `/zasady-cookies` ale footer odkazuje na `/cookies` → 404. Affects všechny 4 platformy.

## 3. Existující stránky (volba cíle pro redirect)

```
app/(web)/kariera/          ✅   → ideální pro "Staň se makléřem"
app/(web)/makleri/          ✅   → alternativa
app/(web)/jak-to-funguje/   ✅   → ideální pro "FAQ"
app/(web)/zasady-cookies/   ✅   → fix pro /cookies bug
```

## 4. Rozhodnutí pro každý link

### Link #1 — "Staň se makléřem" → **A) Remap na `/kariera`**
- **Proč:** `/kariera` page už existuje a je relevantní (nábor makléřů). Žádná nová práce navíc.
- **Alternativy:** `/makleri` (více PR orientovaná, ne nábor) — zamítnuto
- **Edit:** `components/main/Footer.tsx:14` — `href: "/kariera"`
- **Poznámka:** Duplicita s "Kariéra" linkem ve sloupci "Firma" (`FooterBase.tsx:223`) je OK — sémanticky "Staň se makléřem" má jiný user intent a jiný sloupec.

### Link #2 — "Blog" → **B) Odebrat link**
- **Proč:** Team-lead explicit — blog je separátní projekt, neplánuje se. Nikdy se neměl v MVP objevit.
- **Edit:** `components/main/Footer.tsx:15` — smazat řádek
- **Follow-up:** Pokud někdy bude blog samostatná subdoména (`blog.carmakler.cz`), přidat zpět jako `external: true` link. Žádný task teď.

### Link #3 — "FAQ" → **A) Remap na `/jak-to-funguje`**
- **Proč:** Team-lead doporučení. `/jak-to-funguje` pokrývá typické FAQ dotazy. Sloupec "Podpora" label může zůstat "FAQ" (user-friendly) nebo přejmenovat na "Jak to funguje".
- **Návrh labelu:** zachovat "FAQ" (kratší, běžnější v footerech)
- **Edit:** `components/common/FooterBase.tsx:174` — `href={urls.main("/jak-to-funguje")}`
- **Dopad:** Oprava se propaguje do **všech 4 platform** (main, shop, inzerce, marketplace) — FooterBase je sdílený.

### Link #4 ⚠️ BONUS — "Cookies" → **A) Fix typo na `/zasady-cookies`**
- **Proč:** Čistý typo fix. Stránka existuje, jen špatná cesta.
- **Edit:** `components/common/FooterBase.tsx:273` — `href={urls.main("/zasady-cookies")}`
- **Dopad:** Všechny 4 platformy (sdílený bottom bar).

## 5. Dotčené soubory (final list)

| # | Soubor | Akce | Řádky |
|---|--------|------|-------|
| 1 | `components/main/Footer.tsx` | Edit: 1 remap + 1 delete | 14–15 |
| 2 | `components/common/FooterBase.tsx` | Edit: 2 cesty | 174, 273 |
| 3 | `components/web/Footer.tsx` | Edit: same jako main/Footer.tsx | 22–23 |

**Pozn. k #3:** `components/web/Footer.tsx` má TODO(cleanup) — "orphan, není importován v žádné App Router route". Má ale stejné broken linky jako `main/Footer.tsx`. **Rozhodnutí:** dual-update (opravit i tento), dokud nebude smazán cleanup taskem — je to bezpečnější než risknout latent bug, pokud by se někde zase začal importovat.

## 6. Out of scope

- ❌ Vytváření nových stránek (`/stan-se-maklerem`, `/blog`, `/faq`) — team-lead explicit "nevytvářet"
- ❌ Redirect rules v `next.config.ts` (301 z `/faq` → `/jak-to-funguje`) — nadbytečné, odkazy v kódu budou hned správné. SEO dopad nula, stránky nikdy nebyly crawlnuté.
- ❌ Přejmenování label "FAQ" → "Jak to funguje" — UX preference, ponecháno na designera/PO
- ❌ Smazání orphan `components/web/Footer.tsx` — cleanup task je mimo scope

## 7. Acceptance criteria

- [ ] `components/main/Footer.tsx` neobsahuje `/stan-se-maklerem` ani `/blog`
- [ ] `components/web/Footer.tsx` neobsahuje `/stan-se-maklerem` ani `/blog` (dual-update)
- [ ] `components/common/FooterBase.tsx` obsahuje `/jak-to-funguje` (ne `/faq`)
- [ ] `components/common/FooterBase.tsx` obsahuje `/zasady-cookies` (ne `/cookies`)
- [ ] `grep -rn "/stan-se-maklerem\|/blog\|urls.main(\"/faq\")\|urls.main(\"/cookies\")" components/` vrátí 0 matches
- [ ] Manuální click-through všech linků v footeru main webu — žádný 404
- [ ] Test-chrome re-run #42 → 0 broken footer links

## 8. Risks / edge cases

1. **Duplicita "Kariéra" vs "Staň se makléřem"** — oba odkazují na `/kariera`. Akceptovatelné (jiný sloupec, jiný user intent — CTA vs corporate).
2. **Label "FAQ" míří na `/jak-to-funguje`** — user expectation mismatch je nízký, obě stránky řeší typické dotazy. Pokud by to byl problém, přejmenovat label v follow-up.
3. **Bonus fix #4** není ve scope test-chrome #42 reportu — proaktivní oprava. Team-lead schvaluje? (default: ANO, je to čistý typo fix, žádná logická změna)

## 9. Follow-ups (mimo tento task)

- **#28b** — cleanup task: smazat orphan `components/web/Footer.tsx` po >= 1 týdnu produkce bez incidentu
- **#28c** — (future) `blog.carmakler.cz` subdoména a návrat "Blog" linku jako external
- **#28d** — (future) decide FAQ page: dedikovaná `/faq` nebo nechat `/jak-to-funguje` jako náhradu

## 10. Velikost a čas

- **Změny:** 3 soubory, ~6 řádků
- **Rizikovost:** minimální (triviální edits, žádná logika)
- **Testování:** manual click-through + grep check

---

## Poznámka pro team-leada

Plán je ready k dispatchu na **implementátora**. Bonus bug #4 (`/cookies` → `/zasady-cookies`) je přidán nad rámec test-chrome #42 reportu — pokud chceš scope omezit jen na 3 linky z #42, stačí to říct a #4 přesunu do separate follow-upu.
