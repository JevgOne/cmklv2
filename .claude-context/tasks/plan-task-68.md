# Plán — Task #68: Fix nested `<a>` na /makler/dashboard

**Priorita:** NORMAL (HTML spec violation + a11y, ne render blocker)
**Typ:** Bugfix (HTML restruktura)
**Zadal:** team-lead 2026-04-06 (z test-chrome #67)
**Bug:** React/HTML validation error: `<a> cannot contain a nested <a>`

---

## 1. Cíl

Odstranit nested `<a>` violation v 2 komponentech používaných na `/makler/dashboard`:
1. `components/pwa/dashboard/NewLeadsSection.tsx`
2. `components/pwa/dashboard/FollowUpSection.tsx`

Bez change UX (cards zůstávají interaktivní, telefon zůstává `tel:` link).

## 2. Discovery — 2 nálezy (NE jen 1)

Test-chrome reportoval bug, ale neidentifikoval ho přesně. **Discovery našel 2 výskyty stejného anti-patternu.** Page samotná `app/(pwa)/makler/dashboard/page.tsx` je čistá — bug je v importovaných komponentech.

### 2.1 ❌ NÁLEZ #1 — `NewLeadsSection.tsx:116-142`

```tsx
<Link href={`/makler/leads/${lead.id}`} className="flex-1 no-underline">
  <div>{lead.name}</div>
  <div>{brand} · {city}</div>
  <div className="text-xs text-gray-400 mt-1">
    <a
      href={`tel:${lead.phone}`}
      onClick={(e) => e.stopPropagation()}   // ⬅ pokus o workaround
      className="text-orange-500 font-medium no-underline"
    >
      {lead.phone}
    </a>
  </div>
</Link>
```

**Problém:** `<Link>` z Next.js renderuje `<a>`. Uvnitř je další `<a href="tel:...">`. HTML spec violation. `e.stopPropagation()` zabrání click bubbling, ale **HTML struktura zůstává neplatná** — autor evidentně věděl o klikání, ale ne o struktuře.

### 2.2 ❌ NÁLEZ #2 — `FollowUpSection.tsx:62-97`

```tsx
<Link href={`/makler/contacts/${contact.id}`} className="block no-underline">
  <Card hover className="p-3">
    <div className="flex items-center justify-between">
      <div>
        <div>{contact.name}</div>
        <div>{contact.followUpNote || contact.phone}</div>
      </div>
      <a
        href={`tel:${contact.phone}`}
        onClick={(e) => e.stopPropagation()}   // ⬅ stejný workaround
        className="w-9 h-9 bg-success-50 text-success-500 rounded-lg ..."
      >
        <svg>{phone icon}</svg>
      </a>
    </div>
  </Card>
</Link>
```

**Identický anti-pattern.** Outer `<Link>` na detail kontaktu, vnitřní `<a>` na vytočení telefonu.

### 2.3 Ostatní dashboard komponenty — ČISTÉ ✅

Ověřeno grepem `<Link|<a` v `components/pwa/dashboard/`:
- `AddVehicleCTA.tsx` — 3× `<Link>`, žádný nested `<a>` ✅ (team-leadův první tip — falešný)
- `DraftsList.tsx` — `<Link>` wrappuje `<Card>` (div), žádný nested `<a>` ✅
- `NotificationsList.tsx` — žádné `<Link>` ani `<a>` ✅
- `StatsRow.tsx` — žádné `<Link>` ani `<a>` ✅
- `LevelBadge` (in page.tsx) — visual only ✅
- Page samotná — `<Link>` wrappuje `<Card>` pro leaderboard pozici (řádky 117-138), Card je `<div>`, žádný nested `<a>` ✅
- `expiringExclusives` link na page.tsx (řádek 161) — single `<Link>` v `<Card>`, žádný nested ✅

→ **Pouze 2 soubory potřebují fix.**

## 3. Volba fixu — proč Option E (restrukturalizace)

| Option | Popis | Pros | Cons | Verdict |
|--------|-------|------|------|---------|
| A — Card-level onClick + router.push | Outer `<Link>` → `<div onClick>` + `useRouter().push()` | Zachová UX celé karty | Není SSR prefetch, ztráta middle-click "open in new tab", a11y horší (`<div>` není focusable, vyžaduje role+tabIndex+keyDown handler) | ❌ Komplexnější |
| B — Přesun `<a tel:>` mimo outer Link | Strukturovat aby telefon byl mimo Link element | Čistý HTML, žádný JS | Zhroutí se layout (telefon jinde) | ❌ Layout regression |
| C — `<button>` místo outer `<Link>` | Simulace navigation pomocí JS | HTML semantic | `<button>` taky nesmí obsahovat interactive content (link) — stejný spec violation. **Neřeší** | ❌ |
| D — Onclick `<span>` místo `<a tel:>` | Telefon jako span s `window.location.href` | HTML čisté | A11y regression (screen reader nevidí "phone link"), žádný native dialer integration, kontextové menu nefunguje | ❌ A11y |
| **E — Restrukturalizace: dva sourozenci místo nesting** | Outer card jako Card+flex, jméno+detail v Linku, telefon v separátním `<a>` | Čistý HTML, dva separate links, perfect a11y, žádný JS, žádný CSS hack | Drobná UX změna — kliknutí mimo "jméno" oblast neaktivuje detail link (jen na text/area karty) | ✅ **DOPORUČENO** |
| F — Stretched link CSS pattern | `<a class="absolute inset-0">` overlay nad celou kartou | Cela karta klikatelná i bez nesting | `pointer-events-none` na text → nelze selektovat text pro copy, vyžaduje `aria-label` | 🟡 Backup pokud team-lead chce zachovat full-card click |

**→ Option E** vybráno protože:
1. **Žádný JS** — čistě HTML restruktura
2. **Perfect a11y** — 2 separate semantic links (detail navigation + tel: dialer)
3. **Zero CSS hacks** — žádný `pointer-events`, žádný `position: absolute`
4. **Trade-off akceptovatelný** — uživatel typicky klikne přesně na jméno nebo na phone button. „Mrtvá zóna" mezi nimi je drobná.
5. Pokud chce team-lead full-card-clickable UX, **Option F** je připravená jako backup (sekce 5.3).

## 4. Dotčené soubory

| # | Soubor | Akce | Řádky | Riziko |
|---|--------|------|-------|--------|
| 1 | `components/pwa/dashboard/NewLeadsSection.tsx` | Restruktura JSX (řádky 113-164) | ~25 řádků | nízké — JSX only, žádná logika |
| 2 | `components/pwa/dashboard/FollowUpSection.tsx` | Restruktura JSX (řádky 61-98) | ~20 řádků | nízké |

**Žádné** změny v API, validátorech, schématu Prisma, page.tsx, Card component, jiných dashboard komponentách.

## 5. Detailní změny

### 5.1 `NewLeadsSection.tsx` — restruktura

**File:** `components/pwa/dashboard/NewLeadsSection.tsx`

**Před (řádky 113-164):**
```tsx
{leads.map((lead) => (
  <Card key={lead.id} className="p-4">
    <div className="flex items-start justify-between gap-3">
      <Link
        href={`/makler/leads/${lead.id}`}
        className="flex-1 no-underline"
      >
        <div className="font-semibold text-gray-900 text-sm">
          {lead.name}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {[lead.brand && lead.model ? `${lead.brand} ${lead.model}` : lead.brand, lead.city]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          <a
            href={`tel:${lead.phone}`}
            className="text-orange-500 font-medium no-underline"
            onClick={(e) => e.stopPropagation()}
          >
            {lead.phone}
          </a>
        </div>
      </Link>

      <div className="flex gap-2 flex-shrink-0">
        <Button variant="success" ... onClick={() => handleAccept(lead.id)}>Přijmout</Button>
        <Button variant="ghost" ... onClick={() => handleRejectOpen(lead.id)}>Odmítnout</Button>
      </div>
    </div>
  </Card>
))}
```

**Po:**
```tsx
{leads.map((lead) => (
  <Card key={lead.id} className="p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        {/* Detail navigation — jméno + vůz */}
        <Link
          href={`/makler/leads/${lead.id}`}
          className="block no-underline"
        >
          <div className="font-semibold text-gray-900 text-sm">
            {lead.name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {[lead.brand && lead.model ? `${lead.brand} ${lead.model}` : lead.brand, lead.city]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </Link>

        {/* Tel: link — sourozenec, ne potomek */}
        <div className="text-xs text-gray-400 mt-1">
          <a
            href={`tel:${lead.phone}`}
            className="text-orange-500 font-medium no-underline"
          >
            {lead.phone}
          </a>
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <Button variant="success" ... onClick={() => handleAccept(lead.id)}>Přijmout</Button>
        <Button variant="ghost" ... onClick={() => handleRejectOpen(lead.id)}>Odmítnout</Button>
      </div>
    </div>
  </Card>
))}
```

**Změny:**
- Outer `<Link>` se zúžil pouze na `name + brand/model/city` div
- `<a tel:>` přesunut na sourozenec position (mimo Link)
- `e.stopPropagation` odstraněn (nepotřebný — element je mimo Link)
- Přidán `min-w-0` na wrapper div pro flex truncation safety

### 5.2 `FollowUpSection.tsx` — restruktura

**File:** `components/pwa/dashboard/FollowUpSection.tsx`

**Před (řádky 61-98):**
```tsx
{contacts.map((contact) => (
  <Link
    key={contact.id}
    href={`/makler/contacts/${contact.id}`}
    className="block no-underline"
  >
    <Card hover className="p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm text-gray-900">{contact.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{contact.followUpNote || contact.phone}</div>
        </div>
        <a
          href={`tel:${contact.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="w-9 h-9 bg-success-50 text-success-500 rounded-lg flex items-center justify-center no-underline"
        >
          <svg>{phone icon}</svg>
        </a>
      </div>
    </Card>
  </Link>
))}
```

**Po:**
```tsx
{contacts.map((contact) => (
  <Card key={contact.id} hover className="p-3">
    <div className="flex items-center justify-between gap-3">
      {/* Detail navigation — jméno + note */}
      <Link
        href={`/makler/contacts/${contact.id}`}
        className="flex-1 min-w-0 no-underline"
      >
        <div className="font-semibold text-sm text-gray-900">{contact.name}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {contact.followUpNote || contact.phone}
        </div>
      </Link>

      {/* Tel: button — sourozenec, ne potomek */}
      <a
        href={`tel:${contact.phone}`}
        aria-label={`Zavolat ${contact.name}`}
        className="w-9 h-9 bg-success-50 text-success-500 rounded-lg flex items-center justify-center no-underline flex-shrink-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2..." clipRule="evenodd" />
        </svg>
      </a>
    </div>
  </Card>
))}
```

**Změny:**
- `key` přesunut na `Card` (předtím na Link)
- Outer `<Link>` odstraněn z wrapping pozice
- Card je teď top-level, uvnitř flex s 2 dětmi: Link (info) + `<a tel:>` (button)
- `<Link>` zúžen pouze na info část
- `<a tel:>` přesunut jako sourozenec
- Přidán `aria-label="Zavolat {name}"` (telefon-button má jen ikonu, screen reader by jinak nevěděl účel)
- `e.stopPropagation` odstraněn

### 5.3 (BACKUP) Option F — stretched link, pokud team-lead chce full-card-clickable

**Pouze pokud nechceme akceptovat trade-off Option E.**

```tsx
<Card key={lead.id} className="p-4 relative">
  <div className="flex items-start justify-between gap-3">
    <div className="flex-1 min-w-0">
      {/* Stretched link — overlay pokrývá celou kartu */}
      <Link
        href={`/makler/leads/${lead.id}`}
        aria-label={`Detail leadu ${lead.name}`}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 pointer-events-none font-semibold text-gray-900 text-sm">
        {lead.name}
      </div>
      <div className="relative z-10 pointer-events-none text-xs text-gray-500 mt-0.5">
        {brand} · {city}
      </div>
      <div className="relative z-10 text-xs text-gray-400 mt-1">
        <a href={`tel:${lead.phone}`} className="pointer-events-auto ...">
          {lead.phone}
        </a>
      </div>
    </div>
    <div className="relative z-10 flex gap-2 pointer-events-auto">
      <Button>Přijmout</Button>
      <Button>Odmítnout</Button>
    </div>
  </div>
