# Kontrola: Profile Enhancements — evžen report
**Datum:** 2026-04-19
**Soubor:** `app/(web)/profil/[slug]/ProfileClient.tsx`

---

## Výsledek: ⚠️ PARTIAL PASS — 1 GAP nalezen

---

## Checklist požadavků

### 1. Kontakt CTA — ✅ PASS
- **"Zavolat"** → `<a href={tel:${user.phone}}>` — line 458–467, podmíněno `user.phone`
- **"Napsat zprávu"** → `<a href={mailto:${user.email}}>` — line 469–478, podmíněno `user.email`
- Oba buttony viditelné pouze pro návštěvníky (isOwner false), správně skryty pro vlastníka profilu

### 2. Ověření badges — ✅ PASS
- **"Ověřená identita"** — line 351–358, zobrazena pro BROKER/SENIOR/TOP level
- **"Ověřený telefon"** — line 359–365, podmíněno `user.phone`
- **"Ověřený e-mail"** — line 367–373, vždy zobrazena (pokud má účet)
- Design: zelená badge s checkmark ikonou ✅

### 3. Progress bar (level) — ⚠️ FAIL — GAP
- `<LevelProgressBar>` je implementován — line 381
- **PROBLÉM:** Je obalený podmínkou `{levelLabel && (...)}` — a `levelLabel` je `null` pro `level === "JUNIOR"` (line 278–279):
  ```ts
  const levelLabel = user.level !== "JUNIOR" ? LEVEL_LABELS[user.level] ?? user.level : null;
  ```
- **Důsledek:** JUNIOR makléři NEVIDÍ progress bar — přitom jsou to přesně ti uživatelé, kteří potřebují vidět postup (JUNIOR→BROKER) nejvíce. Spec explicitně zahrnuje JUNIOR jako startovní bod.
- Oprava: Progress bar pro BROKER role vykreslit i mimo `levelLabel` blok, nebo přidat speciální JUNIOR badge s progress barem.

### 4. Sociální sítě — ✅ PASS
- **Instagram** — line 709–719, SVG ikona, external link, hover gradient IG ✅
- **Facebook** — line 721–731, SVG ikona, external link, hover modrá ✅
- **YouTube** — line 733–744, SVG ikona, external link, hover červená ✅
- Všechny podmíněné na `user.socialLinks.*` — správně

### 5. Timeline — ✅ PASS
- Sekce "Milníky" — line 612–646
- Viditelná pro role: BROKER, MANAGER, REGIONAL_DIRECTOR
- Milníky: Registrace (s datem), 1. prodej, 5 prodejů (Makléř), 10 prodejů, 20 prodejů (Senior), 50 prodejů (Top)
- Vizuální vertikální linka s tečkami, achieved = oranžová/checkmark, neachieved = šedá ✅

### 6. Badges (gamifikace) — ✅ PASS
- Sekce "Ocenění a odznaky" — line 811–837
- Využívá `BADGE_CATALOG` z `@/lib/badge-catalog`
- Grid layout: ikona + název + popis
- Podmíněno `badges.length > 0` ✅

---

## Souhrn

| Požadavek | Stav |
|-----------|------|
| Kontakt CTA (Zavolat + Napsat zprávu) | ✅ OK |
| Ověření badges (identita, telefon, e-mail) | ✅ OK |
| Progress bar (level) | ⚠️ GAP — JUNIOR nevidí |
| Sociální sítě (IG, FB, YT) | ✅ OK |
| Timeline (milníky) | ✅ OK |
| Badges (gamifikace) | ✅ OK |

---

## Doporučená oprava (pro implementátora)

V `ProfileClient.tsx` kolem line 375–384 — vykreslit progress bar i pro JUNIOR level:

```tsx
// Současný stav — progress bar se nezobrazí pro JUNIOR (levelLabel je null)
{levelLabel && (
  <div className="shrink-0 flex flex-col items-end gap-1">
    <Badge variant="top">{levelLabel}</Badge>
    {user.role === "BROKER" && (
      <LevelProgressBar level={user.level} totalSales={user.totalSales} size="md" />
    )}
  </div>
)}

// Oprava — přidat samostatný blok pro JUNIOR nebo zahrnout do podmínky
{user.role === "BROKER" && !levelLabel && (
  <div className="shrink-0">
    <LevelProgressBar level={user.level} totalSales={user.totalSales} size="md" />
  </div>
)}
```

**Závěr:** Vrátit k implementátorovi na opravu JUNIOR progress bar visibility.
