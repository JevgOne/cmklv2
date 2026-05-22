# Audit: Cross-linking a proklikovost mezi stránkami

**Vytvořeno:** 2026-04-20
**Task:** #22

---

## Metodika

Kompletní analýza všech `href=` a `<Link>` odkazů na každé veřejné stránce. Zahrnuje globální navigaci (Navbar, Footer, PlatformSwitcher) i per-page cross-linky.

---

## Globální navigace

### Navbar (`components/main/Navbar.tsx`)
| Prvek | Cíl | Stav |
|-------|-----|------|
| Logo | `/` | ✅ |
| Nabídka vozidel | `/nabidka` | ✅ |
| PlatformSwitcher | `/inzerce`, `/dily` | ✅ (marketplace skrytý — VIP) |
| Služby dropdown | `/sluzby/proverka`, `/financovani`, `/pojisteni` | ✅ |
| O nás dropdown | `/o-nas`, `/kariera`, `/recenze` | ✅ |
| CTA "Chci prodat" | `/chci-prodat` | ✅ |
| CTA "Chci koupit" | `/nabidka` | ✅ |

### Footer (`components/common/FooterBase.tsx`)
| Sekce | Odkazy | Stav |
|-------|--------|------|
| Produkt | `/nabidka`, `/chci-prodat`, `/jak-to-funguje`, `/kariera` | ✅ |
| Podpora | telefon, email, `/jak-to-funguje`, `/kontakt` | ✅ |
| Firma | `/o-nas`, `/kariera` | ✅ |
| Legal | ochrana-osobnich-udaju, obchodni-podminky, cookies | ✅ |
| PlatformSwitcher | main, inzerce, shop | ✅ |

**Globální navigace: ✅ kompletní** — žádné chybějící klíčové odkazy.

---

## Per-page analýza

### 1. Homepage `/` — ✅ OK

**Odchozí odkazy:** `/nabidka`, `/chci-prodat`, `/makleri`, `/kariera`, `/o-nas`, všechny služby
**CTA:** "Chci prodat auto", "Prohlédnout nabídku"
**Hodnocení:** Pokrývá všechny hlavní user flows. Žádné chybějící cross-linky.

---

### 2. Katalog `/nabidka` — ✅ OK

**Odchozí odkazy:**
- `/inzerce/pridat` ("Vložit inzerát zdarma") — link na inzertní platformu ✅
- Jednotlivé vozidla → `/nabidka/[slug]` ✅
- Cross-linking sekce dole: `/chci-prodat`, `/sluzby/proverka`, `/sluzby/financovani`, `/sluzby/pojisteni`, `/makleri`, `/nabidka/porovnani` ✅

**Hodnocení:** Výborné — má cross-linky na služby i další klíčové stránky.

---

### 3. Detail vozu `/nabidka/[slug]` — ❌ CRITICAL

**Odchozí odkazy:**
- Breadcrumb: `/` → `/nabidka` ✅
- `/nabidka/[slug]/platba` (CTA koupě) ✅
- `tel:` a `mailto:` (kontakt na makléře/prodejce) ✅

**CHYBÍ:**
- ❌ `/sluzby/proverka` — "Prověřte si toto auto"
- ❌ `/sluzby/financovani` — "Spočítejte si splátky"
- ❌ `/sluzby/pojisteni` — "Pojistěte si auto online"
- ❌ `/makleri` nebo `/profil/[brokerSlug]` — odkaz na profil makléře

**Dopad:** VYSOKÝ. Detail vozu je stránka s nejvyšším purchase intentem. Uživatel si prohlíží konkrétní auto, ale nemá cestu k:
1. **Prověrce** — přitom chce vědět, jestli je auto v pořádku
2. **Financování** — přitom chce vědět, kolik bude splátka
3. **Pojištění** — přitom bude potřebovat povinné ručení

Toto je **#1 upselling příležitost celé platformy** a je kompletně nevyužitá.

