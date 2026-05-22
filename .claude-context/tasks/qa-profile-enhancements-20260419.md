# QA Report — Profile Enhancements
**File:** `app/(web)/profil/[slug]/ProfileClient.tsx`
**Date:** 2026-04-19
**Reviewer:** kontrolor

---

## Summary

6 new sections reviewed. Found **1 critical bug**, **1 security issue**, and **3 minor issues**.

---

## Section-by-Section Review

### 1. Kontaktní CTA (lines 446–487)

| Check | Result |
|---|---|
| Conditional rendering (showPhone / showEmail) | ✅ `user.phone &&` / `user.email &&` guard on each button |
| `tel:` href format | ✅ `tel:${user.phone}` — correct |
| `mailto:` href format | ✅ `mailto:${user.email}` — correct |
| SVG phone icon | ✅ standard telephone path |
| SVG email icon | ✅ envelope path |
| Accessibility | ⚠️ buttons have visible text labels ("Zavolat", "Napsat zprávu") — sufficient, but no `aria-label` exposing the actual phone number/address to screen readers |

**Minor:** `tel:${user.phone}` does not strip whitespace. Phone numbers stored with spaces (e.g. `+420 123 456 789`) produce `tel:+420 123 456 789` which is non-standard. Should normalise with `.replace(/\s/g, '')`.

---

### 2. Ověření badges (lines 349–373)

| Check | Result |
|---|---|
| Identity badge condition | ✅ `["BROKER", "SENIOR", "TOP"].includes(user.level)` — correctly excludes JUNIOR |
| Phone badge condition | ✅ `user.phone &&` guard |
| Email badge condition | 🔴 **BUG — always renders** |
| Green colour | ✅ `text-green-700 bg-green-50 border-green-200` |
| Shield icon for identity | ✅ shield SVG path (lines 353–355) |
| Checkmark icon for phone/email | ✅ |

**Critical Bug (line 367):** `"Ověřený e-mail"` badge has **no conditional guard**. It renders for every profile, even when `user.email` is `null`. This falsely claims email verification for all users.

**Fix required:**
```diff
- <span className="inline-flex items-center gap-1 ...">
+ {user.email && (
+   <span className="inline-flex items-center gap-1 ...">
      ...
    </span>
+ )}
```

---

### 3. Progress bar (lines 375–383)

| Check | Result |
|---|---|
| Renders only for BROKER role | ✅ `user.role === "BROKER"` guard |
| Only when not JUNIOR | ✅ wrapped inside `{levelLabel && ...}` block |
| Component usage | ✅ `<LevelProgressBar level={user.level} totalSales={user.totalSales} size="md" />` |

No issues.

---

### 4. Sociální sítě (lines 703–748)

| Check | Result |
|---|---|
| No socialLinks — card hidden | ✅ `hasContactCard` computation includes socialLinks; contact card hidden when all fields null |
| `target="_blank"` | ✅ all three links |
| `rel="noopener noreferrer"` | ✅ all three links |
| Instagram hover effect | ✅ gradient `hover:from-purple-500 hover:to-pink-500` |
| Facebook hover | ✅ `hover:bg-blue-600` |
| YouTube hover | ✅ `hover:bg-red-600` |
| Accessibility | ⚠️ uses `title="Instagram"` (tooltip) but no `aria-label` — `aria-label` preferred for screen readers |

**Security Issue (lines 665, 709, 722, 734):** Social link URLs (`user.socialLinks.instagram`, `.facebook`, `.youtube`) and `user.website` are inserted directly into `href` attributes **without protocol validation**. A malicious user who sets their profile to `javascript:alert(document.cookie)` can execute XSS against anyone viewing the profile.

**Fix required:** Validate on save OR sanitize on render:
```ts
function safeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : '#';
}
// then: href={safeUrl(user.socialLinks.instagram)}
```
This applies to all 4 href values: `user.website` + 3 social links.

---

### 5. Timeline (lines 612–646)

| Check | Result |
|---|---|
| Role guard | ✅ `["BROKER", "MANAGER", "REGIONAL_DIRECTOR"].includes(user.role)` |
| Milestone thresholds | ✅ 1/5/10/20/50 sales |
| Registration milestone always achieved | ✅ `achieved: true` |
| Edge case: 0 sales | ✅ Only registration dot is orange, all others grayed |
| Date formatting | ✅ `toLocaleDateString("cs-CZ", { month: "long", year: "numeric" })` |
| Visual line alignment | ✅ `left-[9px]` line aligns with dot center (dot at `-left-6` in `pl-6` container → center at 9px) |

**Minor:** No ARIA semantics on the timeline list. Adding `role="list"` to the `div.space-y-4` and `role="listitem"` to each milestone would improve screen reader experience.

---

### 6. Badges grid (lines 811–837)

| Check | Result |
|---|---|
| Empty badges — section hidden | ✅ `{badges.length > 0 && (...)}` |
| Unknown badge key | ✅ `if (!info) return null` |
| Responsive grid | ✅ `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` |
| Hover effects | ✅ `hover:border-orange-200 hover:bg-orange-50/50 transition-colors` |

**Minor:** Emoji icon `{info.icon}` in `<span>` has no `aria-hidden="true"`. Screen readers will announce the emoji's Unicode name. Since the badge `name` and `description` are already rendered as text, the emoji is decorative and should be hidden: `<span aria-hidden="true" ...>`.

---

## Additional Findings

### Unused variables (TypeScript/lint)
- Line 915: `const commentCount = item._count?.profileComments ?? 0;` — declared but never used (vehicle/listing block)
- Line 1076: `const commentCount = item._count?.profileComments ?? 0;` — declared but never used (parts block)

### Card heading hardcoded to "O makléři" (line 495)
- Shown for all roles (ADVERTISER, BUYER, PARTS_SUPPLIER, etc.). For non-broker profiles this heading is misleading. Should use role-aware label, e.g. `user.role === "BROKER" ? "O makléři" : "O uživateli"`.

---

## Issue Priority Summary

| # | Severity | Description | Line |
|---|---|---|---|
| 1 | 🔴 Critical | "Ověřený e-mail" badge always renders — no email guard | 367 |
| 2 | 🟠 Security | socialLinks + website URLs inserted into href without protocol check (XSS via `javascript:`) | 665, 709, 722, 734 |
| 3 | 🟡 Minor | `tel:` href not normalising whitespace from phone number | 459 |
| 4 | 🟡 Minor | Emoji icons in badges not `aria-hidden` | 825 |
| 5 | 🟡 Minor | "O makléři" heading for all roles | 495 |
| 6 | 🟢 Info | Unused `commentCount` variables | 915, 1076 |
| 7 | 🟢 Info | Timeline/social links missing `aria-label` / ARIA role semantics | various |

---

**Verdict:** **BLOCKED** — issues #1 (critical) and #2 (security) must be fixed before shipping.
