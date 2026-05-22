# Plan: 6 nových sekcí na profil makléře (`/profil/[slug]`)

**Stav:** PLAN
**Datum:** 2026-04-19
**Soubory k editaci:**
- `app/(web)/profil/[slug]/ProfileClient.tsx` (hlavní změny)
- `app/(web)/profil/[slug]/page.tsx` (drobné rozšíření dat)

**Soubory READ-ONLY (reference):**
- `lib/gamification-levels.ts` — level progress calculation
- `components/ui/LevelProgressBar.tsx` — existing progress bar
- `lib/badge-catalog.ts` — 11 badge definitions
- `prisma/schema.prisma` — User + ProfileBadge model

---

## Aktuální struktura ProfileClient.tsx

```
L299-317  Cover photo (hero banner)
L320-449  Hero card (avatar, name, role, level badge+progress, tags, stats, actions)
L452-485  "O makléři" card (bio, motto, favourite brands)
L487-569  "Specializace" card (vehicle types, services, languages, experience)
L571-665  "Kontakt" card (phone, website, warehouse, social links as text)
L667-723  Items tabs card (vehicles/listings/parts grid + pagination)
L725-749  "Ocenění a odznaky" card (badges as flex-wrap pills)
```

---

## Sekce 1: Kontaktní CTA

### Stav
Existuje jediné tlačítko "Kontaktovat" (tel: link, L432-438) pro ne-vlastníky. Chybí mailto a dva tlačítka vedle sebe.

### Změny
**Soubor:** `ProfileClient.tsx` L422-446 (Actions blok)

Nahradit stávající akční tlačítka (pro non-owner) dvěma CTA:

```tsx
{/* Actions */}
<div className="flex flex-wrap gap-2 mt-5">
  {isOwner ? (
    <Link
      href="/muj-ucet/profil"
      className="inline-flex items-center gap-1.5 py-2 px-4 bg-orange-500 text-white font-semibold rounded-full text-sm no-underline hover:bg-orange-600 transition-colors"
    >
      Upravit profil
    </Link>
  ) : (
    <>
      {user.phone && (
        <a
          href={`tel:${user.phone}`}
          className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-orange-500 text-white font-semibold rounded-full text-sm no-underline hover:bg-orange-600 transition-colors shadow-sm"
        >
          {/* Phone SVG icon */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Zavolat
        </a>
      )}
      {user.email && (
        <a
          href={`mailto:${user.email}`}
          className="inline-flex items-center gap-1.5 py-2.5 px-5 border-2 border-orange-500 text-orange-600 font-semibold rounded-full text-sm no-underline hover:bg-orange-50 transition-colors"
        >
          {/* Envelope SVG icon */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Napsat zprávu
        </a>
      )}
    </>
  )}
  <button onClick={handleShare} className="...existing...">
    {copied ? "Zkopírováno!" : "Sdílet profil"}
  </button>
</div>
```

### Data
- `user.phone` — already conditionally set in page.tsx L165 (`showPhone ? phone : null`)
- `user.email` — already conditionally set in page.tsx L166 (`showEmail ? email : null`)
- **No changes to page.tsx needed.**

---

## Sekce 2: Ověření badges

### Stav
Neexistuje. Žádné verification indicators.

### Změny
**Soubor:** `ProfileClient.tsx` — vložit MEZI subtitle (L344-348) a tags (L362-372)

Přidat inline řadu ověřovacích odznaků:

```tsx
{/* Verification badges — after subtitle, before tags */}
<div className="flex flex-wrap gap-2 mt-2">
  {/* Identity verified: level >= BROKER (completed onboarding) */}
  {["BROKER", "SENIOR", "TOP"].includes(user.level) && (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      Ověřená identita
    </span>
  )}
  {/* Phone verified: phone exists (showPhone=true AND phone in DB) */}
  {user.phone && (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Ověřený telefon
    </span>
  )}
  {/* Email verified: always true (NextAuth guarantees it) */}
  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
    Ověřený e-mail
  </span>
</div>
```

### Logika derivace
| Badge | Podmínka | Důvod |
|---|---|---|
| Ověřená identita | `user.level` in BROKER/SENIOR/TOP | Onboarding = identity check |
| Ověřený telefon | `user.phone !== null` | phone exists + showPhone = true |
| Ověřený e-mail | vždy | NextAuth requires verified email |

