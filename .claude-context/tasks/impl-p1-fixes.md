# Implementace — P1 Quick Fixes

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Zdroj:** Kontrolor P1 nálezy  
**Status:** ČEKÁ NA IMPLEMENTACI

---

## FIX 1: Partner Documents — PDF soubory neexistují

**Problém:** `app/(partner)/partner/documents/page.tsx` odkazuje na `/documents/partnerska-smlouva.pdf` a `/documents/obchodni-podminky.pdf`, ale `public/documents/` adresář NEEXISTUJE.

**Fix:** Změnit stránku — dokumenty budou ke stažení až budou nahrány adminem. Prozatím odkázat na kontakt.

### Soubor: `app/(partner)/partner/documents/page.tsx` — NAHRADIT řádky 16-38:

```typescript
const documents: DocumentItem[] = [
  {
    title: "Partnerská smlouva",
    description:
      "Vzor partnerské smlouvy pro spolupráci s Carmakler. Kontaktujte svého obchodního zástupce pro aktuální verzi.",
    href: null,
    available: false,
  },
  {
    title: "Obchodní podmínky",
    description:
      "Obchodní podmínky pro partnery platformy Carmakler. Aktuální verze je dostupná na vyžádání.",
    href: "/obchodni-podminky",
    available: true,
  },
  {
    title: "Měsíční vyúčtování",
    description:
      "Bude dostupné po prvním měsíci spolupráce. Automaticky generované.",
    href: null,
    available: false,
  },
];
```

A na **řádku 66** změnit text disabled tlačítka:

```typescript
// NAHRADIT:
                Zatim nedostupne
// ZA:
                Kontaktujte nás
```

---

## FIX 2: ShopTrustBar — SVG ikony místo text badges

**Problém:** Text-badges "Visa", "Mastercard" atd. místo ikon.

### Soubor: `components/shop/ShopTrustBar.tsx` — NAHRADIT CELÝ SOUBOR:

```tsx
/**
 * ShopTrustBar — trust signals pro shop footer.
 * Inline SVG ikony platebních metod a dopravců.
 */

const paymentMethods = [
  { key: "visa", label: "Visa", svg: <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#1A1F71"/><path d="M19.5 21h-3l1.9-11.5h3L19.5 21zm8-11.5l-2.8 7.9-.3-1.6-1-5.1s-.1-1.2-1.5-1.2h-4.7l-.1.3s1.6.3 3.4 1.4l2.8 10.8h3.1l4.8-12.5h-3.1zm12.3 8l1.5-4.2.9 4.2h-2.4zm3.6 3.5h2.8l-2.4-11.5h-2.4c-.7 0-1.2.4-1.4 1l-4.4 10.5h3.1l.6-1.7h3.8l.3 1.7zm-8.6-3.7c0-3-4.1-3.2-4.1-4.5 0-.4.4-.8 1.3-.9.9-.1 2.4.2 2.4.2l.4-2.5s-1.1-.4-2.3-.4c-2.9 0-5 1.5-5 3.7 0 1.6 1.5 2.5 2.6 3.1 1.1.5 1.5.9 1.5 1.4 0 .8-.9 1.1-1.7 1.1-1.5 0-2.8-.5-2.8-.5l-.5 2.5s1.3.5 3 .5c3.1 0 5.2-1.5 5.2-3.7" fill="#fff"/></svg> },
  { key: "mastercard", label: "Mastercard", svg: <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#252525"/><circle cx="19" cy="16" r="9" fill="#EB001B"/><circle cx="29" cy="16" r="9" fill="#F79E1B"/><path d="M24 9.4a9 9 0 0 1 3.3 6.6 9 9 0 0 1-3.3 6.6 9 9 0 0 1-3.3-6.6A9 9 0 0 1 24 9.4z" fill="#FF5F00"/></svg> },
  { key: "apple-pay", label: "Apple Pay", svg: <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#000"/><text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="9" fontFamily="system-ui" fontWeight="600">Pay</text></svg> },
  { key: "google-pay", label: "Google Pay", svg: <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#fff" stroke="#e5e7eb"/><text x="24" y="19" textAnchor="middle" fill="#5F6368" fontSize="8" fontFamily="system-ui" fontWeight="500">G Pay</text></svg> },
];

const carriers = [
  { key: "zasilkovna", label: "Zásilkovna", color: "#B9131A" },
  { key: "dpd", label: "DPD", color: "#DC0032" },
  { key: "ppl", label: "PPL", color: "#005BAA" },
  { key: "gls", label: "GLS", color: "#FFC600" },
  { key: "ceska-posta", label: "Česká pošta", color: "#003DA5" },
];

function CarrierBadge({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="rounded px-3 py-1.5 text-xs font-bold text-white shadow-sm"
      style={{ backgroundColor: color }}
      aria-label={label}
      title={label}
    >
      {label}
    </div>
  );
}

export function ShopTrustBar() {
  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Bezpečné platby
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {paymentMethods.map((pm) => (
              <div key={pm.key} aria-label={pm.label} title={pm.label}>
                {pm.svg}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">
            Dopravci
          </h4>
          <div className="flex items-center gap-2 flex-wrap">
            {carriers.map((c) => (
              <CarrierBadge key={c.key} label={c.label} color={c.color} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## FIX 3: Partner Messages — lepší popis

**Problém:** Text "Plná komunikace bude brzy k dispozici" je matoucí.

### Soubor: `app/(partner)/partner/messages/page.tsx` �� NAHRADIT řádky 25-28:

```tsx
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Notifikace</h1>
      <p className="text-gray-500 text-sm mb-6">
        Systémové notifikace o objednávkách, leadech a aktivitě na vašem účtu.
      </p>