**Doporučení:**
```
Přidat sekci "Doplňkové služby" pod specifikace vozu:

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 🔍 Prověrka  │ │ 🧮 Splátky   │ │ 🛡️ Pojištění │
│ Prověřte si  │ │ Spočítejte   │ │ Pojistěte    │
│ toto auto    │ │ si splátky   │ │ auto online  │
│              │ │              │ │              │
│  Prověřit →  │ │  Spočítat →  │ │  Pojistit →  │
└──────────────┘ └──────────────┘ └──────────────┘
```

Priorita: **P0** — každý den bez těchto odkazů = ztracené konverze.

---

### 4. Service pages (`/sluzby/proverka`, `/financovani`, `/pojisteni`) — ❌ CRITICAL

**Odchozí odkazy:** ŽÁDNÉ. `ServicePage.tsx` (sdílená šablona) neobsahuje ani jeden `<Link>`.

Jednotlivé CTA formuláře (ProverkaForm, FinancovaniCalc, PojisteniForm) submitují na `/api/contact`, ale neodkazují na žádnou další stránku.

**CHYBÍ:**
- ❌ Cross-linky mezi službami navzájem (prověrka ↔ financování ↔ pojištění)
- ❌ `/nabidka` — "Prohlédnout nabídku vozidel"
- ❌ `/chci-prodat` — "Chcete prodat auto?"
- ❌ `/makleri` — "Najít makléře"

**Dopad:** VYSOKÝ. Service pages jsou **mrtvý konec**. Uživatel přijde na financování, přečte si info, odešle formulář — a pak? Žádný další krok, žádná navigace. Musí jít zpět přes navbar.

**Doporučení:**
Přidat do `ServicePage.tsx` cross-linking sekci pod FAQ:

```tsx
{/* Cross-linking sekce — přidat pod FAQ */}
<section className="max-w-6xl mx-auto w-full px-4 py-12">
  <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
    Další služby CarMakléř
  </h2>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {/* Dynamicky vyfiltrovat aktuální službu */}
    <Link href="/sluzby/proverka">Prověrka vozidla →</Link>
    <Link href="/sluzby/financovani">Financování →</Link>
    <Link href="/sluzby/pojisteni">Pojištění →</Link>
  </div>
  <div className="flex justify-center gap-6 mt-8">
    <Link href="/nabidka">Prohlédnout nabídku →</Link>
    <Link href="/chci-prodat">Prodat auto →</Link>
  </div>
</section>
```

Priorita: **P0** — snadný fix (1 změna v sdílené šabloně = opraveny 3 stránky).

---

### 5. `/chci-prodat` — ⚠️ MEDIUM

**Odchozí odkazy:** Žádné viditelné (SellCarForm submituje na API). Stránka obsahuje formulář, kroky, benefits, testimonial a FAQ.

**CHYBÍ:**
- ⚠️ "Nejste si jistí?" alternativy pro nerozhodnuté:
  - `/jak-to-funguje` — "Jak prodej funguje?"
  - `/makleri` — "Najděte svého makléře"
  - `/recenze` — "Co říkají naši klienti"

**Dopad:** STŘEDNÍ. Stránka je konverzní funnel (formulář = cíl), ale nemá "soft CTA" pro uživatele, kteří ještě nejsou připraveni vyplnit formulář.

**Doporučení:** Přidat pod FAQ sekci s alternativami:
```
Nejste si jistí? → Jak to funguje | Recenze klientů | Najít makléře
```

---

### 6. `/makleri` — ✅ OK

**Odchozí odkazy:**
- `/profil/[slug]` (karty makléřů) ✅
- `/chci-prodat` (CTA "Chcete prodat auto?") ✅
- `/kariera` (CTA "Chcete se stát makléřem?") ✅

**Hodnocení:** Dobrá cross-linking struktura s relevantními CTA.

---

### 7. `/profil/[slug]` (makléř/dealer profil) — ⚠️ MEDIUM