</Card>
```

**Trade-offs Option F:**
- ✅ Cela karta klikatelná
- ❌ Text není selectable (`pointer-events-none`)
- ❌ Vyžaduje `aria-label` na empty `<Link>`
- ❌ Vyšší CSS komplexita

**Doporučení:** Začít s **Option E**, eskalovat na **F** jen pokud uživatel hlásí UX regression.

## 6. Edge cases

| Scenario | Handling |
|----------|----------|
| Uživatel klikne na jméno | Navigace na detail leadu/kontaktu ✅ |
| Uživatel klikne na telefon | Native dialer (`tel:`) ✅ |
| Uživatel klikne mezi jménem a tel: | Žádná akce (Option E trade-off — akceptovatelné) |
| Uživatel tap na "Přijmout/Odmítnout" tlačítka | Action handlery fungují ✅ (předtím i potom) |
| Screen reader user | Slyší 2 separate links: "Lead detail Jan Novák" + "Phone +420 123 456 789" — jasné cíle ✅ |
| Keyboard navigace | Tab vstoupí do linku → tab do telefonu → tab do "Přijmout" → tab do "Odmítnout" ✅ |
| Long lead name | `min-w-0` na wrapper → flex truncation funguje ✅ |
| Empty `lead.brand`/`lead.city` | `.filter(Boolean).join(" · ")` zachovává správný separator ✅ |

## 7. Out of scope

- ❌ **Refactoring `Card` komponenty** — Card zůstává `<div>` wrapper, žádná změna API.
- ❌ **Vytvoření `<LeadCard>` shared component** — yagni, jen 2 use cases.
- ❌ **Změna stylování (colors, spacing)** — pouze HTML restruktura, vizuál je shodný.
- ❌ **Audit ostatních PWA stránek na nested anchors** — follow-up #68a (audit `(pwa)/` nebo celý codebase).
- ❌ **Storybook test pro tyto komponenty** — projekt zatím nemá Storybook (zkontrolováno).
- ❌ **Unit test pro JSX restrukturu** — vizuální regression je zachycena E2E (test-chrome retest #67).

## 8. Acceptance criteria

**Code changes:**
- [ ] `NewLeadsSection.tsx` — outer `<Link>` zúžen na `name + brand/city`, `<a tel:>` přesunut jako sourozenec
- [ ] `NewLeadsSection.tsx` — `e.stopPropagation` odstraněn z `<a tel:>`
- [ ] `FollowUpSection.tsx` — Card promoted na top-level, `<Link>` zúžen, `<a tel:>` jako sourozenec
- [ ] `FollowUpSection.tsx` — `aria-label="Zavolat {name}"` na phone button
- [ ] `FollowUpSection.tsx` — `e.stopPropagation` odstraněn
- [ ] Žádný React render warning v dev console
- [ ] Žádný `<a> cannot contain a nested <a>` HTML validator error

**Build:**
- [ ] `npm run build` → 0 errors
- [ ] `npm run lint` → 0 errors

**E2E (test-chrome retest #67 nebo manual):**
- [ ] `/makler/dashboard` načte bez warnings
- [ ] Klik na jméno leadu → navigace `/makler/leads/[id]`
- [ ] Klik na telefon leadu → native dialer (mobile) / dial dialog (desktop)
- [ ] Klik "Přijmout" / "Odmítnout" tlačítka funguje
- [ ] Klik na jméno follow-up kontaktu → navigace `/makler/contacts/[id]`
- [ ] Klik na phone-button (zelená ikona) → dialer
- [ ] Žádný visual regression — karty vypadají identicky

## 9. Risks

1. **UX regression — kliknutí mimo "jméno"** (mezery v kartě, padding) v Option E neaktivují detail link.
   - **Severity:** LOW
   - **Mitigation:** Pokud uživatel hlásí, eskalovat na Option F (stretched link)
2. **Layout shift při změně outer Link → Card** — `Card` má built-in `overflow-hidden` a `rounded-2xl`, předtím je `Link` neaplikoval. Vizuálně neměl by se měnit, ale ověřit v retest.
   - **Severity:** LOW
   - **Mitigation:** Visual diff v test-chrome #67 retest
3. **`hover:` styles na FollowUpSection Card** — předtím `Card hover` byl uvnitř Linku, hover working. Po změně je Card top-level, hover stále funguje (Card definuje `hover:-translate-y-1 hover:shadow-card-hover` na `<div>` direct).
   - **Severity:** TRIVIAL
   - **Mitigation:** Zachováno
4. **Accessibility tab order change** — předtím outer Link byl jeden focusable element, teď jsou 2 (Link + tel: a). Tab order: Link → tel-a → buttons. Lepší než předtím.
   - **Severity:** N/A (zlepšení)
5. **`stopPropagation` removal** — žádný JS handler neposlouchá click bubbling z Linku (ověřeno čtením kódu). Bezpečné odstranění.
   - **Severity:** N/A

## 10. Open questions pro team-leada

1. **Option E vs Option F** — chceš zachovat full-card-clickable UX (Option F, stretched link), nebo akceptovat zúžený clickable area (Option E, restrukturalizace)?
   - **Default: Option E** (jednodušší, čistší a11y, lepší pro maintenance)
2. **Audit ostatních PWA stránek** — chceš follow-up task na sweep všech `(pwa)/` komponent na nested anchors? Test-chrome #67 prošel jen `/dashboard`, nikdo nezkontroloval ostatní stránky.
   - **Default: ANO** — follow-up #68a (planovac plán + grep `<Link[^>]*>[\s\S]*<a\s` napříč codebase)
3. **Aria-label na phone button** — preferuješ "Zavolat {name}" nebo "Zavolat {phone}"?
   - **Default:** "Zavolat {name}" (kontextové, screen reader user už ví jméno z předchozího Linku)

## 11. Velikost a status

- **Změny:** 2 soubory, ~45 řádků JSX restrukturalizace
- **Rizikovost:** nízká (HTML only, žádná logika, žádná state)
- **Testování:** build + lint + manual click-through + test-chrome retest
- **Souběžnost:** Může běžet paralelně s #65a a #66a (disjunktní soubory)
- **Status plánu:** ready k dispatch na implementátora

---

## Poznámka pro team-leada

**Klíčový insight:** Test-chrome #67 reportoval bug ale neidentifikoval ho přesně. Discovery našel **2 výskyty** identického anti-patternu (NewLeadsSection + FollowUpSection), nejen 1. Oba mají `e.stopPropagation()` workaround který autoři přidali — věděli o klikání, ale ne o HTML validation.

`AddVehicleCTA` (tvůj první tip) je čistý — Link wrappuje jen `<div>`, žádný nested anchor.

Doporučuju **Option E** (restrukturalizace, ne CSS hack). Option F (stretched link) je backup pokud chceš zachovat full-card-clickable. Po implementaci je třeba retest #67 nebo nový test-chrome run aby validation error zmizel.

**Follow-up #68a** doporučuji vytvořit pro sweep všech PWA komponent na nested anchors — `NewLeadsSection` + `FollowUpSection` měly identický pattern, je možné že se objeví i jinde (např. Messages list, Contacts list).
