# Plan Task #055 — Default automotive cover photo

**Datum:** 2026-04-16
**Planovač:** Claude Opus 4.6
**Zdroj:** Úkol od uživatele — nahradit oranžový gradient cover na `/profil/[slug]` defaultní automotive fotkou.

---

## 1. Kontext (ověřeno)

- **Soubor:** `app/(web)/profil/[slug]/ProfileClient.tsx:244`
- **Současný kód:**
  ```tsx
  <div className="relative h-56 sm:h-72 md:h-96 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
    {user.coverPhoto && (
      <Image src={user.coverPhoto} alt="Cover" fill className="object-cover" priority />
    )}
  </div>
  ```
- **next.config.ts remotePatterns:** `files.carmakler.cz`, `res.cloudinary.com`, `placehold.co`, `images.unsplash.com` (všechny whitelistnuté).
- **CSP img-src:** `'self' data: blob: files.carmakler.cz res.cloudinary.com placehold.co *.sentry.io widget.packeta.com` — **POZOR: Unsplash v CSP NENÍ**, takže externí Unsplash URLs by v prod (až se CSP přepne z Report-Only na enforce) selhaly.
- **/public/images/:** obsahuje pouze `placeholder-car.jpg`.

---

## 2. Rozhodnutí: **Varianta A** — lokální soubory v `/public/images/covers/`

**Zvoleno protože:**
- CSP-clean (`self` je vždy povoleno, Unsplash není v `img-src`).
- Žádná závislost na externím CDN (Unsplash, Cloudinary) pro default asset.
- Next.js Image optimization + automatické cachování + WebP/AVIF.
- Deterministic, rychlé, nulové náklady.
- Vrakoviště PWA + makléř PWA fungují offline (Serwist cache `/public/`).

**Odmítnuto:**
- **B (Cloudinary):** přidává latence na CDN roundtrip + zbytečné transformace pro statický asset. OK kdyby uživatel už měl nahrané, ale nemá.
- **C (CSS + SVG):** elegantní, ale nevypadá „automotive" a neodlišuje makléře vizuálně. Pro 4 různé default kovery potřebujeme foto.

---

## 3. Assety — 4 royalty-free fotky (Unsplash license)

Uživatel stáhne a uloží jako `.jpg` (quality ≈80, šířka 1920px, výška ≈720px, ratio 16:6 až 8:3, optimalizováno např. Squoosh nebo `sharp`).

| Soubor | Unsplash URL (origin) | Téma |
|---|---|---|
| `/public/images/covers/cover-1.jpg` | https://unsplash.com/photos/black-car-steering-wheel-KgaWKNtMZYo (Samuele Errico Piccarini) | Interiér / kokpit |
| `/public/images/covers/cover-2.jpg` | https://unsplash.com/photos/black-porsche-911-on-road-during-daytime-N9Pf2J656aQ (Campbell) | Auto na silnici |
| `/public/images/covers/cover-3.jpg` | https://unsplash.com/photos/parked-vehicles-QnV9HtV1rUs (Florian Olivo) | Garáž / showroom |
| `/public/images/covers/cover-4.jpg` | https://unsplash.com/photos/birds-eye-view-of-parked-vehicles-nApaSgkzaxg (Obi) | Auto z výšky / top-down |

**Licence:** Unsplash License — free commercial, no attribution required. (Doporučuji uložit attribution v `/public/images/covers/ATTRIBUTION.md` jen pro evidenci.)

**Optimalizace:** každý soubor < 200 kB (výrazně pomůže LCP, cover je `priority`).

**Fallback:** pokud uživatel nemůže/nechce stáhnout, lze první iteraci poslat s jedním `cover-default.jpg` a postupně přidávat.

---

## 4. Implementace

### 4.1 Konstanta default coverů

**Nový soubor:** `lib/profile/defaultCovers.ts`

