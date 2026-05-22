# Chrome Test Report — Broker Profile Enhancements
**Date:** 2026-04-19  
**Tester:** test-chrome  
**Tested URLs:**
- https://carmakler.cz/profil/jan-novak-praha
- https://inzerce.carmakler.cz/nabidka

---

## 1. Broker Profile Page

### Ověření Badges
| Badge | Status | Note |
|-------|--------|------|
| Ověřená identita | ⚠️ NOT SHOWN | By design: only for level BROKER/SENIOR/TOP. Jan Novák is JUNIOR. |
| Ověřený telefon | ✅ PASS | Green badge visible |
| Ověřený e-mail | ✅ PASS | Green badge visible |

**Root cause of missing identity badge:**  
`ProfileClient.tsx:355` — `{["BROKER", "SENIOR", "TOP"].includes(user.level) && ...}`  
Jan Novák's seed data has no `level` set → defaults to `"JUNIOR"` (schema default).  
The task spec says all 3 badges should show — this is a discrepancy with the implementation.  
**Action needed:** Either seed Jan Novák with `level: "BROKER"`, or adjust the badge condition.

---

### Kontaktní CTA
| Element | Status | Detail |
|---------|--------|--------|
| Zavolat button | ✅ PASS | `tel:+420 777 123 456` |
| Napsat zprávu button | ✅ PASS | `mailto:jan.novak@carmakler.cz` |

---

### Progress Bar
| Check | Status | Detail |
|-------|--------|--------|
| Bar renders | ✅ PASS | Shows "0% do Makléř · 5 prodejů" |
| Correct level | ✅ PASS | Jan Novák is JUNIOR with 0 sales → working toward Makléř (5 sales) |

Note: Task spec said "Makléř → Senior" but that would only apply to a user already at MAKLER level. JUNIOR → Makléř is correct for Jan Novák.

---

### Sociální sítě
| Platform | Status | URL |
|----------|--------|-----|
| Instagram | ✅ PASS | instagram.com/jannovak |
| Facebook | ✅ PASS | facebook.com/jannovak.makler |
| YouTube | ✅ PASS | youtube.com/@jannovak |

---

### Timeline / Milníky
| Check | Status | Detail |
|-------|--------|--------|
| Timeline renders | ✅ PASS | Vertical timeline present |
| Registration date | ✅ PASS | "Registrace — duben 2026" |
| Sales milestones | ✅ PASS | 1 prodej → 5 prodejů (Makléř) → 10 → 20 (Senior makléř) → 50 (Top makléř) |

---

### Badges / Odznaky
| Badge | Status |
|-------|--------|
| FIRST_SALE (První prodej) | ✅ PASS |
| FIVE_SALES (5 prodejů) | ✅ PASS |
| FAST_RESPONDER (Rychlá reakce) | ✅ PASS |

---

### JS Console Errors
No JavaScript errors detected on the profile page.

---

## 2. Inzerce Redirect (/nabidka → /katalog)

```
HTTP/2 307
location: /katalog
```

✅ **PASS** — `inzerce.carmakler.cz/nabidka` correctly returns 307 redirect to `/katalog`. No 404. Page shows "Načítání katalogu..." (catalog loading state).

---

## Summary

| Test | Result |
|------|--------|
| Ověřená identita badge | ⚠️ ISSUE (seed data / logic) |
| Ověřený telefon badge | ✅ PASS |
| Ověřený e-mail badge | ✅ PASS |
| Zavolat CTA | ✅ PASS |
| Napsat zprávu CTA | ✅ PASS |
| Progress bar | ✅ PASS |
| Social links (3x) | ✅ PASS |
| Timeline/milníky | ✅ PASS |
| Badges (3x) | ✅ PASS |
| /nabidka → /katalog redirect | ✅ PASS |

**Result: 9/10 PASS — 1 issue: "Ověřená identita" badge missing because Jan Novák seed level = JUNIOR (not BROKER/SENIOR/TOP)**

### Recommended Fix
In `prisma/seed.ts` line ~214, add `level: "BROKER"` to Jan Novák's seed data, OR change the badge condition in `ProfileClient.tsx:355` to not require a specific level (e.g., always show for verified BROKER role users).
