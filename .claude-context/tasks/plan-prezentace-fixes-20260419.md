# Fix plán: 3 QA nálezy na /prezentace

**Vytvořeno:** 2026-04-19
**Zdroj:** QA kontrola prezentace (task #6)
**Soubor:** `app/prezentace/page.tsx`

---

## NÁLEZ-1 (střední): ?manager=slug nefetchuje data manažera

### Problém
Řádky 390-401: `managerSlug` se pouze transformuje regex replacem (`slug → Title Case`), ale nikdy se nefetchuje z API. Výsledek: zobrazí se jen jméno odvozené ze slug (např. "Jan Novak"), ale **chybí telefon a email manažera**.

### Aktuální kód (řádky 390-401)
```tsx
{managerSlug && (
  <div className="bg-white/10 ...">
    <div className="text-sm text-gray-400 mb-1">Váš kontaktní manažer</div>
    <div className="text-xl font-bold text-orange-500">
      {managerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </div>
  </div>
)}
```

### Existující API
`GET /api/profile/[slug]` (`app/api/profile/[slug]/route.ts`) — vrací `user.firstName`, `user.lastName`, `user.phone`, `user.email`. **Ale** phone/email závisí na `showPhone`/`showEmail` flagách uživatele (řádky 136-137).

### Řešení

**Přidat state + useEffect fetch do `PrezentaceContent`:**

1. Přidat state pro manažera:
```tsx
const [manager, setManager] = useState<{
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
} | null>(null);
```

2. Přidat useEffect s fetchem:
```tsx
useEffect(() => {
  if (!managerSlug) return;
  fetch(`/api/profile/${managerSlug}`)
    .then((r) => r.ok ? r.json() : null)
    .then((data) => {
      if (data?.user) setManager(data.user);
    })
    .catch(() => {});
}, [managerSlug]);
```

3. V sekci 8 (contact) nahradit hardcoded slug transform dynamickými daty:
```tsx
{managerSlug && (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-md mx-auto">
    <div className="text-sm text-gray-400 mb-1">Váš kontaktní manažer</div>
    <div className="text-xl font-bold text-orange-500">
      {manager
        ? `${manager.firstName} ${manager.lastName}`
        : managerSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </div>
    {manager?.phone && (
      <a href={`tel:${manager.phone}`} className="flex gap-2 items-center justify-center mt-3 text-gray-300 hover:text-orange-400 transition-colors no-underline">
        <span>📞</span>
        <span>{manager.phone}</span>
      </a>
    )}
    {manager?.email && (
      <a href={`mailto:${manager.email}`} className="flex gap-2 items-center justify-center mt-2 text-gray-300 hover:text-orange-400 transition-colors no-underline">
        <span>✉️</span>
        <span>{manager.email}</span>
      </a>
    )}
  </div>
)}
```

### Úpravy
- **Soubor:** `app/prezentace/page.tsx`
- **Řádky:** ~87 (přidat state), ~104 (přidat useEffect), ~390-401 (nahradit rendering)
- **Žádné nové soubory, žádné nové API** — použít existující `/api/profile/[slug]`

### STOP pravidlo
- **STOP-1:** Pokud manažer nemá `showPhone: true` / `showEmail: true`, API vrátí `null`. To je OK — zobrazí se jen jméno. Ale pokud je to problém pro business (manažeři vždy chtějí zobrazovat kontakt v prezentaci), eskalovat → může být potřeba endpoint, který pro role MANAGER/ADMIN vždy vrací kontakt bez showPhone gatingu.

### Acceptance Criteria
- [ ] `?manager=jan-novak` zobrazí jméno fetchnuté z API (ne jen slug transform)
- [ ] Telefon a email manažera se zobrazují pokud jsou dostupné
- [ ] Fallback na slug transform pokud fetch selže nebo user neexistuje
- [ ] Bez `?manager` se manažerský blok nezobrazí (stávající chování)

---

## NÁLEZ-2 (střední): QR kód v sekci 8 chybí

### Problém
TASK-031 spec (řádek 4159) vyžaduje: "QR kód (odkaz na registraci/kontakt)". Stránka nemá žádný QR kód ani fallback odkaz na registraci partnera.

### Řešení

Přidat CTA odkaz pod kontaktní informace v sekci 8. **QR kód pomocí `qrcode.react`** je nice-to-have, ale hlavní je mít funkční odkaz.

**Varianta A (minimální — doporučená):**
Přidat tlačítko/odkaz pod kontaktní box:

```tsx
<a
  href="/kontakt"
  className="inline-flex items-center gap-2 mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-colors no-underline"
>
  Registrovat se jako partner &rarr;
</a>
```

**Varianta B (plná — pokud chceme QR):**
1. `npm install qrcode.react`
2. Přidat pod CTA tlačítko:
```tsx
import { QRCodeSVG } from "qrcode.react";

<div className="mt-6 flex flex-col items-center">
  <QRCodeSVG
    value="https://carmakler.cz/kontakt"
    size={120}
    bgColor="transparent"
    fgColor="#ffffff"
    level="M"
  />
  <p className="text-xs text-gray-500 mt-2">Naskenujte pro kontakt</p>
</div>
```

### Doporučení
Implementovat **variantu A** jako základ. Varianta B je bonus — implementátor rozhodne podle složitosti.

### Úpravy
- **Soubor:** `app/prezentace/page.tsx`
- **Řádky:** ~430 (za kontaktní box, před copyright)
- **Volitelně:** `npm install qrcode.react` pro variantu B

### STOP pravidlo
- **STOP-2:** Pokud `qrcode.react` způsobí build problém → použít variantu A (jen odkaz)
- **STOP-3:** Pokud neexistuje route `/kontakt` → použít `/` nebo `mailto:partneri@carmakler.cz`

### Acceptance Criteria
- [ ] Sekce 8 obsahuje CTA odkaz/tlačítko pro partnerskou registraci
- [ ] Odkaz vede na funkční stránku (/kontakt nebo equivalent)
- [ ] (Bonus) QR kód se zobrazuje a skenuje správně

---

## NÁLEZ-3 (nízká): <img> místo <Image /> na logo

### Problém
Řádek 119: `<img src="/brand/logo-color.png" ...>` — lint warning, Next.js doporučuje `next/image` `<Image />` komponentu pro optimalizaci.

### Řešení

Nahradit `<img>` za `<Image>` z `next/image`:

```tsx
import Image from "next/image";

// Řádek 119:
<Image
  src="/brand/logo-color.png"
  alt="CarMakléř"
  width={200}
  height={80}
  className="h-20 w-auto mx-auto mb-8 brightness-0 invert"
  priority
/>
```

### Úpravy
- **Soubor:** `app/prezentace/page.tsx`
- **Řádek 4:** přidat `import Image from "next/image";`
- **Řádek 119-122:** nahradit `<img>` za `<Image>`

### Poznámky
- `priority` protože logo je above-the-fold v první sekci
- `width`/`height` jsou povinné pro `Image` — použít skutečné rozměry loga (ověřit soubor)
- `className` se přenáší 1:1

### STOP pravidlo
- Žádný — přímočará oprava

### Acceptance Criteria
- [ ] Žádný ESLint warning pro `<img>`
- [ ] Logo se zobrazuje identicky jako před opravou
- [ ] `npm run build` projde bez chyb

---

## Pořadí implementace

1. **NÁLEZ-3** (img → Image) — 1 min, čistý fix
2. **NÁLEZ-2** (CTA odkaz) — 2 min, přidat odkaz + volitelně QR
3. **NÁLEZ-1** (manager fetch) — 5 min, přidat state + useEffect + upravit rendering

Všechny 3 fixy jsou v jednom souboru (`app/prezentace/page.tsx`), mohou jít do jednoho commitu.