```ts
export const DEFAULT_COVERS = [
  "/images/covers/cover-1.jpg",
  "/images/covers/cover-2.jpg",
  "/images/covers/cover-3.jpg",
  "/images/covers/cover-4.jpg",
] as const;

/**
 * Vrátí deterministicky jeden default cover podle user.id.
 * Stejný uživatel = stejná fotka při každém reloadu.
 */
export function getDefaultCover(userId: string): string {
  if (!userId) return DEFAULT_COVERS[0];
  // Součet char codes → modulo N. Stabilní napříč procesy.
  let sum = 0;
  for (let i = 0; i < userId.length; i++) {
    sum = (sum + userId.charCodeAt(i)) % 1000;
  }
  return DEFAULT_COVERS[sum % DEFAULT_COVERS.length];
}
```

### 4.2 Úprava `ProfileClient.tsx` (řádky 244–254)

```tsx
// nahoře v komponentě (před return):
const coverSrc = user.coverPhoto || getDefaultCover(user.id);
const [coverError, setCoverError] = useState(false);

// v render bloku:
<div className="relative h-56 sm:h-72 md:h-96 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 overflow-hidden">
  {!coverError && (
    <Image
      src={coverSrc}
      alt="Cover"
      fill
      sizes="100vw"
      className="object-cover"
      priority
      onError={() => setCoverError(true)}
    />
  )}
  {/* Tmavý overlay pro čitelnost textu níže (jen když máme fotku) */}
  {!coverError && (
    <div
      className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none"
      aria-hidden="true"
    />
  )}
</div>
```

**Import nahoře:**
```ts
import { useState } from "react";
import { getDefaultCover } from "@/lib/profile/defaultCovers";
```
(Pokud `useState` ještě není importován — je to `"use client"` komponenta, takže OK.)

### 4.3 Fallback chování

- Pokud `<Image>` selže (404, síťová chyba) → `onError` → `setCoverError(true)` → fotka se schová, zůstane původní oranžový gradient jako safety net.
- Pokud user **má** `coverPhoto` a ten selže → stejný fallback na oranžový gradient (drobné vylepšení vs. dnešní stav, kde rozbitý cover pokračuje hruběji).

---

## 5. Soubory k úpravě

| Akce | Soubor | Poznámka |
|---|---|---|
| **Nový** | `lib/profile/defaultCovers.ts` | helper + konstanta |
| **Upravit** | `app/(web)/profil/[slug]/ProfileClient.tsx` (řádky ~244–254, + importy) | render blok + error state |
| **Přidat assets** | `public/images/covers/cover-1.jpg` … `cover-4.jpg` | 4× optimalizované JPG |
| **(volitelné)** | `public/images/covers/ATTRIBUTION.md` | evidence Unsplash autorů |

---

## 6. Akceptační kritéria

1. Makléř s `user.coverPhoto = null` na `/profil/[slug]` vidí automotive fotku (ne oranžový gradient) s jemným tmavým overlay nahoře.
2. Stejný makléř při 10 různých reloadech vidí **tu samou** default fotku (deterministic podle `user.id`).
3. Různí makléři (různá `user.id`) dostanou rozložené defaulty — minimálně 2 různé fotky napříč 4+ testovanými profily.
4. Makléř s vlastním `coverPhoto` vidí svoji fotku (regrese: beze změny oproti dnešku).
5. Pokud `<Image>` selže (404/network) → fallback na původní oranžový gradient bez rozbitého layoutu (žádný broken-image ikonka).
6. Lighthouse LCP pro `/profil/[slug]` se nezhorší o více než +100 ms (cover < 200 kB, priority hint zachován).
7. Žádné CSP violations v konzoli (Report-Only header) — asset je `self`.

---

## 7. STOP & ESCALATE

- Pokud uživatel **nemá k dispozici 4 fotky** → zastavit, zeptat se, jestli stačí 1–2 a přizpůsobit `DEFAULT_COVERS` array (modulo funguje i s N=1).
- Pokud by přišel požadavek na externí Unsplash URL přímo (ne lokální) → STOP, CSP by to blokla v enforce módu, potřeba upravit next.config.ts `img-src` PRVNÍ.

---

## 8. Odhad

- Čas: 30 min kód + 15 min optimalizace fotek (ze strany uživatele).
- Riziko: nízké (isolated change, deterministic test, fallback na status quo).
