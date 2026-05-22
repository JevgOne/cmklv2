# Kontrolor — TASK-036 unified broker profile

## 1. Simplify

Kód je čistý a dobře strukturovaný. ✅

**Server/client split je správný:**
- `page.tsx` (267 ř.) — server only: `getProfileData` (cache), `generateMetadata`, JSON-LD Person render, notFound gate. Zero `"use client"` overhead.
- `ProfileClient.tsx` (944 ř.) — client: session, tabs, lazy items fetch, share handler, LikeButton/CommentSection. Všechny interaktivní state tady správně.
- `loading.tsx` (46 ř.) — SSR skeleton, layout-matching (cover + hero + 3 card placeholders). Clean.

**Podmíněné rendering:**
- `hasAboutCard` / `hasSpecCard` / `hasContactCard` boolean gates — sekce se skryjí, když není data. Čisté a bez null-check duplicit.
- Role-aware tabs přes `ROLE_TABS` mapa + `ROLE_LABELS` / `LEVEL_LABELS` / `DAY_LABELS` lookup objekty. Žádný if-else pyramid.

**TagPill:** Import `from "@/components/web/TagPill"` (l. 12) — používá sdílenou komponentu z TASK-054, žádná re-implementace. ✅

**Drobné:** `ProfileItemCard` uvnitř souboru je rozumně velký (~210 ř.) a má smysl — 4 varianty karet (investment/flip/liked/default) s jedinou render logikou. Lze v budoucnu extrahovat, ale není to blocking.

⚠️ Drobný duplikát: `ROLE_LABELS` je definovaný jak v `page.tsx` (metadata), tak v `ProfileClient.tsx` (UI). Nekritické (server vs client scope), ale v budoucnu by šlo přesunout do `lib/profile-labels.ts`.

## 2. Debug

- **npm run build:** ✅ (`Compiled successfully in 19.3s`, 1260 static pages, 0 errors/warnings, `/profil/[slug]` = ƒ Dynamic)
- **grep `/makler/${`:** 0 hits pro public profile, ~30 hits pouze pro PWA vnitřek (`/makler/vehicles/${id}`, `/makler/contracts/${id}`, `/makler/leads/${id}` atd.) — ty jsou legitimní (broker PWA workspace, ne veřejný profil). ✅
- **grep `href.*\`/makler/`:** 0 hits pro public profile route, všechny ostatní jsou PWA navigace. ✅
- **grep `/makler/${slug}`:** 0 hits. ✅
- **grep public profile redirect stub:** `app/(web)/makler/[slug]/page.tsx:9: permanentRedirect(\`/profil/${slug}\`)` — přesně 1 hit, správně. ✅
- **grep `/profil/${`:** 12 hitů (sitemap, email signature, BrokerBox, BrokerCard, CommentSection, /makleri list, homepage, muj-ucet, profil page self-refs) — všechny nové interní linky zapojené. ✅

## 3. Reverzní kontrola

| # | Bod zadání | Status | Detail |
|---|------------|--------|--------|
| 1 | Server component + metadata + JSON-LD Person schema | ✅ | `page.tsx` = server, `generateMetadata` (l. 184), JSON-LD Person s `name`, `url`, `jobTitle`, `worksFor`, `address`, `image`, `sameAs` (l. 240-256) |
| 2 | 8 kartových sekcí (Cover → Hero+TagPill → O mně → Specializace → Kontakt → Vozidla+Tabs → Badges → Komentáře) | ✅ | V `ProfileClient.tsx` komentáři `(1) Cover`, `(2) Hero`, `(3) O makléři`, `(4) Specializace`, `(5) Kontakt`, `(6) Tabs + Items`, `(7) Badges`. Komentáře (8) jsou per-item uvnitř `ProfileItemCard` (`<CommentSection />` l. 940) — správně na úrovni položek, ne globální sekce |
| 3 | max-w-6xl (ne 4xl) | ✅ | `max-w-6xl mx-auto` v ProfileClient l. 313 a loading l. 6 |
| 4 | Hybrid server + client architektura | ✅ | page = server (data fetch, SEO), ProfileClient = client (session, tabs, UI state) |
| 5 | `/makler/[slug]` → 301 redirect (permanentRedirect), smazány MaklerContactForm.tsx + loading.tsx | ✅ | `app/(web)/makler/[slug]/page.tsx` = 10 řádkový permanentRedirect stub. Commit 4390eb1 smazal `MaklerContactForm.tsx` (-104) a `loading.tsx` (-35). Adresář obsahuje už jen `page.tsx` |
| 6 | Přepsány ALL interní odkazy (sitemap, email signature, BrokerBox, /makleri list, homepage) | ✅ | Commit d856a0d: `app/sitemap.ts`, `lib/email-templates/signature.ts` (HTML + text), `components/web/BrokerBox.tsx`, `app/(web)/makleri/page.tsx`, `app/(web)/page.tsx`. Ověřeno grepem `/profil/${` — 12 hitů v aktivním kódu |
| 7 | Hashtag pills (TagPill z TASK-054) → `/makleri/[slug]` | ✅ | Import `TagPill` z `components/web/TagPill` (l. 12); render v Hero card l. 354-364; `TagPill` sama má `href={\`/makleri/${slug}\`}` l. 43 |
| 8 | Žádné zkratky v UI | ✅ | "O makléři" (l. 448), "Specializace" (l. 484), "Kontakt" (l. 549), "Ocenění a odznaky" (l. 706). Žádné "FAQ", "m.", "EV" zkratky. Dny v týdnu Po/Út/St/Čt/Pá/So/Ne (ne en-zkratky) |
| 9 | 3 commity (žádný amend/reset) | ✅ | `63dd47c`, `4390eb1`, `d856a0d` — všechny v git logu, author JevgOne, chronologicky 17:26 → 17:28 → 17:30, žádný force-push/amend. Commit hashes stabilní |

## Nalezené problémy

- ⚠️ **Minor: `ROLE_LABELS` duplikát** mezi `page.tsx` (l. 11-21) a `ProfileClient.tsx` (l. 139-149). Obě verze mají identickou mapu 9 rolí. Non-blocking (server scope vs client scope), ale kandidát na extrakci do `lib/profile-labels.ts` v rámci budoucí úklidové vlny.
- ℹ️ Info: `ProfileItemCard` je ~210 ř. uvnitř `ProfileClient.tsx`. Má 4 varianty (investment/flip/liked/default). Velikost akceptovatelná, extrakce do separátního souboru by zlepšila čitelnost — ale ne nutná dnes.

## Verdikt

✅ **PASS**

Build zelený, 9/9 bodů zadání splněno, interní linky přemapovány, legacy `/makler/[slug]` korektně 301 redirects. 3 čisté commity bez amendu. Drobný ROLE_LABELS duplikát je minor hygiene, nezdržuje deploy.
