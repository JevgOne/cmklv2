---
task: 122
title: Fix #116 minor findings (/makler 404 + og:url chybí)
type: IMPL
owner: implementator
status: PUSHED
size: XS
risk: LOW
priority: MEDIUM
created: 2026-04-07
commit: 56614b7
---

# #122 IMPL — fix #116 minor findings

## §0 Scope provedeno

2 minor findings z test-chrome #116 verifikace deploy:
1. **`/makler` → 404** — fix: redirect na `/makler/dashboard`
2. **`og:url` chybí na homepage** — fix: přidat `openGraph.url`

| File | Type | Edits |
|---|---|---|
| `app/(pwa)/makler/page.tsx` | NEW | 13 lines (server component + JSDoc) |
| `app/(web)/page.tsx` | MODIFIED | +1 line (`url: "https://carmakler.cz"` v openGraph) |

**Total: 2 files, +14/-0 lines**

---

## §1 Finding #1 — `/makler` 404 → 307 redirect

### Problem
`app/(pwa)/makler/` měl podsložky (dashboard, leads, vehicles, ...) ale **žádný `page.tsx`** na index.
Uživatel zadávající `carmakler.cz/makler` dostal 404.

### Fix — Option A (server component s `redirect()`)

```typescript
// app/(pwa)/makler/page.tsx
import { redirect } from "next/navigation";

/**
 * /makler index — redirect na dashboard.
 *
 * Bare /makler URL nemá vlastní obsah; uživatelé/linky landí na dashboard.
 * 307 (temporary) — pro případ že později přidáme skutečný /makler index.
 *
 * Refs: #122
 */
export default function MaklerIndexPage() {
  redirect("/makler/dashboard");
}
```

### Důvod Option A vs Option B (next.config.ts redirects)
- Server component se zdědí PWA layout (`app/(pwa)/layout.tsx`) — konzistentní brand
- Permanent: `false` (307) — flexibilita pro budoucí skutečný `/makler` index
- Žádný next.config.ts overhead

### Verify
```bash
curl -sI http://localhost:3000/makler
# HTTP/1.1 307 Temporary Redirect
# location: /makler/dashboard
# x-subdomain: main
```

---

## §2 Finding #2 — `og:url` chybí na homepage

### Problem
`<meta property="og:url" content="...">` byl `null` na `/`.
Canonical byl OK, ale `og:url` chybí pro social sharing (FB/LinkedIn/Twitter card preview URL).

### Fix
```diff
   openGraph: {
     title: "CarMakléř | Prodej aut přes certifikované makléře",
     description:
       "Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů. Rychle, transparentně a bez starostí.",
     type: "website",
+    url: "https://carmakler.cz",
   },
```

### Verify
```bash
curl -s http://localhost:3000/ | grep -o 'property="og:[^"]*"[^>]*'
# property="og:title" content="CarMakléř | Prodej aut přes certifikované makléře"
# property="og:description" content="Prodejte nebo kupte auto bezpečně přes síť ověřených makléřů..."
# property="og:url" content="https://carmakler.cz"   ← NEW ✅
# property="og:type" content="website"
```

---

## §3 Acceptance Criteria

| AC | Status | Verifikace |
|---|---|---|
| **AC1** `app/(pwa)/makler/page.tsx` neexistoval před fixem | ✅ | `Glob app/(pwa)/makler/*.tsx` → 0 results pre-fix |
| **AC2** `/makler` returns 307 + `location: /makler/dashboard` | ✅ | `curl -sI http://localhost:3000/makler` → "HTTP/1.1 307", "location: /makler/dashboard" |
| **AC3** `og:url` content="https://carmakler.cz" na homepage | ✅ | `curl -s / \| grep og:url` → present |
| **AC4** `npm run build` projde | ✅ | `DATABASE_URL=postgresql://zen@localhost:5432/carmakler npm run build` → "✓ Compiled successfully", `/makler` registered as ○ static |
| **AC5** TypeScript check projde | ✅ | `tsc --noEmit` → 0 errors |
| **AC6** ESLint baseline zachován (542 warnings, 0 errors) | ✅ | `npm run lint` → "✖ 542 problems (0 errors, 542 warnings)" |

---

## §4 Build verify (relevant routes)

```
✓ Compiled successfully in 17.2s

├ ○ /makler                 ← NEW ✅ static (redirect server component)
├ ƒ /makler/[slug]          (broker profile, dynamic)
├ ƒ /makler/dashboard       (target of redirect)
├ ○ /makler/contacts
├ ○ /makler/leads
... (28+ existing /makler/* routes)
```

---

## §5 Pre-existing build issue (escalation note)

Build s **dummy DATABASE_URL** lokálně failuje na `/admin/dashboard` prerender:
```
Error occurred prerendering page "/admin/dashboard"
prisma:error Invalid `prisma.vehicle.count()` invocation
User was denied access on the database `(not available)`
Export encountered an error on /(admin)/admin/dashboard/page: /admin/dashboard, exiting the build.
```

**Toto NENÍ způsobeno mým fixem** — confirmed via `git stash` baseline test:
- HEAD~1 (před #122): `(234/313)` static pages → fail na admin
- HEAD (s #122): `(235/314)` → fail na stejné admin stránce

CI passes 4/4 dle leadova reportu — zvláštní, protože CI build job používá stejný dummy URL.
Možné že CI prerender selhání toleruje, nebo `/admin/*` v CI nějak neprerenderuje.

**Akce:** Eskalováno leadovi ve zprávě jako separate concern, ne blocker pro #122.

---

## §6 Out of scope

- Žádné jiné metadata změny (twitter card, description tweaks)
- Žádný refactor admin pages prerender chování
- Žádné jiné findings z #116

---

## §7 Git

```
commit 56614b7
Author: JevgOne <jevgone@github.com>
Date:   Tue Apr 7 

    fix(seo): #122 add /makler redirect + og:url meta on homepage

    1. /makler → 404 (no index page in PWA route group)
       Add server component that calls redirect('/makler/dashboard')
       307 temporary — leaves room for future real /makler index page.

    2. og:url missing on homepage <meta property="og:url">
       Add openGraph.url = 'https://carmakler.cz' to metadata export.
       Required for FB/LinkedIn/Twitter card preview URL.

    Refs: #122

 app/(pwa)/makler/page.tsx | 13 +++++++++++++
 app/(web)/page.tsx        |  1 +
 2 files changed, 14 insertions(+)
```

**Push:** `ea4386c..56614b7  main -> main` ✅

---

## §8 Next steps

1. ✅ Push na origin/main
2. ⏳ CI monitor (delegováno na leada, gh CLI nedostupný)
3. ⏳ TaskUpdate #120 → completed
4. ⏳ SendMessage team-lead s acceptance check + escalation note o admin build issue

---

**Implementace dokončena. 2 findings fixed, 0 deviation, 0 regresí.**
