# Plan: BrokerCard Instagram-style Redesign

**Status:** READY FOR IMPLEMENTATION  
**File:** `components/web/BrokerCard.tsx`  
**Dependencies:** `Badge`, `TagPill`, existing design tokens (no new CSS needed)

---

## Visual Layout (ASCII)

```
┌──────────────────────────────────┐
│                                  │
│           ╭──────────╮           │
│          ╱  gradient   ╲         │  ← 3px gradient ring
│         │   ┌──────┐    │        │     (orange-400 → orange-600)
│         │   │avatar │    │        │
│         │   │ 80×80 │    │        │
│         │   └──────┘    │        │
│          ╲             ╱         │
│           ╰──────────╯           │
│                                  │
│         Jan Novák                │  ← text-lg font-bold centered
│     [TOP Makléř] · Praha         │  ← Badge + dot + city
│                                  │
│ ─────────────────────────────── │
│     12     │     5     │    3    │  ← font-bold text-base
│   Prodejů  │  Vozidel  │ Spec.  │  ← text-[11px] text-gray-500
│ ─────────────────────────────── │
│                                  │
│   Specializuji se na prémiová    │  ← text-sm text-gray-500
│   vozidla a sportovní vozy...    │     line-clamp-2, centered
│                                  │
│    #SUV  #Prémiová  #Elektro     │  ← TagPill sm/muted, centered
│                                  │
│ ┌──────────────────────────────┐ │
│ │      Zobrazit profil         │ │  ← orange-500 full-width CTA
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │      Kontaktovat             │ │  ← border outline, conditional
│ └──────────────────────────────┘ │
│                                  │
└──────────────────────────────────┘
```

---

## Detailed JSX Structure with Tailwind Classes

### 1. Card Container

```tsx
<article className="rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden group">
```

**What changed vs current:**
- `rounded-xl` → `rounded-2xl` (softer, more modern)
- Removed `border border-gray-200 hover:border-orange-300` — rely on shadow instead (cleaner IG look)
- Added `hover:-translate-y-1` lift effect
- Added `duration-300` for smooth transition
- Using design system `shadow-card` / `shadow-card-hover` tokens
- Added `overflow-hidden` for clean edges

### 2. Avatar Section (centered, gradient ring)

```tsx
<div className="flex flex-col items-center pt-6 px-5">
  {/* Gradient ring wrapper */}
  <div className="p-[3px] rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-sm">
    {broker.avatar ? (
      <img
        src={broker.avatar}
        alt={`${broker.firstName} ${broker.lastName}`}
        className="w-20 h-20 rounded-full object-cover border-[3px] border-white"
      />
    ) : (
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-[3px] border-white flex items-center justify-center text-orange-500 font-extrabold text-xl">
        {initials}
      </div>
    )}
  </div>
```

**Design notes:**
- **Gradient ring:** `p-[3px]` creates a 3px gradient border around the avatar, mimicking the IG stories ring. Uses `from-orange-400 via-orange-500 to-orange-600`.
- **White gap:** `border-[3px] border-white` on inner image creates the characteristic white gap between ring and photo.
- **Fallback avatar:** Instead of orange-on-orange (current), use gray bg with orange text initials — ensures the gradient ring remains visible and distinct from the fallback circle.
- **Size:** Keeping `w-20 h-20` (80px) — large enough to be avatar-centric without dominating the card.
- `shadow-sm` on ring wrapper adds subtle depth.

### 3. Name + Level + City (centered)

```tsx
  <h3 className="mt-3 text-lg font-bold text-gray-900 truncate max-w-full text-center">
    {broker.firstName} {broker.lastName}
  </h3>

  <div className="flex items-center gap-1.5 mt-1">
    <Badge variant={broker.level === "TOP" || broker.level === "SENIOR" ? "top" : "verified"}>
      {LEVEL_LABEL[broker.level] ?? "Makléř"}
    </Badge>
    {primaryCity && (
      <>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-500">{primaryCity}</span>
      </>
    )}
  </div>
</div>
```

**Design notes:**
- Everything centered (IG style), not left-aligned
- Name: `text-lg font-bold text-gray-900` — prominent
- Badge stays unchanged (reuses existing `Badge` component)
- City: separated by a middle dot `·`, subtle `text-xs text-gray-500`
- `truncate max-w-full` prevents long names from breaking layout

### 4. Stats Row (IG signature — 3 columns with dividers)

```tsx
<div className="grid grid-cols-3 divide-x divide-gray-100 mt-4 py-3 mx-5 border-y border-gray-100">
  <StatCell value={broker.totalSales} label="Prodejů" />
  <StatCell value={broker.activeVehicles} label="Vozidel" />
  <StatCell value={broker.tags.length} label="Specializací" />
</div>
```

**StatCell inline helper** (inside the component, NOT extracted to a separate file):

```tsx
function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-base font-bold text-gray-900">
        {value > 0 ? value : "—"}
      </span>
      <span className="text-[11px] text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}
```

**Design notes:**
- Classic IG 3-column stats with `divide-x` vertical dividers
- `border-y border-gray-100` creates horizontal separator lines above and below
- `mx-5` — stats row indented same as content padding
- Zero handling: `value > 0 ? value : "—"` — shows em dash for zeros (graceful, not "0")
- Third stat uses `tags.length` as "Specializací" — meaningful broker metric
- `text-base font-bold` for numbers (prominent), `text-[11px]` for labels (very subtle)

### 5. Bio Text (centered, clamped)

```tsx
{broker.bio && (
  <p className="text-sm text-gray-500 line-clamp-2 mt-3 px-5 text-center">
    {broker.bio}
  </p>
)}
```

