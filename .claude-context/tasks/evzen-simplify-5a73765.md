# Evžen quick verify — 5a73765 simplify pass

## Check 1 — scope
✅ — přesně 4 soubory: `lib/role-labels.ts` (new), `app/(web)/profil/[slug]/page.tsx`, `app/(web)/profil/[slug]/ProfileClient.tsx`, `app/(web)/muj-ucet/profil/page.tsx`. Žádný bleed.

## Check 2 — labels bez zkratek
❌ — `DAY_LABELS` obsahuje zkratky: `po: "Po"`, `ut: "Út"`, `st: "St"`, `ct: "Čt"`, `pa: "Pá"`, `so: "So"`, `ne: "Ne"`. Očekáváno plné "Pondělí"/"Úterý"/… Ostatní mapy OK (`ROLE_LABELS` "Certifikovaný makléř"/"Inzerent"/"Ověřený investor", `LEVEL_LABELS` "TOP Makléř"/"Senior"/"Nováček", `TAB_LABELS` "Vozidla"/"Recenze → Oblíbené"/"Investice"/"Flipy"). Note: zkratky existovaly i před refactorem (`git show 5a73765^:ProfileClient.tsx` řádky 151-159) — refactor jen extrahoval 1:1, user-facing output unchanged. Literal rule (Rule 1 + memory STOP & ESCALATE literal) nicméně zakazuje zkratky v TAB/DAY mapách.

## Check 3 — čistá historie
✅ — HEAD `5a73765`, předchůdci `d856a0d`, `4390eb1`, `63dd47c`, `88ab61f`. Žádný reset/amend/force.

## Verdikt
❌ REJECTED: `DAY_LABELS` obsahuje zkratky (Po/Út/St/Čt/Pá/So/Ne) místo plné formy (Pondělí/Úterý/Středa/…). Triggers literal Rule 1. Doporučení: follow-up commit který nahradí DAY_LABELS na plné názvy dnů — jediná změna user-facing outputu, zbytek refactoru (race/strictmode fix, label extract, -90 řádků) je OK a může zůstat. Pokud lead považuje "user-facing output unchanged" za nadřazené literal rule (protože zkratky byly pre-existing), eskalovat k lead pro explicit override.
