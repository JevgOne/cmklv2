# Plan: Klik.cz / ePojisteni.cz affiliate integrace — pojištění kalkulačka

**Task:** #29
**Status:** PLAN READY
**Datum:** 2026-05-22
**Typ:** Enhancement (monetizace + UX upgrade)
**Závažnost:** MEDIUM — revenue stream + lepší UX

---

## 1. Průzkum affiliate programů

### Hlavní hráči na českém trhu:

| Agregátor | Affiliate | Provize | Cookie | Integrace | Poznámka |
|-----------|-----------|---------|--------|-----------|----------|
| **ePojisteni.cz** | ✅ Admitad / eSpolupráce | 455 Kč/lead (CPL) | — | Text link, banner, **iframe formulář** | Největší srovnávač v ČR, ~10 000 smluv/týden |
| **Klik.cz** | ✅ VIVnetworks | 76,50 Kč/konverze | 28 dní | Affiliate link | Klik.cz a ePojisteni.cz patří do Netrisk Group (sloučeny 2023-2024) |
| **Top-Pojištění.cz** | ✅ | Neuvedeno | — | Affiliate link | Menší, méně info |
| **Pojisteni.cz** | ✅ WEDOS Affiliate | 15-50% z pojistného | 90 dní | Link, banner, kupón | Jen odpovědnost + úrazové |
| **Srovnator.cz** | ❓ Nezjištěno | — | — | — | Žádné public affiliate info |
| **Ušetřeno.cz** | ❓ Nezjištěno | — | — | — | Žádné public affiliate info |

### DOPORUČENÍ: ePojisteni.cz (primární) + Klik.cz (sekundární)

**Důvody:**
1. **ePojisteni.cz nabízí IFRAME formulář** — nejplynulejší integrace (uživatel neodchází z webu)
2. **455 Kč/lead** — výrazně vyšší provize než Klik.cz (76,50 Kč)
3. **Netrisk Group** — ePojisteni.cz a Klik.cz patří pod stejnou skupinu → partnerství s jedním = přístup k oběma
4. **10 000 smluv/týden** — prokázaná konverzní síla
5. **Registrace zdarma** přes espoluprace.cz

**Klik.cz jako fallback:** Nižší provize, jen affiliate link (žádný iframe). Ale patří do stejné skupiny → jednání s Netrisk Group může otevřít lepší podmínky.

---

## 2. Aktuální stav pojištění na platformě

### Co existuje:

**`PojisteniCalc.tsx`** (325 řádků) — plně funkční orientační kalkulačka:
- Typ pojištění (povinné/havarijní/obojí)
- Objem motoru (4 kategorie)
- Stáří vozu (4 kategorie)
- Cena vozu (pro havarijní)
- Okamžitý výpočet rozsahu (min–max Kč/rok)
- Kontaktní formulář "Chci přesnou nabídku" (SPZ + jméno + telefon → `/api/contact`)
- Disclaimer: "Orientační výpočet"

### Co CHYBÍ:

1. **Žádné napojení na reálné srovnání** — po kalkulaci uživatel čeká na telefonát od specialisty
2. **Žádná monetizace** — kontaktní formulář jde do `/api/contact`, žádná provize
3. **Žádný self-service** — uživatel si nemůže sjednat pojištění sám

---

## 3. Hybrid model: Naše kalkulačka + ePojisteni.cz affiliate

### Koncept flow:

```
┌─────────────────────────────────────────────────────────┐
│  Krok 1: Naše orientační kalkulačka                     │
│                                                          │
│  [Typ pojištění] [Motor] [Stáří] [Cena vozu]           │
│                                                          │
│  ┌─────────────────────────────────────┐                │
│  │ Orientační roční pojistné:          │                │
│  │ Povinné ručení: 2 400 – 4 800 Kč   │                │
│  │ Havarijní:      6 200 – 12 400 Kč  │                │
│  │ Celkem:         8 600 – 17 200 Kč  │                │
│  └─────────────────────────────────────┘                │
│                                                          │
│  ───── Co chcete dál? ─────                              │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │ 🔍 Porovnat      │  │ 📞 Chci přesnou  │             │
│  │ pojišťovny       │  │ nabídku od nás   │             │
│  │ na ePojisteni.cz │  │                  │             │
│  │                  │  │ (SPZ + telefon)  │             │
│  │ [AFFILIATE CTA]  │  │ [KONTAKTNÍ FORM] │             │
│  └──────────────────┘  └──────────────────┘             │
│                                                          │
│  Krok 2A: ePojisteni iframe    Krok 2B: Náš formulář    │
│  (NOVÉ — affiliate monetizace) (STÁVAJÍCÍ — zachovat)   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Proč HYBRID (ne jen affiliate):

1. **Naše kalkulačka** — nabízí okamžitý odhad BEZ zadávání SPZ/RČ → nižší bariéra
2. **ePojisteni.cz** — přesné ceny od všech pojišťoven → konverze + provize
3. **Náš formulář** — pro uživatele, kteří chtějí osobní obsluhu od CarMakléře
4. **Monetizace:** ePojisteni affiliate = pasivní příjem, formulář = aktivní prodej

---

## 4. Implementační plán

### Krok 1: Registrace na eSpolupráce.cz

**Manuální krok (uživatel musí):**
1. Registrace na https://www.espoluprace.cz/partner/registrace
2. Po schválení získá:
   - Affiliate ID (partner tag)
   - Tracking kód pro iframe formulář
   - Bannerové kreativy
3. Uložit affiliate ID do `.env`:
   ```
   EPOJISTENI_AFFILIATE_ID=xxx
   EPOJISTENI_IFRAME_URL=https://www.epojisteni.cz/...?partner=xxx
   ```

**STOP: Tento krok MUSÍ proběhnout PŘED implementací. Bez affiliate ID nelze integrovat.**

### Krok 2: Přidat affiliate CTA do PojisteniCalc

**Soubor:** `components/web/PojisteniCalc.tsx` (EDIT)

Po zobrazení orientačního výsledku přidat DVA CTA tlačítka místo jednoho:

```tsx
{/* Dual CTA — NOVÉ */}
{calc.hasResult && !showContact && !showAffiliate && !submitted && (
  <div className="mt-5 space-y-3">
    {/* Primary CTA — affiliate */}
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={() => setShowAffiliate(true)}
    >
      🔍 Porovnat pojišťovny — přesné ceny
    </Button>
    
    {/* Secondary CTA — kontaktní formulář (stávající) */}
    <Button
      variant="secondary"
      size="lg"
      className="w-full"
      onClick={() => setShowContact(true)}
    >
      📞 Chci osobní nabídku od specialisty
    </Button>
  </div>
)}
```

### Krok 3: Affiliate integrace — 3 varianty (dle dostupnosti)

#### Varianta A: iframe ePojisteni.cz (NEJLEPŠÍ — pokud dostupný)

```tsx
{showAffiliate && (
  <div className="mt-5 pt-5 border-t border-gray-200">
    <h3 className="font-bold text-gray-900 mb-2">
      Porovnejte nabídky všech pojišťoven
    </h3>
    <p className="text-sm text-gray-500 mb-4">
      Zadejte SPZ a za pár sekund uvidíte přesné ceny od všech pojišťoven v ČR.
    </p>
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <iframe
        src={`${process.env.NEXT_PUBLIC_EPOJISTENI_IFRAME_URL}`}
        width="100%"
        height="600"
        frameBorder="0"
        title="Srovnání pojištění — ePojisteni.cz"
        className="w-full"
        loading="lazy"
      />
    </div>
    <p className="text-xs text-gray-400 mt-2 text-center">
      Srovnání zajišťuje ePojisteni.cz — partner CarMakléř
    </p>
  </div>
)}
```

**Výhody:**
- Uživatel neodchází z webu
- Plynulý UX
- Automatický tracking (iframe URL obsahuje affiliate ID)

**Nevýhody:**
- Závisí na tom, zda ePojisteni.cz poskytne iframe URL (ověřit po registraci)
- iframe responsivita může být problematická
- CSP/CORS omezení

#### Varianta B: Affiliate link (ZÁLOŽNÍ — vždy funguje)

```tsx
{showAffiliate && (
  <div className="mt-5 pt-5 border-t border-gray-200">
    <a
      href={`https://www.epojisteni.cz/kalkulace-povinne/?partner=${process.env.NEXT_PUBLIC_EPOJISTENI_AFFILIATE_ID}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full"
      onClick={() => trackAffiliateClick("epojisteni")}
    >
      <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 transition text-center">
        <div className="text-3xl mb-2">🔍</div>
        <h3 className="font-bold text-gray-900 mb-1">
          Porovnat na ePojisteni.cz
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Přesné ceny od všech pojišťoven za 2 minuty
        </p>
        <span className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition">
          Přejít na srovnání
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </span>
        <p className="text-xs text-gray-400 mt-3">
          Otevře se ePojisteni.cz — největší srovnávač pojištění v ČR
        </p>
      </div>
    </a>
  </div>
)}
```

**Výhody:**
- Funguje VŽDY, bez technických komplikací
- Žádná iframe/CSP problematika
- Jasný tracking přes cookie (28 dní)

**Nevýhody:**
- Uživatel odchází z webu (target="_blank")
- Nižší perceived value (jen redirect)

#### Varianta C: Klik.cz fallback link

Stejný pattern jako Varianta B, ale s Klik.cz URL a affiliate ID:

```
https://www.klik.cz/povinne-ruceni/?partner=AFFILIATE_ID
```

**Použít jen pokud ePojisteni.cz odmítne / není dostupný.**

### Krok 4: Tracking affiliate kliků

**Soubor:** `lib/affiliate-tracking.ts` (NEW)

```typescript
// Logovat affiliate klik pro analytics
export function trackAffiliateClick(provider: string, context?: Record<string, string>) {
  // 1. Interní analytics (pokud existuje)
  if (typeof window !== "undefined") {
    // Google Analytics event (pokud GA existuje)
    // @ts-expect-error — gtag
    window.gtag?.("event", "affiliate_click", {
      event_category: "insurance",
      event_label: provider,
      ...context,
    });
  }
  
  // 2. Server-side log (optional — pro vlastní analytics)
  fetch("/api/analytics/affiliate-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, ...context, timestamp: new Date().toISOString() }),
  }).catch(() => {});
}
```

**API endpoint (optional):** `app/api/analytics/affiliate-click/route.ts`

Jednoduché logování do DB pro tracking konverzí:

```typescript
// Jen log, žádná business logika
await prisma.affiliateClick.create({
  data: { provider, context: JSON.stringify(context), ipHash: hashIP(ip) },
});
```

**Prisma model (optional):**

```prisma
model AffiliateClick {
  id        String   @id @default(cuid())
  provider  String   // "epojisteni" | "klik"
  context   String?  // JSON context
  ipHash    String?
  createdAt DateTime @default(now())
  
  @@index([provider])
  @@index([createdAt])
}
```

### Krok 5: Napojení z dalších míst (cross-linking)

**Kde ještě zobrazit affiliate CTA:**

| Místo | Soubor | Typ | Detail |
|-------|--------|-----|--------|
| Detail vozidla | `app/(web)/nabidka/[slug]/page.tsx` | EDIT | Sidebar: "Pojistěte toto auto" s affiliate linkem |
| STK detail | `app/(web)/stk/[slug]/page.tsx` | EDIT (optional) | "Po STK potřebujete pojištění?" |
| Po sjednání financování | `components/web/FinancovaniCalc.tsx` | EDIT (optional) | "Nezapomeňte na pojištění" |

**Detail vozidla (DOPORUČENO):**

```tsx
{/* Sidebar — pojištění CTA */}
<Card className="p-5">
  <h3 className="font-bold text-sm text-gray-900 mb-2">
    Pojistěte tento vůz
  </h3>
  <p className="text-xs text-gray-500 mb-3">
    Porovnejte nabídky povinného ručení a havarijního pojištění
  </p>
  <a
    href={`/sluzby/pojisteni`}
    className="block w-full text-center px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
  >
    Spočítat pojištění
  </a>
</Card>
```

---

## 5. Environment variables

```env
# .env.local
NEXT_PUBLIC_EPOJISTENI_AFFILIATE_ID=xxx     # Affiliate ID z eSpoluprace.cz
NEXT_PUBLIC_EPOJISTENI_IFRAME_URL=xxx       # iframe URL (pokud dostupný)
NEXT_PUBLIC_KLIK_AFFILIATE_ID=xxx           # Záložní — Klik.cz affiliate ID

# Feature flags
NEXT_PUBLIC_INSURANCE_AFFILIATE_ENABLED=true  # Zapnout/vypnout affiliate CTA
NEXT_PUBLIC_INSURANCE_AFFILIATE_PROVIDER=epojisteni  # "epojisteni" | "klik"
```

---

## 6. Seznam souborů

### Must (Fáze 1):

| Soubor | Typ | Detail |
|--------|-----|--------|
| `components/web/PojisteniCalc.tsx` | EDIT | +dual CTA (affiliate + kontaktní), +iframe/link |
| `lib/affiliate-tracking.ts` | NEW | Tracking helper pro analytics |

### Should (Fáze 2):

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/api/analytics/affiliate-click/route.ts` | NEW | Server-side click logging |
| `prisma/schema.prisma` | EDIT | +AffiliateClick model |

### Nice-to-have (Fáze 3):

| Soubor | Typ | Detail |
|--------|-----|--------|
| `app/(web)/nabidka/[slug]/page.tsx` | EDIT | Sidebar pojištění CTA |
| `components/web/InsuranceAffiliateCTA.tsx` | NEW | Reusable CTA komponent |

---

## 7. Monetizační odhad

### ePojisteni.cz (455 Kč/lead):

| Metrika | Odhad |
|---------|-------|
| Návštěvy `/sluzby/pojisteni` | 500/měsíc (konzervativní) |
| Kalkulace completion rate | 60% = 300 kalkulací |
| Klik na affiliate CTA | 30% = 90 kliků |
| Lead conversion (SPZ zadání) | 40% = 36 leadů |
| **Měsíční příjem** | **36 × 455 = 16 380 Kč** |
| **Roční příjem** | **~196 560 Kč** |

### Klik.cz (76,50 Kč/konverze) — pokud jako fallback:

| Metrika | Odhad |
|---------|-------|
| Stejný traffic | 36 konverzí/měsíc |
| **Měsíční příjem** | **36 × 76,50 = 2 754 Kč** |

**→ ePojisteni.cz je 6× výnosnější než Klik.cz.**

### Přidaný revenue z cross-linking (detail vozidla):

| Metrika | Odhad |
|---------|-------|
| Detail vozidla zobrazení | 5 000/měsíc |
| Klik na "Pojistěte tento vůz" | 3% = 150 kliků |
| Lead conversion | 20% = 30 leadů |
| **Extra měsíční příjem** | **30 × 455 = 13 650 Kč** |

**Celkový odhad: ~30 000 Kč/měsíc = ~360 000 Kč/rok** (konzervativní).

---

## 8. STOP pravidla

- **STOP-1:** NESMÍ smazat stávající kontaktní formulář — hybrid model zachovává OBĚ cesty (affiliate + vlastní formulář). Uživatel musí mít volbu.
- **STOP-2:** NESMÍ implementovat iframe bez ověření URL od ePojisteni.cz — registrace na eSpoluprace.cz MUSÍ proběhnout PRVNÍ. Pokud iframe není dostupný, použít Variantu B (affiliate link).
- **STOP-3:** NESMÍ hardcodovat affiliate ID do kódu — VŽDY přes environment variable (`NEXT_PUBLIC_*`).
- **STOP-4:** Affiliate CTA MUSÍ být jasně označeno jako odkaz na partnera — "Srovnání zajišťuje ePojisteni.cz" disclaimer.
- **STOP-5:** NESMÍ posílat osobní údaje uživatele (jméno, telefon, SPZ) do affiliate linku — ty zůstávají JEN v našem formuláři.
- **STOP-6:** Feature flag `INSURANCE_AFFILIATE_ENABLED` — možnost vypnout affiliate bez deploye kódu.
- **STOP-7:** Pokud ePojisteni.cz změní podmínky / zruší program → graceful fallback na Klik.cz nebo jen kontaktní formulář.

---

## 9. Manuální kroky (pro uživatele/team lead)

**Před implementací:**

1. ☐ Registrace na https://www.espoluprace.cz/partner/registrace
2. ☐ Ověřit zda iframe formulář je dostupný (kontaktovat podpora@espoluprace.cz)
3. ☐ Získat affiliate ID + iframe URL (pokud dostupný)
4. ☐ Nastavit `.env.local` s affiliate credentials
5. ☐ Rozhodnout primární variantu (A: iframe / B: link)

**Po implementaci:**

6. ☐ Ověřit tracking — kliknout na affiliate CTA, zkontrolovat v eSpoluprace.cz dashboardu
7. ☐ Nastavit bankovní účet pro výplatu provizí v eSpoluprace.cz
8. ☐ Monitor konverze první měsíc

---

## 10. Acceptance Criteria

### Fáze 1:
- [ ] Po kalkulaci se zobrazí DVA CTA: "Porovnat pojišťovny" + "Chci osobní nabídku"
- [ ] Affiliate CTA otevře ePojisteni.cz (iframe nebo link dle dostupnosti)
- [ ] Affiliate link obsahuje partner ID z env variable
- [ ] Stávající kontaktní formulář funguje beze změn
- [ ] Disclaimer "Srovnání zajišťuje ePojisteni.cz" je viditelný
- [ ] Feature flag může affiliate vypnout
- [ ] `npm run build` projde

### Fáze 2:
- [ ] Affiliate klik se loguje do DB (AffiliateClick)
- [ ] Cross-link na detail vozidla ("Pojistěte tento vůz")

### Fáze 3:
- [ ] Admin dashboard ukazuje affiliate click statistiky