**Design notes:**
- Centered text (`text-center`) — matches overall centered card layout
- `text-gray-500` — lighter than current `text-gray-600` for more IG-like subtlety
- `line-clamp-2` — max 2 lines, ellipsis
- `px-5` — consistent with card padding

### 6. Tags (centered pills)

```tsx
{visibleTags.length > 0 && (
  <div className="flex flex-wrap justify-center gap-1.5 mt-3 px-5">
    {visibleTags.map((t) => (
      <TagPill key={t.slug} slug={t.slug} label={t.label} size="sm" variant="muted" />
    ))}
    {hiddenCount > 0 && (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs text-gray-400 rounded-full bg-gray-50">
        +{hiddenCount}
      </span>
    )}
  </div>
)}
```

**Design notes:**
- Added `justify-center` to center the tag row (vs left-aligned in current)
- Reuses `TagPill` with existing `sm` + `muted` variants — no changes needed
- `maxTags = 3` stays the same
- Overflow indicator color softened to `text-gray-400` (more subtle)

### 7. CTA Buttons (full-width, stacked)

```tsx
<div className="mt-auto pt-4 px-5 pb-5 flex flex-col gap-2">
  <Link
    href={`/profil/${broker.slug}`}
    className="w-full inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm no-underline transition-colors"
  >
    Zobrazit profil
  </Link>
  {broker.phone && broker.showPhone && (
    <a
      href={`tel:${broker.phone}`}
      className="w-full inline-flex items-center justify-center border border-gray-200 hover:border-orange-300 hover:text-orange-600 text-gray-600 font-medium py-2.5 rounded-xl text-sm no-underline transition-colors"
      aria-label={`Zavolat ${broker.firstName} ${broker.lastName}`}
    >
      Kontaktovat
    </a>
  )}
</div>
```

**Design notes:**
- **Full-width stacked** (vs side-by-side in current) — stronger IG CTA pattern
- `rounded-xl` instead of `rounded-full` — matches card's rounded aesthetic better
- `py-2.5` — slightly taller touch target
- Primary CTA: same orange, no changes
- Secondary: `border-gray-200` (softer than current `border-gray-300`), hover transitions to orange accent
- `mt-auto` pushes buttons to bottom of card (ensures consistent height across cards in grid)
- `pb-5` bottom padding

---

## Color Palette Used (all from design system)

| Token | Usage |
|-------|-------|
| `orange-400/500/600` | Avatar gradient ring, CTA button, badge |
| `gray-900` | Name text, stat numbers |
| `gray-500` | City, bio, stat labels |
| `gray-400` | Hidden tags count |
| `gray-300` | Middle dot separator |
| `gray-200` | Secondary button border |
| `gray-100` | Stats dividers, stat row borders |
| `gray-50` | Hidden count badge bg |
| `white` | Card background, avatar ring gap |
| `shadow-card` | Card resting state |
| `shadow-card-hover` | Card hover state |

**No new CSS variables or custom styles needed.** Everything uses existing Tailwind utilities and design tokens from `globals.css`.

---

## Zero / Empty State Handling

| Data | Value | Display |
|------|-------|---------|
| `totalSales` | `0` | `—` (em dash) |
| `activeVehicles` | `0` | `—` (em dash) |
| `tags.length` | `0` | `—` (em dash) + tag row hidden |
| `bio` | `null` | Section hidden (bio block not rendered) |
| `city` / `cities` | both empty | Dot + city not rendered, just badge |
| `avatar` | `null` | Initials in gray circle (gradient ring still visible) |
| `phone` / `showPhone` | falsy | "Kontaktovat" button hidden |

---

## Mobile vs Desktop Considerations

- **Card itself is fully responsive** — centered layout works at any width
- **Parent grid** (not in this component) controls columns: typically `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **Touch targets:** `py-2.5` on buttons meets 44px min-height guideline
- **Text truncation:** Name truncates on narrow cards, bio clamps to 2 lines
- **Stats row:** 3 columns with `grid-cols-3` — even at ~280px card width each column is ~80px, enough for 2-digit numbers + short labels

---

## Changes Summary (current → new)

| Aspect | Current | New (IG-style) |
|--------|---------|-----------------|
| Layout | Left-aligned, avatar + text side-by-side | Centered, avatar on top |
| Avatar | 80px, no ring | 80px + gradient ring + white gap |
| Name/Level | Left-aligned | Centered |
| Stats | Inline text "12 prodejů" | 3-column grid with dividers |
| Stats count | 2 stats (sales, vehicles) | 3 stats (+specializací) |
| Bio | Left-aligned | Centered |
| Tags | Left-aligned | Centered |
| Buttons | Side-by-side, rounded-full | Stacked full-width, rounded-xl |
| Card border | border + hover:border-orange | Shadow-only (cleaner) |
| Hover effect | border-orange + shadow-md | shadow-card-hover + -translate-y-1 lift |
| Corner radius | rounded-xl | rounded-2xl |

---

## Implementation Notes

1. **No new files** — edit only `components/web/BrokerCard.tsx`
2. **No new dependencies** — all existing (`Badge`, `TagPill`, `getInitials`, `Link`)
3. **No new CSS** — all Tailwind utilities + existing design tokens
4. **StatCell** is a local function inside the file, not a separate component
5. **Interface unchanged** — `BrokerCardBroker` and `BrokerCardProps` stay identical
6. **LEVEL_LABEL** map stays identical
7. **Accessibility:** all existing `alt`, `aria-label` attributes preserved
