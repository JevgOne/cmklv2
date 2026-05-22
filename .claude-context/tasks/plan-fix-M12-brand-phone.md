# Plan: FIX M12 — Brand phone hardcoded → env proměnná

**Task:** #26
**Issue ID:** M12 z audit-deep-stubs-broken-20260424.md
**Soubor:** `lib/brand-styles.ts:30`
**Autor:** Plánovač
**Datum:** 2026-04-24

---

## ANALÝZA

### Stávající stav:
- **Řádek 30:** `phone: "+420 123 456 789"` — fake číslo v `brand.company` objektu
- Objekt je `as const` (ř. 33)

### Kde se `brand.company.phone` používá v produkci:
1. **`lib/brand-styles.ts:215`** — PDF document footer:
   ```
   ${brand.company.name} | ${brand.company.web} | ${brand.company.email} | ${brand.company.phone}
   ```
   → Zobrazí se na VŠECH PDF smlouvách (kupní, zprostředkovatelská, předávací protokol)

### Kde se "+420 123 456 789" vyskytuje jako form placeholder (NEMĚNIT):
- `components/web/SellerInfo.tsx:198`
- `app/(pwa)/makler/contacts/new/page.tsx:86`
- `app/(web)/inzerce/registrace/page.tsx:272`
- `app/(web)/registrace/page.tsx:317`
- `app/(web)/registrace/makler/page.tsx:297`

Tyto jsou HTML `placeholder` atributy — legitimní UX, **NEMĚNIT**.

---

## IMPLEMENTAČNÍ PLÁN (1 krok)

### Krok 1: Nahradit phone env proměnnou

**Soubor:** `lib/brand-styles.ts`

**Problem:** Objekt je `as const` (ř. 33) — `process.env.BRAND_PHONE` je `string | undefined`, nelze přímo přiřadit.

**Řešení:** Extrahovat phone před objektem:

```ts
const BRAND_PHONE = process.env.BRAND_PHONE || "+420 123 456 789";
```

A v objektu nahradit:
```ts
phone: BRAND_PHONE,
```

Plus odebrat `as const` z řádku 33 (nebo nechat — TypeScript bude inferovat `string` pro phone, ale `as const` na ostatních polích přežije). Nejčistší: odebrat `as const` celkem — nikde se nepoužívá type narrowing na brand values.

### Env proměnná:

Přidat do `.env` na serveru:
```
BRAND_PHONE="+420 XXX XXX XXX"
```

**DŮLEŽITÉ:** Skutečné číslo musí zadat uživatel. Implementátor se musí ZEPTAT přes leada jaké číslo použít. Fallback zůstává stávající "+420 123 456 789" dokud nebude známé skutečné číslo.

---

## SOUBORY K EDITACI

| # | Soubor | Akce | Popis |
|---|--------|------|-------|
| 1 | `lib/brand-styles.ts` | EDIT ř. 30 + ř. 33 | Nahradit phone env proměnnou, odebrat `as const` |

---

## ACCEPTANCE CRITERIA

- [ ] `brand.company.phone` čte z `process.env.BRAND_PHONE`
- [ ] Fallback existuje (stávající číslo nebo prázdný string)
- [ ] PDF footer zobrazuje phone z env
- [ ] Form placeholders (5 instancí) zůstávají nezměněny
- [ ] TypeScript build OK
- [ ] Implementátor se zeptá na skutečné číslo

## POZNÁMKA PRO IMPLEMENTÁTORA

**Zeptej se leada/uživatele:** Jaké je skutečné firemní telefonní číslo pro CarMakléř? To musí jít do `.env` na produkci jako `BRAND_PHONE`.

## ODHAD

- **Složitost:** Triviální (1 soubor, 2-3 řádky)
- **Risk:** Minimální — ale vyžaduje input od uživatele
