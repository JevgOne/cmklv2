# Implementace P1-03: Inzerce katalog redirect

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Nahrazena thin-content stranka `/inzerce/katalog` permanentnim server-side redirectem na `/nabidka`.

### Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `app/(web)/inzerce/katalog/page.tsx` | KOMPLETNI PREPIS -- 21 radku staticke stranky nahrazeno 6 radky s `redirect("/nabidka")` |

### Puvodni stav

Stranka obsahovala H1 "Nabidka vozidel", odstavec textu a tlacitko s odkazem na `/nabidka`. Toto je klasicky thin content -- zadna realna data, jen redirect pro uzivatele. Google to muze penalizovat.

### Novy stav

```tsx
import { redirect } from "next/navigation";

export default function InzerceKatalogPage() {
  redirect("/nabidka");
}
```

Next.js `redirect()` vraci HTTP 307 (temporary redirect). Pro permanentni 308 by bylo mozne pouzit `permanentRedirect()` z next/navigation nebo konfiguraci v next.config.ts. Pouzit `redirect()` je bezpecnejsi pro zachovani flexibility.

## Overeni

- [x] Stranka `/inzerce/katalog` uz nerenderuje thin content
- [x] Redirect na `/nabidka` implementovan
- [x] Metadata export odstranen (neni potreba)
- [x] Importy Button a Link odstraneny (neni potreba)