**Odchozí odkazy:**
- `/muj-ucet/profil` (pokud vlastní profil) ✅
- `tel:`, `mailto:`, website, social links ✅
- Vozidla/inzeráty/díly jako karty s odkazy na detail ✅

**CHYBÍ:**
- ⚠️ CTA "Prodat auto s tímto makléřem" → `/chci-prodat?broker=[slug]`
- ⚠️ Cross-link na `/sluzby/*` (služby, které makléř nabízí)

**Dopad:** STŘEDNÍ. Uživatel si prohlíží profil makléře a vidí jeho vozy, ale nemá přímou cestu jak říct "chci prodat auto právě s tímto makléřem".

**Doporučení:** Přidat CTA sekci pod profil info:
```
[🚗 Prodat auto s [Jméno]] → /chci-prodat?broker=[slug]
```

---

### 8. `/kariera` — ⚠️ LOW

**Odchozí odkazy:** `#kariera-form` (smooth scroll na formulář)

**CHYBÍ:**
- ⚠️ `/makleri` — "Podívejte se, kdo už je naším makléřem"
- ⚠️ `/o-nas` — "Více o nás"

**Dopad:** NÍZKÝ. Kariéra stránka je standalone funnel, ale chybí kontext.

**Doporučení:** Přidat pod formulář: "Zjistěte více" → /makleri, /o-nas

---

### 9. `/dily` (eshop) — ✅ OK

**Odchozí odkazy:**
- `/dily/katalog?category=X` (kategorie) ✅
- `/dily/katalog` ("Zobrazit všechny autodíly") ✅
- `/kontakt` (CTA "Poptat díl") ✅
- SmartSearchBar pro textové hledání ✅

**Hodnocení:** Dobrá navigační struktura pro eshop flow.

---

### 10. `/jak-to-funguje` — ✅ VÝBORNÉ

**Odchozí odkazy:**
- `/chci-prodat` ✅
- `/nabidka` ✅
- `/dily/katalog` ✅
- `/kontakt` ✅

**Hodnocení:** Vzorová stránka pro cross-linking. Každá sekce (prodej, nákup, díly) má CTA s odkazem na příslušnou stránku.

---

### 11. `/kontakt` — ✅ OK

**Odchozí odkazy:** `/nabidka`, `/chci-prodat`, `/makleri`, `/sluzby/financovani`, `/recenze`
**Hodnocení:** Dobrá "quick links" sekce.

---

### 12. `/recenze` — ✅ OK

**Odchozí odkazy:** `/chci-prodat`, `/makleri`, `mailto:` (napsat recenzi)
**Hodnocení:** Relevantní CTA po přečtení recenzí.

---

### 13. `/o-nas` — ✅ VÝBORNÉ

**Odchozí odkazy:** `/nabidka`, `/chci-prodat`, `/makleri`, `/recenze`, `/kontakt`, `/kariera`
**Hodnocení:** Nejkomplexnější cross-linking na celém webu.

---

### 14. `/marketplace` — ✅ OK (for VIP)

**Odchozí odkazy:** `/marketplace/apply?role=investor`, `/marketplace/apply?role=dealer`, `/prihlaseni`
**Hodnocení:** VIP landing page — intentionally limited, odkazy vedou na apply formulář.

---

### 15. `/inzerce` — ✅ OK

**Odchozí odkazy:** `/inzerce/pridat`, `/nabidka`, pricing/registration
**Hodnocení:** Funkční landing pro inzertní platformu.

---

## Souhrnná mapa chybějících propojení