### Data
- Vše už dostupné v `ProfileUser` interface. **No changes to page.tsx.**

---

## Sekce 3: Progress bar (level %)

### Stav
**UŽ IMPLEMENTOVÁNO** — `LevelProgressBar` je integrovaný v hero sekci (L355-357):

```tsx
{user.role === "BROKER" && (
  <LevelProgressBar level={user.level} totalSales={user.totalSales} size="md" />
)}
```

### Změny
**ŽÁDNÉ** — tato sekce je hotová. Komponenta `LevelProgressBar` (components/ui/LevelProgressBar.tsx) korektně počítá progress pomocí `calculateLevelProgress()` z `lib/gamification-levels.ts`.

Progrese: JUNIOR(0-4) → BROKER(5-19) → SENIOR(20-49) → TOP(50+). Na TOP úrovni se progress bar skrývá.

---

## Sekce 4: Sociální sítě (icon upgrade)

### Stav
Sociální sítě existují v Kontakt kartě (L626-662) jako plain text links ("Instagram", "Facebook", "YouTube"). Chybí ikony a výraznější hover efekty.

### Změny
**Soubor:** `ProfileClient.tsx` — nahradit textové odkazy (L630-661) SVG ikonami:

```tsx
{user.socialLinks &&
  (user.socialLinks.instagram ||
    user.socialLinks.facebook ||
    user.socialLinks.youtube) && (
    <div className="flex gap-3 pt-2">
      {user.socialLinks.instagram && (
        <a
          href={user.socialLinks.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gradient-to-tr hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-200"
          title="Instagram"
        >
          <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        </a>
      )}
      {user.socialLinks.facebook && (
        <a
          href={user.socialLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-600 hover:text-white transition-all duration-200"
          title="Facebook"
        >
          <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>
      )}
      {user.socialLinks.youtube && (
        <a
          href={user.socialLinks.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-600 hover:text-white transition-all duration-200"
          title="YouTube"
        >
          <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </a>
      )}
    </div>
  )}
```

### Data
- `user.socialLinks` (JSONB: `{ instagram?, facebook?, youtube? }`) — already in ProfileUser.
- **No changes to page.tsx.**

---

## Sekce 5: Timeline / Milníky

### Stav
Neexistuje. Pouze text "Člen od {date}" v subtitle.

### Změny
**Soubor:** `ProfileClient.tsx` — nová Card sekce PŘED "Kontakt" kartou (tedy za "Specializace" kartou, před `{hasContactCard && ...}`)

**Umístění:** Mezi L569 (konec Specializace) a L571 (začátek Kontakt).

### Data derivace (no new DB queries)
Milníky se generují z existujících dat v `ProfileUser`:
- `createdAt` → "Člen od {datum}"
- `totalSales >= 1` → "První prodej"
- `totalSales >= 5` → "5 prodejů" (= BROKER level milestone)
- `totalSales >= 10` → "10 prodejů"
- `totalSales >= 20` → "Senior makléř" (= SENIOR level milestone)
- `totalSales >= 50` → "Top makléř" (= TOP level milestone)

**Poznámka:** Nemáme přesná data jednotlivých milníků (to by vyžadovalo novou tabulku). Zobrazíme je jako dosažené/nedosažené checkmarky s member since jako kotevním bodem.

### JSX struktura

```tsx
{/* Timeline / Milníky — show for BROKER-like roles with any activity */}
{["BROKER", "MANAGER", "REGIONAL_DIRECTOR"].includes(user.role) && (
  <Card className="p-6 sm:p-8">
    <h2 className="text-xl font-bold text-gray-900 mb-5">Milníky</h2>
    <div className="relative pl-6 space-y-4">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-gray-200" />

      {/* Milestone items — always shown, greyed out if not achieved */}
      {[
        { sales: 0,  label: `Registrace — ${memberSince}`, achieved: true },
        { sales: 1,  label: "První prodej",                achieved: user.totalSales >= 1 },
        { sales: 5,  label: "5 prodejů — Makléř",          achieved: user.totalSales >= 5 },
        { sales: 10, label: "10 prodejů",                  achieved: user.totalSales >= 10 },
        { sales: 20, label: "20 prodejů — Senior makléř",  achieved: user.totalSales >= 20 },
        { sales: 50, label: "50 prodejů — Top makléř",     achieved: user.totalSales >= 50 },
      ].map((m) => (
        <div key={m.sales} className="relative flex items-center gap-3">
          {/* Dot */}
          <div
            className={`absolute -left-6 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
              m.achieved
                ? "bg-orange-500 border-orange-500"
                : "bg-white border-gray-300"
            }`}
          >
            {m.achieved && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className={`text-sm ${m.achieved ? "text-gray-900 font-medium" : "text-gray-400"}`}>
            {m.label}
          </span>
        </div>
      ))}
    </div>
  </Card>
)}
```

