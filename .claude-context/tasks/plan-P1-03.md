# Plan P1-03: Inzerce katalog — redirect misto staticke stranky

**Priorita:** P1
**Slozitost:** S
**Zavislosti:** ZADNE
**Batch:** 1

---

## Cil

Nahradit statickou HTML stranku `/inzerce/katalog` server-side redirectem na `/nabidka`. Aktualni stav je thin-content stranka s odkazem — SEO problem (crawlery zaindexuji stranka bez obsahu).

---

## Analyza stavajiciho kodu

**Soubor:** `app/(web)/inzerce/katalog/page.tsx` (21 radku)

Aktualni stav:
```tsx
export default function InzerceKatalogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Nabidka vozidel</h1>
      <p className="text-gray-500 mb-8">Vsechny inzeraty najdete v hlavni nabidce vozidel.</p>
      <Link href="/nabidka">
        <Button variant="primary" size="lg">Zobrazit nabidku</Button>
      </Link>
    </div>
  );
}
```

Toto je thin content — stranka neobsahuje zadna data, jen odkaz. Google ji muze penalizovat.

---

## Kroky implementace

### Krok 1: Nahradit stranku permanentnim redirectem

**Soubor:** `app/(web)/inzerce/katalog/page.tsx` — KOMPLETNI PREPIS

```tsx
import { redirect } from "next/navigation";

export default function InzerceKatalogPage() {
  redirect("/nabidka");
}
```

**Nebo alternativne pres Next.js redirects v next.config.ts:**

```ts
// next.config.ts — v redirects sekci:
{
  source: "/inzerce/katalog",
  destination: "/nabidka",
  permanent: true, // 308 redirect
}
```

**Doporuceni:** Pouzit `redirect()` v page.tsx protoze je jednodussi a zachova existujici souborovou strukturu. Alternativne next.config.ts redirect je cislejsi pro SEO (308 se vraci jiz na urovni serveru, ne az po renderovani).

### Krok 2: Smazat metadata export

Aktualni `metadata` export (title, description) uz neni potreba — stranka se nikdy nerenderuje.

### Krok 3: Volitelne — smazat loading.tsx pokud existuje

Pokud existuje `app/(web)/inzerce/katalog/loading.tsx`, smazat — redirect nepotrebuje loading state.

---

## Finalni podoba souboru

**Soubor:** `app/(web)/inzerce/katalog/page.tsx`
```tsx
import { redirect } from "next/navigation";

// /inzerce/katalog → permanentni redirect na /nabidka
// Puvodni thin-content stranka nahrazena redirectem pro SEO
export default function InzerceKatalogPage() {
  redirect("/nabidka");
}
```

---

## Soubory k uprave

| Soubor | Zmena |
|--------|-------|
| `app/(web)/inzerce/katalog/page.tsx` | KOMPLETNI PREPIS — redirect misto staticke stranky |

## Overeni

- [ ] Navsteva /inzerce/katalog presmeruje na /nabidka (HTTP 307/308)
- [ ] Zadna thin-content stranka se nerenderuje
- [ ] /nabidka funguje spravne (zobrazuje katalog vozidel)
- [ ] Build prochazi
