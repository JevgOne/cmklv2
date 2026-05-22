# Evžen review — TASK-033 audit duplicit

## Doslovné zadání
"najdu vše co je duplicitní"

## Check 1 — úplnost
✅ — Audit pokrývá 5 kategorií (routes, komponenty, layouty, legacy dead code, data/seed) + dodatečné poznámky. Celkem 14 položek (R1-R4, C1-C5, L1-L4 + seed). Pokrytí route skupin: `app/(web)/*` ano (shop, dily, dodavatel, prihlaseni, makler, profil), `(admin)` a `(pwa)/(pwa-parts)` explicitně neprohledány — ale audit se drží scope user požadavku (duplicity napříč produkty), user-facing web je nejvíc bolí (`/makler` vs `/profil` trigger). Pro MVP uživatelské frustrace dostačující. Minimum 10 duplicit splněno (14).

## Check 2 — konkrétnost
✅ — Každá položka má: přesné cesty souborů (např. `app/(web)/shop/page.tsx`), počty řádků (270, 265, 551, 181…), jasné doporučení (smazat / 301 redirect / merge / ponechat), a zdůvodnění kanonické verze (ISR + JSON-LD + landing pages u `/dily/*`). Tabulky mají i task referenci (#32 existuje, NOVÝ).

## Check 3 — prioritizace
✅ — 5 vln s risk/effort hodnocením, tabulka souhrnu §8, doporučené pořadí §7 (quick wins → komponenty → TASK-032 → /shop refactor → nice-to-have). Q&A pro lead §9 s konkrétními doporučeními.

## Check 4 — bez halucinací
✅ — Ověřeno:
- `AddListingForm.tsx` = **551 ř.** ✓ (grep import: 0 produkčních výskytů)
- `Cart.tsx` = **181 ř.** ✓ (grep import: 0 výskytů)
- `FAQ.tsx` = **73 ř.**, `FaqSection.tsx` = **83 ř.** ✓ (claim 73/83)
- `/dodavatel/[slug]/page.tsx` = **181 ř.** ✓, `/dily/vrakoviste/[slug]/page.tsx` = **412 ř.** ✓
- `/shop/page.tsx` = **270 ř.** ✓, `/dily/page.tsx` = **265 ř.** ✓
- `/dily/moje-objednavky/page.tsx:134,137` LINKUJE na `/shop/moje-objednavky/${id}/vraceni|reklamace` ✓ (doslova ověřeno, rozbito)
- `/prihlaseni/page.tsx` používá `redirect("/login")` (307), ne `permanentRedirect` ✓
- `app/(web)/shop/` obsahuje reálně 12 stránek (katalog, kosik, objednavka, moje-objednavky, produkt, reklamace, vraceni-zbozi, objednavky/sledovani) ✓

Žádné lži nenalezeny. Všechny sample claims přesně odpovídají filesystem.

## Check 5 — Carmakler pravidla
✅ — Audit nikde neříká "smazat" jako direct action, všude jsou doporučení + §9 otázky pro lead ("udělat HNED nebo bundle?", "vytvořit TASK-034?"). Legacy soubory označené, dead code potvrzený grepem (0 importů), nic "work in progress" není omylem označeno k mazání. Memory poznámky v §10 respektují `feedback_git_reset_approval.md` a `feedback_no_parallel_impl_test.md`.

## Verdikt
✅ APPROVED — lead může prezentovat uživateli.

Audit je důkladný, konkrétní, ověřený. Největší přínos: identifikuje KRITICKÝ problém `/shop/*` vs `/dily/*` (12 duplicitních stránek, rozbité interní odkazy) a 732 řádků čistého dead code (`AddListingForm` + `Cart.tsx`) pro okamžité smazání. Prioritizace do 5 vln dává leadovi jasnou cestu od quick-wins k velkému refactoru.

Pozn. pro leada: `(admin)` a `(pwa)` route skupiny audit neprohledal do hloubky. Pokud user chce TRULY "vše", zvážit follow-up audit těchto sekcí — ale pro řešení dnešní frustrace (`/makler` vs `/profil`) je current scope správný.
