# Plan: Admin UX — Role badge "ADMINISTRÁTOR" vybočuje z menu

## Analýza problému

**Soubor:** `components/admin/AdminSidebar.tsx`, řádky 137–148

V header sekci sidebaru je logo, brand name a role badge na jednom řádku:

```
[Logo 36px] [gap 12px] [CarMakléř ~120px] [gap 12px] [ml-2 8px] [ADMINISTRÁTOR badge ~95px]
= ~283px celkem
```

Sidebar je 280px široký, padding p-6 (2×24px) → **dostupná šířka jen 232px**. Badge přetéká.

Problém se zhoršuje u delších rolí:
- `ADMINISTRÁTOR` (13 znaků) — přetéká
- `REGIONÁLNÍ ŘEDITEL` (18 znaků) — přetéká výrazně
- `BACKOFFICE` (10 znaků) — těsné
- `MANAŽER` (7 znaků) — OK

## Aktuální kód (řádky 137–148)

```tsx
<div className="p-6 border-b border-white/[0.08]">
  <div className="flex items-center gap-3">
    <Image src="/brand/logo-symbol-white.png" alt="" width={40} height={40} className="h-9 w-auto" priority />
    <span className="text-xl font-extrabold tracking-tight">
      <span className="text-orange-400">Car</span>
      <span className="text-white">Makléř</span>
    </span>
    <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full ml-2">
      {roleLabel.toUpperCase()}
    </span>
  </div>
</div>
```

## Důležitý kontext

Footer sidebaru (řádky 186–196) **již zobrazuje roleLabel** pod jménem uživatele — badge v headeru je tedy **redundantní informace**.

## Řešení

Přesunout role badge pod brand name na vlastní řádek. Tím se:
1. Eliminuje overflow u všech délek rolí
2. Zachová vizuální indikátor role nahoře sidebaru (at-a-glance)
3. Layout zůstane čistý a konzistentní

### Implementace

**Soubor:** `components/admin/AdminSidebar.tsx`

**Nahradit** řádky 137–148 za:

```tsx
<div className="p-6 border-b border-white/[0.08]">
  <div className="flex items-center gap-3">
    <Image src="/brand/logo-symbol-white.png" alt="" width={40} height={40} className="h-9 w-auto" priority />
    <div>
      <span className="text-xl font-extrabold tracking-tight">
        <span className="text-orange-400">Car</span>
        <span className="text-white">Makléř</span>
      </span>
      <div className="mt-1">
        <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
          {roleLabel.toUpperCase()}
        </span>
      </div>
    </div>
  </div>
</div>
```

**Změny:**
1. Brand name + badge zabaleny do `<div>` místo inline flex
2. Badge přesunut na nový řádek pod brand name (`<div className="mt-1">`)
3. Odstraněn `ml-2` z badge (není potřeba, badge je na vlastním řádku)

### Vizuální výsledek (before/after)

**BEFORE (přetéká):**
```
[🔶] CarMakléř [ADMINISTRÁTOR]  ← badge vybočuje
```

**AFTER (OK):**
```
[🔶] CarMakléř
      ADMINISTRÁTOR              ← badge na novém řádku
```

## Acceptance Criteria

- [ ] Badge nepřetéká sidebar u žádné role (ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR)
- [ ] Brand name + logo zůstávají na jednom řádku
- [ ] Badge je vizuálně zarovnaný pod brand name
- [ ] Mobilní sidebar (slide-in) funguje stejně

## Dotčené soubory

| Soubor | Akce |
|--------|------|
| `components/admin/AdminSidebar.tsx` | Edit řádky 137–148 |

## Složitost

**Triviální** — 1 soubor, ~5 řádků změněných. Žádné side-effecty.
