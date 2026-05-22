# IMPL: SSR migrace Fáze 2 — Web layouts + kariera (3 soubory)

**Datum:** 2026-05-07
**Commit:** `b3af53d`
**Status:** HOTOVO

## Změny

### Nové client components (components/web/)
| Soubor | Export | Důvod client |
|--------|--------|-------------|
| `AccountSidebarNav.tsx` | `AccountSidebarNav` | `usePathname()` pro active nav |
| `InzeratyNav.tsx` | `InzeratyNav` | `usePathname()` pro active nav |
| `ScrollToFormButton.tsx` | `ScrollToFormButton` | `onClick` scroll handler |

### Migrované soubory
| Soubor | Typ | Změny |
|--------|-----|-------|
| `(web)/muj-ucet/layout.tsx` | Layout → SSR | Odebráno "use client", usePathname, cn, navItems. Přidán import AccountSidebarNav. |
| `(web)/moje-inzeraty/layout.tsx` | Layout → SSR | Odebráno "use client", usePathname, cn, navItems. Přidán import InzeratyNav. |
| `(web)/kariera/page.tsx` | Page → SSR | Odebráno "use client" + Button import. Přidáno metadata + canonical + ScrollToFormButton. |

### Kariera metadata
```tsx
export const metadata: Metadata = {
  title: "Kariéra",
  description: "Staňte se automakléřem...",
  openGraph: { title: "Kariéra | CarMakléř", ... },
  alternates: pageCanonical("/kariera"),
};
```

## Ověření
- **Build:** OK (0 errors)
- **Lint:** OK (0 errors, 684 pre-existing warnings)