### Data
- Vše z `user.totalSales`, `user.createdAt`, `user.role`. **No changes to page.tsx.**

---

## Sekce 6: Badges / Odznaky (upgrade layoutu)

### Stav
Existuje (L725-749). Badges se zobrazují jako flex-wrap pills. `BADGE_CATALOG` v `lib/badge-catalog.ts` má 11 definic. `ProfileBadge` model existuje v DB.

### Změny
**Soubor:** `ProfileClient.tsx` L725-749 — upgrade z flex-wrap pills na grid s většími kartami obsahujícími description.

```tsx
{badges.length > 0 && (
  <Card className="p-6 sm:p-8">
    <h2 className="text-xl font-bold text-gray-900 mb-4">
      Ocenění a odznaky
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {badges.map((badge) => {
        const info = BADGE_CATALOG[badge.badgeKey];
        if (!info) return null;
        return (
          <div
            key={badge.badgeKey}
            className="flex flex-col items-center text-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
          >
            <span className="text-3xl mb-2">{info.icon}</span>
            <span className="text-sm font-semibold text-gray-800">
              {info.name}
            </span>
            <span className="text-xs text-gray-500 mt-0.5">
              {info.description}
            </span>
          </div>
        );
      })}
    </div>
  </Card>
)}
```

### Data
- `badges` z `initialData.badges` (fetched in page.tsx via `profileBadges`). **No changes to page.tsx.**
- `BADGE_CATALOG` already imported (L13).

---

## Finální layout (po změnách)

```
Cover photo (hero banner)
Hero card:
  - Avatar + Name + Role subtitle
  - NEW: Verification badges (ověřená identita, telefon, email)
  - Level badge + Progress bar (already exists)
  - Tags
  - Stats row
  - CHANGED: CTA buttons (Zavolat + Napsat zprávu) for non-owner
  - Share button
"O makléři" card (unchanged)
"Specializace" card (unchanged)
NEW: "Milníky" card (vertical timeline)
"Kontakt" card (social links upgraded to SVG icons)
Items tabs card (unchanged)
"Ocenění a odznaky" card (upgraded to grid layout)
```

---

## Souhrn změn

| # | Sekce | Typ | Soubor | Řádky |
|---|---|---|---|---|
| 1 | Kontaktní CTA | EDIT | ProfileClient.tsx | L422-446 |
| 2 | Ověření badges | ADD | ProfileClient.tsx | after L348 |
| 3 | Progress bar | DONE | — | L355-357 |
| 4 | Sociální sítě icons | EDIT | ProfileClient.tsx | L630-661 |
| 5 | Timeline/milníky | ADD | ProfileClient.tsx | after L569 |
| 6 | Badges grid | EDIT | ProfileClient.tsx | L725-749 |

**Nové soubory:** 0
**Nové DB tabulky/sloupce:** 0
**Změny v page.tsx:** 0

---

## STOP pravidla

- **STOP-1:** Pokud `socialLinks` JSON struktura v DB neodpovídá `{ instagram?, facebook?, youtube? }` — eskalovat.
- **STOP-2:** Pokud `showPhone`/`showEmail` nefunguje správně v page.tsx — eskalovat.
- **STOP-3:** Pokud `ProfileBadge` tabulka nemá data — badge sekce bude prázdná (to je OK, ale ověřit).

## Acceptance Criteria

1. Na profilu non-owner vidí dvě CTA tlačítka (Zavolat + Napsat zprávu) pokud má makléř phone/email viditelné
2. U jména se zobrazují zelené verification badges
3. Progress bar funguje (již implementováno)
4. Social links mají SVG ikony s brand-color hover efekty
5. Timeline karta zobrazuje milníky s vizuální indikací dosažení
6. Badges sekce používá grid layout s description textem
7. Build projde bez chyb (`npm run build`)
8. Žádné nové DB migrace nejsou potřeba
