# Plan: Unify Homepage Broker Cards with IG-style BrokerCard

**Status:** Ready for implementation
**File:** `app/(web)/page.tsx`
**Component:** `components/web/BrokerCard.tsx`

---

## Decision: Reuse `BrokerCard` directly (Option A)

### Rationale

1. **Dead stats** — Homepage cards show `rating` and `avgDays` but both are ALWAYS "—" (no data source exists). Zero user value.
2. **Old design** — The dark hero header with cover photo overlay is the pre-IG style. The whole point is to adopt IG-style.
3. **DRY** — One component = one source of truth, zero maintenance divergence.
4. **BrokerCard handles everything gracefully** — empty tags (hidden), missing avatar (initials fallback), missing bio (hidden), missing phone (hidden).

### What changes

| Aspect | Before | After |
|--------|--------|-------|
| Avatar | Square 72px with initials, bottom-left overlay | Circular 80px with orange gradient ring, centered |
| Layout | Dark hero header + content below | Clean white card, centered IG-style |
| Stats | 4 cols (rating, sales, days, vehicles) — 2 always "—" | 3 cols (sales, vehicles, specializations) — all meaningful |
| Tags | None | Tag pills shown (if broker has tags) |
| CTA | Outline "Zobrazit profil" button, whole card clickable | Orange filled "Zobrazit profil" button + optional phone |
| Click target | Entire card is `<Link>` | CTA button only (avoids nested links, enables phone action) |

---

## Implementation Steps

### Step 1: Add import (line ~4)

```tsx
import { BrokerCard, type BrokerCardBroker } from "@/components/web/BrokerCard";
```

### Step 2: Rewrite `getFeaturedBrokers()` (lines 80-123)

**Replace the entire function** with:

```tsx
async function getFeaturedBrokers(): Promise<BrokerCardBroker[]> {
  try {
    const dbBrokers = await prisma.user.findMany({
      where: { role: "BROKER", status: "ACTIVE" },
      select: {
        slug: true,
        firstName: true,
        lastName: true,
        avatar: true,
        level: true,
        city: true,
        cities: true,
        bio: true,
        totalSales: true,
        phone: true,
        showPhone: true,
        tags: { select: { slug: true, label: true } },
        _count: { select: { vehicles: { where: { status: "ACTIVE" } } } },
      },
      take: 3,
      orderBy: { totalSales: "desc" },
    });

    if (dbBrokers.length > 0) {
      return dbBrokers.map((b) => ({
        slug: b.slug || "makler",
        firstName: b.firstName,
        lastName: b.lastName,
        avatar: b.avatar,
        level: b.level,
        city: b.city,
        cities: b.cities
          ? (() => { try { return JSON.parse(b.cities); } catch { return []; } })()
          : [],
        bio: b.bio,
        totalSales: b.totalSales,
        activeVehicles: b._count.vehicles,
        phone: b.phone,
        showPhone: b.showPhone,
        tags: b.tags,
      }));
    }
  } catch {
    /* DB unavailable — fall back to empty */
  }
  return [];
}
```

**Key changes vs current:**
- Return type: `BrokerCardBroker[]` instead of ad-hoc object
- Added fields: `level`, `city`, `phone`, `showPhone`, `tags`
- Removed dead fields: `rating`, `avgDays`, `initials`, `badges`, `badgeLabels`, `name`, `region`, `photo`
- Cities parsing stays the same (JSON string → string array)

### Step 3: Replace inline card JSX (lines 536-626)

**Replace** the entire `brokers.map(...)` block:

```tsx
{/* BEFORE: ~90 lines of inline card JSX */}
{/* AFTER: */}
{brokers.map((broker) => (
  <BrokerCard key={broker.slug} broker={broker} />
))}
```

This removes:
- The outer `<Link>` wrapper (BrokerCard has its own CTA link)
- The `<Card>` with dark hero header
- All inline stats/badge/avatar rendering
- ~88 lines of JSX

### Step 4: Verify — no cleanup needed

- `Card`, `Button`, `Badge` imports stay (used elsewhere on page)
- `Link` import stays (used elsewhere)
- No changes to `BrokerCard.tsx` itself

---

## STOP Thresholds

- **STOP-1:** If `getFeaturedBrokers()` query fails at build time (e.g., `tags` relation not recognized) → check that Tag relation exists in schema (it does: `tags Tag[] @relation("UserTags")` at line 156 of schema.prisma)
- **STOP-2:** If the section looks visually broken after swap → the grid container (`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8`) stays unchanged; BrokerCard has `h-full` so cards align

---

## Verification

1. `npm run build` — must pass (no type errors)
2. Visual check: homepage "TOP Makleri" section shows IG-style cards with circular avatars, gradient rings, centered layout
3. Cards show: name, badge (level), city, stats (sales/vehicles/specializations), bio, tags, orange CTA button
