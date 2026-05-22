# Implementace P1-02: Sjednotit wantBrokerHelp / wantsBrokerHelp

**Status:** HOTOVO
**Datum:** 2026-04-04
**Implementator:** Claude Agent

---

## Co bylo udelano

Sjednocene pojmenovani pole na `wantsBrokerHelp` v celem kodu. Odstraneno duplicitni pole z Zod schema a fallback workaround z API route.

### Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `components/web/listing-form/ListingFormWizard.tsx` | r.59: `wantBrokerHelp: boolean` -> `wantsBrokerHelp: boolean`, r.109: default `false`, r.176: `data.wantsBrokerHelp` |
| `components/web/listing-form/Step5PriceContact.tsx` | r.180-181: `data.wantBrokerHelp` -> `data.wantsBrokerHelp`, `update("wantsBrokerHelp", ...)` |
| `components/web/listing-form/Step6Preview.tsx` | r.195: `data.wantBrokerHelp` -> `data.wantsBrokerHelp` |
| `app/api/listings/route.ts` | r.59: odstranen `wantBrokerHelp: z.boolean().optional()`, r.77-78: odstranen fallback workaround `data.wantsBrokerHelp \|\| data.wantBrokerHelp \|\| false` -> `data.wantsBrokerHelp` |

### Verifikace

Grep `wantBrokerHelp` (bez "s") v `*.{ts,tsx}` vraci 0 vysledku -- pole je konzistentne sjednoceno na `wantsBrokerHelp` v celem projektu.

## Overeni

- [x] ListingFormWizard.tsx -- typ, default, submit body opraveny
- [x] Step5PriceContact.tsx -- checkbox checked + onChange opraveny
- [x] Step6Preview.tsx -- podminka pro zobrazeni opravena
- [x] API route -- duplicitni pole odstraneno, fallback odstranen
- [x] Grep `wantBrokerHelp` (bez "s") = 0 vysledku v .ts/.tsx souborech
