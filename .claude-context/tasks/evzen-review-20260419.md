# Evžen Review — 2026-04-19
## Kontrola implementace vůči zadání uživatele

---

### REQ-1: BrokerCard — IG styl
**"tyhle kartičky jdou taky podle me udělat více jako IG styl"**

**PASS** ✅

`components/web/BrokerCard.tsx`:
- Centrovaný layout (items-center, text-center)
- Gradient oranžový ring kolem avataru
- Stats row (Prodejů / Vozidel / Specializací) — identická struktura jako IG
- Bio (line-clamp-2, centered)
- Tag pills pod biem
- CTA tlačítko "Zobrazit profil" (oranžové)

---

### REQ-2: Avatar kulatý + oranžový rámeček
**"udelej to PM jak tam je v oranzovym ramečku at je to kulate"**

**PASS** ✅

Řádky 56–68 v BrokerCard.tsx:
```tsx
<div className="p-[3px] rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-sm">
  <img ... className="w-20 h-20 rounded-full object-cover border-[3px] border-white" />
```
- Outer wrapper: `rounded-full` ✅
- Gradient: `from-orange-400 via-orange-500 to-orange-600` ✅
- Img: `rounded-full` ✅
- White border separating ring from photo ✅

---

### REQ-3: Logo menší v Navbar
**"je potřeba zmenšit logo na webu nahoře"**

**PASS** ✅

`components/main/Navbar.tsx` řádek 98:
```tsx
className="h-6 sm:h-8 w-auto object-contain"
```
Vs. původní `h-10 sm:h-12` → logo je znatelně menší. ✅

---

### REQ-4: Logo menší ve Footeru + Platformy vycentrované
**"je potřeba udelat logo nahoře menší v menu a ve footeru"**
**"Platformy Carmakler jak tam jsou muže to bejt lepší trošku no třeba uprostřed"**

**PASS** ✅

`components/common/FooterBase.tsx`:
- Logo: `className="h-8 w-auto object-contain"` (řádek 68) ✅
- Platformy sekce (řádek 234): `<div className="mt-12 pt-8 border-t border-gray-700/50 text-center">` ✅
- PlatformSwitcher footer variant (PlatformSwitcher.tsx řádek 124): `flex flex-wrap items-center justify-center gap-3` ✅

---

### REQ-5: weblyx.cz credit ve footeru
**"dole že web delal weblyx.cz"**

**PASS** ✅

`components/common/FooterBase.tsx` řádky 280–285:
```tsx
<div className="text-center mt-4 text-xs text-gray-700">
  Web vytvořil{" "}
  <a href="https://weblyx.cz" target="_blank" rel="noopener noreferrer" ...>
    weblyx.cz
  </a>
</div>
```
Přesný text "Web vytvořil weblyx.cz" s externím odkazem. ✅

---

### REQ-6: Homepage používá BrokerCard (ne staré inline karty)
(Interní kontrola konzistence)

**PASS** ✅

`app/(web)/page.tsx`:
- Import: `import { BrokerCard, type BrokerCardBroker } from "@/components/web/BrokerCard";`
- Použití: `<BrokerCard key={broker.slug} broker={broker} />`
- Helper funkce `getFeaturedBrokers()` vrací `BrokerCardBroker[]`

---

### REQ-7: CSP povoluje Unsplash
**next.config.ts**

**PASS** ✅

- `img-src` obsahuje `https://images.unsplash.com` (řádek 30) ✅
- `images.remotePatterns` obsahuje `images.unsplash.com` (řádek 82) ✅

---

### REQ-8: Produkce + /nabidka funkčnost
**"nasad to všechno na produkci"** + **"katalog vozidel na produkci nefunguje"**

**NELZE OVĚŘIT ze souborů** ⚠️

Toto jsou produkční deployment požadavky — nelze ověřit ze zdrojového kódu.
Nutné ověření: přístup na carmakler.cz + test /nabidka live.

---

## Souhrn

| # | Požadavek | Výsledek |
|---|-----------|----------|
| 1 | BrokerCard IG styl | ✅ PASS |
| 2 | Avatar kulatý + oranžový ring | ✅ PASS |
| 3 | Logo menší — Navbar | ✅ PASS |
| 4 | Logo menší — Footer + Platformy centered | ✅ PASS |
| 5 | weblyx.cz credit | ✅ PASS |
| 6 | Homepage používá BrokerCard | ✅ PASS |
| 7 | CSP Unsplash | ✅ PASS |
| 8 | Produkce + /nabidka live | ⚠️ NELZE OVĚŘIT |

**Celkem: 7/7 kódových požadavků PASS. Produkční nasazení a funkčnost /nabidka vyžadují manuální ověření na carmakler.cz.**
