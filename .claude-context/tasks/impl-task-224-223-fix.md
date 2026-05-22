# IMPL #224 — DeletePartDialog z-50 → z-[60] fix

**Datum:** 2026-04-11
**Plan:** plan-task-223-delete-dialog-fix.md
**Commit:** `279f8fc`

---

## Změna

| Soubor | Řádek | Změna |
|--------|-------|-------|
| `components/pwa-parts/parts/DeletePartDialog.tsx` | L39 | `z-50` → `z-[60]` |

**Důvod:** BottomNav používá z-50, dialog se překrýval. z-[60] zajistí viditelnost nad navigací.

## STOP compliance
- BottomNav: 0 diff ✅
- Jiné soubory: 0 diff ✅

## Verification
- `npx tsc --noEmit` → 0 errors ✅
- 1 file, +1/-1 line ✅
