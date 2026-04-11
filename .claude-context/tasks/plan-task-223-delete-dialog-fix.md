# Plan Task #223 — Fix DeletePartDialog z-index bug

**Type:** Chirurgický fix
**Input:** test-chrome #221 T5 FAIL
**Date:** 2026-04-11
**Planner:** planovac (plan-only mode)

---

## §0 Executive summary

`DeletePartDialog` (z-50) a `SupplierBottomNav` (z-50) mají stejný z-index. Bottom nav je v layout.tsx a renderuje se jako sibling — při stejném z-indexu překryje spodní část dialogu (tlačítka "Zrušit" a "Smazat").

**Fix:** Bump dialog overlay z `z-50` na `z-[60]`. Jeden řádek, jeden soubor.

Toto je konzistentní s existující konvencí — `components/pwa/GlobalSearch.tsx:106` už používá `z-[60]` pro svůj modal overlay.

---

## §1 Root cause

### §1.1 Z-index mapa (relevantní vrstvy v PWA Díly)

```
z-[100]  parts/new/layout.tsx — fullscreen wizard overlay
z-[60]   pwa/GlobalSearch.tsx — search modal overlay  ← precedent
z-50     SupplierTopBar.tsx — fixed top header
z-50     SupplierBottomNav.tsx — fixed bottom nav      ← BLOCKS dialog
z-50     DeletePartDialog.tsx — modal overlay           ← BUG: same layer
```

Při `z-50` vs `z-50` rozhoduje DOM pořadí. Layout renderuje:
```tsx
// app/(pwa-parts)/layout.tsx
<OnlineStatusProvider>
  <SupplierTopBar />    {/* z-50 */}
  <OfflineBanner />
  {children}            {/* DeletePartDialog lives here */}
  <SupplierBottomNav /> {/* z-50 — after children → paints on top */}
</OnlineStatusProvider>
```

Bottom nav je DOM-later → overlaps dialog buttons.

### §1.2 Proč cancel button nefunguje

Dialog structure (`DeletePartDialog.tsx:39-82`):
```
fixed inset-0 z-50 (overlay container)
  ├── absolute inset-0 bg-black/50 (backdrop)
  └── relative bg-white rounded-2xl (card)
       └── div.text-center
            ├── icon + title + description
            └── flex gap-3 (buttons at BOTTOM of card)
                ├── "Zrušit" button
                └── "Smazat" button
```

Buttons jsou ve spodní části karty. Na mobilním viewportu (kde PWA Díly primárně běží) se karta centruje vertikálně → tlačítka končí blízko dolní hrany → bottom nav (64px výška) je překryje.

---

## §2 Fix plan

### Commit 1 — Jedna změna, jeden soubor

**File:** `components/pwa-parts/parts/DeletePartDialog.tsx`
**Line:** 39
**Change:**

```diff
- <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
+ <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
```

**That's it.**

### Proč `z-[60]` a ne `z-[51]` nebo `z-[100]`

- `z-[60]` = existing convention for modal overlays (`GlobalSearch.tsx:106`)
- `z-[51]` = works but no precedent, ad-hoc
- `z-[100]` = reserved for fullscreen wizard layouts (`parts/new/layout.tsx`)
- `z-[99]` = reserved for sidebar backdrops (`AdminSidebar`, `PartnerLayout`)

Z-index hierarchy after fix:
```
z-[9999] MobileMenu (fullscreen, nuclear)
z-[100]  Fullscreen wizard layouts, sidebars, cookie consent
z-[99]   Sidebar backdrops
z-[60]   Modal overlays (GlobalSearch, DeletePartDialog) ← FIX
z-50     Persistent UI (navbars, top bars, bottom navs)
```

---

## §3 Rejected alternatives

### Alt A: `inert` attribute on bottom nav
```tsx
<SupplierBottomNav inert={dialogOpen} />
```
- Requires prop drilling from page → layout (dialog state lives in page component)
- Or React context — overkill for z-index fix
- **Rejected:** Disproportionate complexity for a one-line CSS fix

### Alt B: `pointer-events-none` on `.text-center` wrapper
- Test-chrome mentioned `div.text-center` intercepting pointer events
- This is a secondary symptom, not root cause — even with pointer-events fix, the visual overlap remains
- **Rejected:** Treats symptom, not disease

### Alt C: Move buttons higher up in dialog (more padding)
- Would work for current viewport but fragile — different screen sizes could reintroduce the overlap
- **Rejected:** Band-aid, not a fix

---

## §4 File manifest

| File | Action | Lines changed |
|------|--------|---------------|
| `components/pwa-parts/parts/DeletePartDialog.tsx` | EDIT line 39 | 1 |

**Total diff: 1 line.**

---

## §5 STOP rules for implementator

### STOP-1: Do NOT edit SupplierBottomNav.tsx
Bottom nav z-50 is correct — it matches TopBar (also z-50) and all other persistent nav in the project. The dialog is the one that should be higher.

### STOP-2: Do NOT add React context or prop drilling for `inert`
A z-index bump is the right fix. No architecture changes for a CSS stacking issue.

### STOP-3: Do NOT change dialog positioning or padding
`flex items-center justify-center p-4` is correct centering. The overlap is a z-index issue, not a positioning issue.

### STOP-4: Do NOT change other dialogs in this commit
`ManagerApprovalActions.tsx:88` and `NewLeadsSection.tsx:181` have the same z-50 pattern but are in different PWA contexts (admin, makler) where bottom nav may not conflict. If lead wants those fixed too, separate task.

### STOP-5: Escalation
If test-chrome still reports T5 FAIL after this fix → the root cause is NOT z-index. In that case capture: (1) computed z-index from DevTools, (2) exact viewport height, (3) dialog card bounding rect. Escalate to planovac.

---

## §6 Acceptance criteria

- [ ] Open DeletePartDialog on mobile viewport (375×667)
- [ ] Both buttons ("Zrušit" + "Smazat") are fully visible above bottom nav
- [ ] "Zrušit" click closes dialog (no pointer-events blocking)
- [ ] "Smazat" click triggers delete (no pointer-events blocking)
- [ ] Dialog backdrop (black/50) covers bottom nav
- [ ] Bottom nav returns to normal after dialog closes

---

## §7 Collateral note

Two other modal overlays in the codebase use `z-50` and may have similar issues in their respective contexts:

| File | Line | Context |
|------|------|---------|
| `components/admin/ManagerApprovalActions.tsx` | 88 | Admin — no bottom nav in admin layout, likely OK |
| `components/pwa/dashboard/NewLeadsSection.tsx` | 181 | Makler PWA — has BottomNav z-50, **potential same bug** |

Lead may want to file a separate follow-up task for `NewLeadsSection.tsx` (makler PWA uses `BottomNav` z-50 too).

---

## §8 Commit message

```
fix(parts): bump DeletePartDialog z-index above bottom nav (#223)
```