```

---

## FIX 4: Onboarding Video — nahradit textovým průvodcem

**Problém:** "Video bude brzy dostupné" — prázdný player.

### Soubor: `app/(pwa)/makler/onboarding/training/page.tsx` — NAHRADIT řádky 43-59 (celý video blok):

```tsx
      {/* Úvodní průvodce */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Jak začít s CarMaklérem</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">1</div>
              <div>
                <p className="font-semibold">Najděte auto k prodeji</p>
                <p className="text-sm text-white/80">Inzeráty, doporučení známých, vlastní kontakty</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">2</div>
              <div>
                <p className="font-semibold">Naberte vozidlo do systému</p>
                <p className="text-sm text-white/80">VIN + fotky + popis → vše v aplikaci</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">3</div>
              <div>
                <p className="font-semibold">BackOffice schválí a publikuje</p>
                <p className="text-sm text-white/80">Kvalitní prezentace → více zájemců</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold">4</div>
              <div>
                <p className="font-semibold">Prodej a provize</p>
                <p className="text-sm text-white/80">Předání kupujícímu → provize na účet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
```

---

## FIX 5: sw.js console.log

**Problém:** `public/sw.js` je minifikovaný Serwist output — console.log je součástí build procesu.

**Fix:** Nelze manuálně editovat (minified). Správný fix je v Serwist konfiguraci:

### Soubor: `next.config.ts` nebo `serwist.config.ts` — hledat Serwist konfiguraci a přidat:

```typescript
// V Serwist/workbox konfiguraci přidat:
swMinify: true,  // mělo by strip console.log v prod buildu
```

**Alternativa:** Pokud Serwist nepodporuje strip, přidat do `package.json` build scriptu:
```json
"build": "next build && sed -i '' 's/console\\.log/void 0/g' public/sw.js"
```

**Poznámka:** Toto je nízká priorita — SW console.log je standardní u Serwist a neovlivňuje UX.

---

## Soubory k úpravě (4):

| # | Soubor | Fix |
|---|--------|-----|
| 1 | `app/(partner)/partner/documents/page.tsx` | Upravit dokumenty — odkaz na kontakt místo 404 PDF |
| 2 | `components/shop/ShopTrustBar.tsx` | Nahradit celý — SVG + brand color badges |
| 3 | `app/(partner)/partner/messages/page.tsx` | Změnit nadpis + popis |
| 4 | `app/(pwa)/makler/onboarding/training/page.tsx` | Nahradit video placeholder → textový průvodce |

## STOP kritéria

1. Partner documents nezobrazuje 404 odkazy — nedostupné docs mají "Kontaktujte nás"
2. ShopTrustBar zobrazuje barevné SVG/badge ikony místo plain textu
3. Partner messages nemá text "brzy k dispozici"
4. Onboarding nemá text "Video bude brzy dostupné" — místo toho 4-krokový průvodce
5. `npm run build` projde bez chyb

---

*Plán připraven: 2026-04-26*
