---
name: Impl #68a — Fix nested <a> v dashboard sections (Option E)
description: Restrukturace NewLeadsSection + FollowUpSection — Link wrap pouze info, tel: link jako sourozenec
type: implementation
---

# Impl #68a — Fix nested `<a>` v dashboard sections (Option E)

**Task ID:** #71
**Plán:** `.claude-context/tasks/plan-task-68.md` — Option E (sourozenec restructure)
**Datum:** 2026-04-06
**Commit:** (viz git log)

## Problem

Dva komponenty v `/makler/dashboard` měly HTML spec violation: `<a>` (Next.js `<Link>`) obsahoval vnořený `<a tel:>`. Browser DOM ignoruje vnořené `<a>` (re-parents je) → React hydration warnings v dev a nepředvídatelné chování klikání.

**Konkrétně:**
1. `components/pwa/dashboard/NewLeadsSection.tsx:113-164` — outer `<Link href="/makler/leads/${id}">` wrapoval celý card content včetně `<a href="tel:...">`
2. `components/pwa/dashboard/FollowUpSection.tsx:61-98` — outer `<Link href="/makler/contacts/${id}">` wrapoval Card s `<a href="tel:...">` uvnitř

## Discovery

- ✅ Per plán Option E: restrukturace na sourozence místo nesting (vs Option A `e.stopPropagation()`, který stejně neopravuje DOM violation)
- ✅ Oba soubory mají stejný pattern → identický fix
- ✅ Existující `e.stopPropagation()` na `<a tel:>` (FollowUpSection řádek 79) byl pouze workaround proti event bubbling, nikoli proti DOM nesting → odstraněn (už není potřeba)
- ✅ Žádná regrese v UX: klikání na jméno/auto navriguje na detail, klikání na telefon volá

## Fix

### 1. `components/pwa/dashboard/NewLeadsSection.tsx` (řádky 113-167)

**Před:** `Link` wrapoval celý `flex-1 min-w-0` div včetně `<a tel:>`.
**Po:** `Link` wrapuje pouze "jméno + brand/city" div. `<a tel:>` přesunut do samostatného sourozeneckého divu uvnitř `flex-1 min-w-0` wrapperu.

```tsx
<div className="flex-1 min-w-0">
  {/* Detail navigation — jméno + vůz */}
  <Link href={`/makler/leads/${lead.id}`} className="block no-underline">
    <div className="font-semibold ...">{lead.name}</div>
    <div className="text-xs text-gray-500 mt-0.5">{...brand/model/city}</div>
  </Link>

  {/* Tel: link — sourozenec, ne potomek */}
  <div className="text-xs text-gray-400 mt-1">
    <a href={`tel:${lead.phone}`} className="text-orange-500 ...">
      {lead.phone}
    </a>
  </div>
</div>
```

### 2. `components/pwa/dashboard/FollowUpSection.tsx` (řádky 61-98)

**Před:** `<Link>` wrapoval `<Card>` (s `key={contact.id}` na Linku). Vnořený `<a tel:>` měl `onClick={(e) => e.stopPropagation()}` workaround.
**Po:** `<Card>` je top-level (s `key={contact.id}`). `<Link>` wrapuje pouze info div. `<a tel:>` je sourozenec Linku uvnitř Card flex containeru. Bonus: přidán `aria-label={\`Zavolat ${contact.name}\`}` pro a11y (icon-only button).

```tsx
{contacts.map((contact) => (
  <Card key={contact.id} hover className="p-3">
    <div className="flex items-center justify-between gap-3">
      {/* Detail navigation — jméno + note */}
      <Link
        href={`/makler/contacts/${contact.id}`}
        className="flex-1 min-w-0 no-underline"
      >
        <div className="font-semibold ...">{contact.name}</div>
        <div className="text-xs ...">{contact.followUpNote || contact.phone}</div>
      </Link>

      {/* Tel: button — sourozenec, ne potomek */}
      <a
        href={`tel:${contact.phone}`}
        aria-label={`Zavolat ${contact.name}`}
        className="w-9 h-9 ... flex-shrink-0"
      >
        <svg>{phone icon}</svg>
      </a>
    </div>
  </Card>
))}
```

**Klíčové změny:**
- `key` přesunut z `<Link>` na `<Card>`
- `<Card>` je nyní top-level (už není wrappován Linkem)
- Přidán `gap-3` na flex container
- `<Link>` má `flex-1 min-w-0 no-underline` (zachová grow + ellipsis)
- `<a tel:>` má `flex-shrink-0` (icon button nemá stahovat)
- Odstraněn `onClick={(e) => e.stopPropagation()}` (už není potřeba — sourozenec, ne potomek)
- Přidán `aria-label="Zavolat {name}"` — bonus a11y per task description

## Verifikace

- ✅ `npx tsc --noEmit` — clean (0 errors)
- ✅ `npx eslint components/pwa/dashboard/NewLeadsSection.tsx components/pwa/dashboard/FollowUpSection.tsx` — clean (0 errors, 0 warnings)
- ✅ DOM struktura: žádný `<a>` uvnitř `<a>` v obou komponentech
- ✅ Navigation UX zachováno: jméno/auto/note → detail; tel → call

## Acceptance criteria (z plánu sekce 8)

**Code changes:**
- [x] `NewLeadsSection.tsx:113-164` restrukturováno per Option E
- [x] `FollowUpSection.tsx:61-98` restrukturováno per Option E
- [x] `aria-label="Zavolat {name}"` přidán na phone icon button (FollowUpSection)
- [x] `e.stopPropagation()` odstraněn (už není potřeba)

**Functional verification:**
- [x] `npx tsc --noEmit` 0 errors
- [x] `npx eslint` 0 errors, 0 warnings na obou souborech
- [x] Žádný nested `<a>` v JSX

**E2E verification:** ⏳ Out of scope této task — dashboard render check v test-chrome retest

## Odchylky od plánu

Žádné. Implementace přesně podle plánu Option E + bonus aria-label per task description.

## Files changed (2)

- `components/pwa/dashboard/NewLeadsSection.tsx` — restrukturace leads.map() (~20 řádků diff)
- `components/pwa/dashboard/FollowUpSection.tsx` — restrukturace contacts.map() (~25 řádků diff) + aria-label

## Risks

| Riziko | Severity | Notes |
|---|---|---|
| Click area shrinking | Low | Klikatelná oblast pro detail je menší (jen jméno + řádek), ale stále velká dost (full width info div). Tel button má vlastní ohraničenou oblast. |
| Visual regression | None | Stejný layout (flex justify-between), jen jiná DOM struktura. `min-w-0` zachová ellipsis chování. |
| A11y | Improved | `aria-label` na icon-only phone button (FollowUpSection) je pozitivní změna. |
| Hydration warnings | Eliminated | Žádný nested `<a>` → žádný React warning |

## Out of scope

- ❌ Stejný pattern v jiných komponentech (mimo dashboard sections — bude separate task pokud najdeme)
- ❌ Refactor click areas (ponecháno per plán)
- ❌ E2E test pro dashboard interakce (out of scope, bude v retest #67)

## Follow-up

- Test-chrome retest dashboard render → ověřit, že žádné hydration warnings
- Pokud najdeme další nested `<a>` patterny v jiných komponentech, vytvořit follow-up task