```
              ┌─────────────────────────────────────────────┐
              │          Detail vozu /nabidka/[slug]         │
              │                                             │
              │  ❌ → /sluzby/proverka                      │
              │  ❌ → /sluzby/financovani                   │
              │  ❌ → /sluzby/pojisteni                     │
              │  ❌ → /profil/[brokerSlug]                  │
              └─────────────────────────────────────────────┘
                              ↑ CRITICAL

              ┌─────────────────────────────────────────────┐
              │     Service pages (3× sdílená šablona)      │
              │     /sluzby/proverka                        │
              │     /sluzby/financovani                     │
              │     /sluzby/pojisteni                       │
              │                                             │
              │  ❌ → navzájem (prověrka↔financ↔pojistění)  │
              │  ❌ → /nabidka                              │
              │  ❌ → /chci-prodat                          │
              │  ❌ → /makleri                              │
              └─────────────────────────────────────────────┘
                              ↑ CRITICAL

              ┌─────────────────────────────────────────────┐
              │          /chci-prodat                        │
              │                                             │
              │  ⚠️ → /jak-to-funguje (soft CTA)           │
              │  ⚠️ → /recenze (trust signal)              │
              │  ⚠️ → /makleri (find broker)               │
              └─────────────────────────────────────────────┘
                              ↑ MEDIUM

              ┌─────────────────────────────────────────────┐
              │          /profil/[slug]                      │
              │                                             │
              │  ⚠️ → /chci-prodat?broker=[slug]           │
              │  ⚠️ → /sluzby/* (cross-sell)               │
              └─────────────────────────────────────────────┘
                              ↑ MEDIUM
```

---

## Prioritizovaný fix list

### P0 — CRITICAL (okamžitě, nejvyšší dopad na konverze)

| # | Stránka | Co chybí | Kde opravit | Rozsah |
|---|---------|----------|-------------|--------|
| 1 | `/nabidka/[slug]` | Sidebar/sekce "Doplňkové služby" (prověrka, financování, pojištění) | `app/(web)/nabidka/[slug]/page.tsx` | ~30 řádků |
| 2 | Service pages (3×) | Cross-linking sekce pod FAQ (ostatní služby + /nabidka + /chci-prodat) | `components/web/ServicePage.tsx` | ~25 řádků (1 změna = 3 stránky) |

### P1 — MEDIUM (tento sprint)

| # | Stránka | Co chybí | Kde opravit | Rozsah |
|---|---------|----------|-------------|--------|
| 3 | `/chci-prodat` | "Nejste si jistí?" alternativy pod FAQ | `app/(web)/chci-prodat/page.tsx` | ~15 řádků |
| 4 | `/profil/[slug]` | CTA "Prodat auto s tímto makléřem" | `app/(web)/profil/[slug]/ProfileClient.tsx` | ~10 řádků |

### P2 — LOW (backlog)

| # | Stránka | Co chybí | Kde opravit | Rozsah |
|---|---------|----------|-------------|--------|
| 5 | `/kariera` | Cross-linky na /makleri, /o-nas | `app/(web)/kariera/page.tsx` | ~10 řádků |

---

## Pozitivní zjištění

Stránky s **výborným cross-linkingem** (vzor pro ostatní):
- `/jak-to-funguje` — každá sekce má relevantní CTA
- `/o-nas` — nejkomplexnější cross-linking
- `/nabidka` (katalog) — má cross-linking sekci dole
- `/kontakt` — rychlé odkazy
- `/recenze` — relevantní CTA po přečtení

**Globální navigace (Navbar + Footer) je kompletní** — problém není v navigaci, ale v per-page cross-linkách uvnitř obsahu stránek.

---

## Celkový stav

| Kategorie | Počet stránek | Stav |
|-----------|---------------|------|
| ✅ OK / Výborné | 10 | Homepage, katalog, jak-to-funguje, kontakt, recenze, o-nas, makleri, dily, marketplace, inzerce |
| ⚠️ Medium | 2 | chci-prodat, profil/[slug] |
| ❌ Critical | 2 | nabidka/[slug] (detail vozu), ServicePage.tsx (3 stránky) |

**Celkem 5 stránek (detail vozu + 3 service pages + chci-prodat) potřebuje cross-linking fix.** Nejkritičtější je detail vozu — stránka s nejvyšším purchase intentem nemá ŽÁDNÉ cross-sellingové odkazy.
