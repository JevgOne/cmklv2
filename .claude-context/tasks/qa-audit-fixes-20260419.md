# QA Kontrola — /sluzby/vykup + /prezentace

**Datum:** 2026-04-19  
**Kontrolor:** kontrolor agent  
**Podklad:** plan-audit-fixes-20260419.md

---

## 1. SIMPLIFY KONTROLA

### /sluzby/vykup/page.tsx + VykupForm.tsx
- ✅ Kód je čistý, žádné duplicity, správně sleduje pattern ostatních service pages
- ✅ `VykupForm.tsx` správně oddělen jako client component
- ✅ Stavové proměnné se skutečně používají (brand, model, year, mileage, phone — všechny v fetch body)
- ⚠️ **BONUS (odchylka od plánu):** VykupForm skutečně odesílá na `/api/contact` — plán říkal „vizuální formulář, zatím neodesílá na API". Endpoint existuje, funkce funguje. Hodnoceno jako pozitivní odchylka, ale dokumentováno.

### app/prezentace/page.tsx + layout.tsx
- ✅ `AnimatedSection` a `DotNav` správně odděleny jako helper komponenty
- ✅ `PrezentaceContent` správně zabalena v `<Suspense>` kvůli `useSearchParams` (Next.js pattern)
- ✅ Scroll tracking přes `containerRef` + passivní scroll listener — čistě implementováno
- ✅ Správné route placement: `app/prezentace/` (mimo `(web)`) — čistší než layout override

---

## 2. DEBUG KONTROLA

### npm run build
```
✅ BUILD PASSES — žádné errory
```
- `/sluzby/vykup` — přítomno v output jako `ƒ` (Dynamic)
- `/prezentace` — přítomno v output jako `○` (Static shell + Suspense)
- Sentry deprecation warnings jsou pre-existující, nesouvisí s touto implementací

### npm run lint (pouze nové soubory)
```
app/prezentace/page.tsx
  119:11  warning  Using `<img>` could result in slower LCP — @next/next/no-img-element
```
- Týká se loga CarMakléř v sekci 1 (`<img src="/brand/logo-color.png">`)
- Doporučení: nahradit `next/image <Image />`, ale jde o warning, ne error
- Ostatní nové soubory: **0 errors, 0 warnings**

---

## 3. REVERZNÍ KONTROLA

### POLOŽKA 1 — /sluzby/vykup

| Acceptance Criterion | Výsledek | Poznámka |
|---|---|---|
| Stránka `/sluzby/vykup` renderuje bez chyb | ✅ | Build OK, ƒ dynamic route |
| Metadata: title, description, OG správné | ✅ | Přesně dle spec |
| 3 kroky, 4 benefity, FAQ accordion | ✅ | Přesně dle spec, ServicePage komponent |
| Formulář se zobrazuje a je responzivní | ✅ | Card wrapper, responsive grid |
| Breadcrumbs: Domů > Služby > Výkup vozidel | ✅ | `breadcrumbLabel="Výkup vozidel"` předáno |
| Design konzistentní s ostatními /sluzby/* | ✅ | Stejný ServicePage pattern |
| `npm run build` projde bez chyb | ✅ | Confirmed |

**Výsledek položky 1: ✅ APPROVED — všechna acceptance criteria splněna**

---

### POLOŽKA 2 — /prezentace

| Acceptance Criterion | Výsledek | Poznámka |
|---|---|---|
| Fullscreen bez navbar/footer | ✅ | Route mimo `(web)`, layout.tsx vrací pouze `<>{children}</>` |
| Všech 8 sekcí, každá = 100vh | ✅ | 8× AnimatedSection s `min-h-screen snap-start` |
| Scroll snap funguje | ✅ | `snap-y snap-mandatory` na kontejneru |
| Framer Motion animace | ✅ | `motion.div whileInView` + `useInView` |
| `?manager=slug` zobrazí kontakt manažera | ⚠️ | **ČÁSTEČNÉ** — zobrazí slug jako jméno (string transform), ale **nefetchuje z `/api/users?slug=...`** — telefon a email chybí |
| Bez `?manager` generic kontakt | ✅ | Statický blok s partneri@carmakler.cz + phone |
| Tečkový indikátor ukazuje aktivní sekci | ✅ | DotNav + scroll tracking |
| Responzivní | ✅ | sm: breakpointy ve všech sekcích |
| robots: noindex, nofollow | ✅ | V layout.tsx metadata |
| `npm run build` projde bez chyb | ✅ | Confirmed |
| QR kód (sekce 8) | ❌ | **CHYBÍ** — plán říkal QR kód nebo fallback text „Naskenujte QR kód". Ani jedno není přítomno |

**Výsledek položky 2: ⚠️ PODMÍNĚNO — 2 nálezy vyžadují opravu**

---

## SHRNUTÍ NÁLEZŮ

### ❌ Blocker (musí být opraveno)
_(žádné blockery — build projde, funkčnost je dostatečná pro preview)_

### ⚠️ Střední priority (doporučené opravy)

**[NÁLEZ-1] — prezentace/page.tsx: manager API fetch chybí**
- **Soubor:** `app/prezentace/page.tsx`, sekce 8 (Kontakt), řádky 390-401
- **Problém:** `?manager=slug` zobrazí jen transformovaný slug jako jméno. Nevolá `/api/users?slug=...`. Telefon a email manažera nejsou k dispozici.
- **Plán říkal:** "fetch `/api/users?slug=...` → jméno, telefon, email"
- **Návrh opravy:** `useEffect` fetchovat `/api/users?slug=${managerSlug}` a zobrazit jméno + telefon + email z odpovědi. Fallback na string transform pokud API odpoví chybou.

**[NÁLEZ-2] — prezentace/page.tsx: QR kód chybí**
- **Soubor:** `app/prezentace/page.tsx`, sekce 8 (Kontakt)
- **Problém:** QR kód není ani jako knihovna (`qrcode.react`), ani jako fallback statický text.
- **Plán říkal:** "QR kód (odkaz na /kontakt nebo registraci) — STOP-2: pokud nelze nainstalovat, fallback statický text"
- **Návrh opravy:** Přidat jednoduchý text odkaz nebo tlačítko "Registrovat se jako partner →" s `href="/registrace/partner"` pokud se QR knihovna nepřidávala.

### 💡 Nízká priorita (neblokuje)

**[NÁLEZ-3] — prezentace/page.tsx:119: `<img>` místo `<Image />`**
- Lint warning (ne error). Logo CarMakléř. Doporučení: `import Image from "next/image"` + `<Image src="/brand/logo-color.png" alt="CarMakléř" width={160} height={80} className="mx-auto mb-8 brightness-0 invert" />`

**[NÁLEZ-4] — VykupForm.tsx: odesílá na /api/contact (nad rámec spec)**
- Pozitivní odchylka. Plán říkal "vizuální formulář, neodesílá na API". Implementátor přidal reálnou funkčnost. `/api/contact` endpoint existuje. Zachovat.

---

## ZÁVĚR

| Položka | Status |
|---|---|
| /sluzby/vykup | ✅ APPROVED |
| /prezentace | ⚠️ PODMÍNĚNO — opravit NÁLEZ-1 + NÁLEZ-2 |
| Build | ✅ PASS |
| Lint (nové soubory) | ✅ 0 errors (1 minor warning) |

**Doporučení:** Implementátor opraví NÁLEZ-1 (manager API fetch) a NÁLEZ-2 (QR kód fallback). Obě opravy jsou malé (~20-30 řádků), neovlivňují /sluzby/vykup.
