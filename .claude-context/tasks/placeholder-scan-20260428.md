# Placeholder & Fake Data Scan — KOMPLETNÍ AUDIT

**Datum:** 2026-04-28  
**Autor:** Kontrolor  
**Scope:** VŠECHNY `page.tsx` v `app/(web)/`, `app/(admin)/`, `app/(pwa)/`, `app/(pwa-parts)/`, `app/(partner)/`  
**Metodika:** Grep + přímé čtení každé podezřelé stránky. Pro každou stránku: zdroj dat, čísla, seznamy, formuláře, grafy.

---

## SOUHRN

**Celkem REÁLNÝCH problémů: 7**  
- 3 kritické (fake recenze viditelné uživatelům)  
- 2 stub stránky (nefunkční sekce)  
- 1 design stub (text místo brand SVG)  
- 1 admin UI stub (placeholder grafy bez dat)  

**Vše ostatní (220+ stránek) je OK — reálná DB data.**

---

## 🔴 KRITICKÉ — FAKE DATA VIDITELNÉ UŽIVATELŮM

---

### 1. `app/(web)/recenze/page.tsx` — CELÁ STRÁNKA FAKE

**Typ:** Hardcoded fake recenze — celá stránka  
**Řádky:** 21–86 (8 recenzí)  
**Obsah:** 8 vymyšlených osob s fake jmény (Jana K., Martin D., Tomáš H., Eva S., Pavel K., Marie L., Jiří N., Lucie V.), fake datumi (Jan–Feb 2026), fake city, vymyšlené citáty.

```typescript
const reviews: Review[] = [
  { stars: 5, quote: "Prodej proběhl...", name: "Jana K.", city: "Praha", date: "12. 2. 2026", type: "prodejce" },
  // ... dalších 7 fake osob
];
```

**Dopad:** Stránka `/recenze` je kompletně fake — žádná recenze není reálná.  
**Co by tam mělo být:** Recenze z DB (model `Review` nebo podobný), nebo tato stránka musí být označena jako "vzorové recenze" / skryta dokud nejsou reálná data.

---

### 2. `app/(web)/page.tsx:195-214` — Fake testimonials na homepage

**Typ:** Hardcoded fake testimonials  
**Řádky:** 195–214  
**Obsah:** 3 fake osoby (Jana K./Praha, Martin D./Brno, Tomáš H./Ostrava) s vymyšlenými citáty.

```typescript
const testimonials = [
  { quote: "Auto prodané za 12 dní...", name: "Jana K.", city: "Praha" },
  { quote: "Nemusel jsem řešit vůbec nic...", name: "Martin D.", city: "Brno" },
  { quote: "Díky prověrce jsem zjistil...", name: "Tomáš H.", city: "Ostrava" },
];
```

**Dopad:** Hlavní homepage ukazuje fake recenze.  
**Co by tam mělo být:** Reálné recenze z DB, nebo sekci `testimonials` skrýt/nahradit hodnotovou proposicí.

---

### 3. `app/(web)/chci-prodat/page.tsx:239` — Fake testimonial na landing stránce

**Typ:** Hardcoded fake testimonial (1 osoba)  
**Kontext:** Sekce 5 — blockquote s "Jana K., Praha" a 5 hvězdičkami.  
**Dopad:** Prodejní landing stránka ukazuje vymyšlenou recenzi.  
**Co by tam mělo být:** Reálná recenze z DB nebo odstranit.

---

### 4. `app/(web)/recenze/layout.tsx:26-27` — Fake structured data (schema.org)

**Typ:** Hardcoded fake reviewBody v JSON-LD  
**Obsah:**  
```typescript
{ author: "Jana K.", reviewBody: "Prodej proběhl hladce a rychle. Auto bylo prodané za 12 dní.", ratingValue: 5 },
{ author: "Martin D.", reviewBody: "Konečně někdo, kdo se o všechno postará.", ratingValue: 5 },
```
**Dopad:** Google vidí fake recenze v structured data → potenciální penalizace pro search rankings.  
**Co by tam mělo být:** Strukturovaná data generovaná z reálných recenzí z DB.

---

## 🟡 STUB STRÁNKY (nefunkční sekce)

---

### 5. `app/(partner)/partner/documents/page.tsx:16-38,66`

**Typ:** Hardcoded stub seznam + "Připravujeme" tlačítko  
**Obsah:** Array dokumentů s `available: false` → zobrazí šedé tlačítko "Připravujeme".  
**Co by tam mělo být:** Reálné dokumenty z DB (smlouvy, faktury, certifikace). Viz task #34.

---

### 6. `app/(partner)/partner/messages/page.tsx:27`

**Typ:** Placeholder text  
**Text:** `"Systemove notifikace a zpravy. Plna komunikace bude brzy k dispozici."`  
**Co by tam mělo být:** Odstranit "bude brzy k dispozici" — stránka jinak zobrazuje reálné notifikace z DB. Navíc chybí diakritika v textech ("Systemove", "Zpravy", "Zadne").

---

## 🟠 DESIGN / UI STUB

---

### 7. `components/shop/ShopTrustBar.tsx`

**Typ:** Text místo brand SVG ikony  
**TODO komentář:** Řádek 6 — `"TODO(designer): text-badges jako placeholder. Nahradit officiálními brand SVG"`  
**Dopad:** E-shop footer zobrazuje textové odznaky místo log Visa, Mastercard, Apple Pay, Google Pay, Zásilkovna, DPD, PPL, GLS, Česká pošta.  
**Co by tam mělo být:** Brand-approved SVG ikony v `public/brand/`.

---

### 8. `app/(admin)/admin/dashboard/page.tsx:127-142`

**Typ:** Placeholder grafy bez dat  
**Obsah:**
```html
<div class="h-[200px] sm:h-[300px] bg-gray-50 rounded-lg flex items-center justify-center">
  <span class="text-gray-400 text-lg">📊 Graf prodejů</span>
</div>
```
Stejný pattern pro "Graf provizí".  
**Dopad:** Admin dashboard ukazuje 2 šedé boxy s textem místo reálných grafů prodejů a provizí.  
**Co by tam mělo být:** Chart komponenty (jako v makler/stats page — inline CSS bar charts, nebo integrovaná lib).

---

## ✅ OVĚŘENO JAKO ČISTÉ (výběr klíčových stránek)

### app/(admin)/
| Stránka | Status | Poznámka |
|---------|--------|----------|
| admin/dashboard/page.tsx | ⚠️ STUB grafy | Stat cards OK z DB, grafy = placeholder |
| admin/brokers/page.tsx | ✅ | Prisma data |
| admin/brokers/[id]/page.tsx | ✅ | Prisma data + commission aggregate |
| admin/manager/page.tsx | ✅ | Prisma data |
| admin/marketplace/page.tsx | ✅ | Prisma data |
| admin/marketplace/applications/page.tsx | ✅ | Prisma data |
| admin/users/page.tsx | ✅ | API /api/admin/users |
| admin/orders/page.tsx | ✅ | API /api/admin/orders |
| admin/parts/page.tsx | ✅ | API /api/admin/parts |
| admin/partners/page.tsx | ✅ | Prisma data |
| admin/career/page.tsx | ✅ | Deleguje na CareerOverviewContent |
| admin/notifications/page.tsx | ✅ | Prisma data |
| admin/blog/page.tsx | ✅ | Prisma data |
| admin/vehicles/page.tsx | ✅ | Prisma data |

### app/(web)/
| Stránka | Status | Poznámka |
|---------|--------|----------|
| page.tsx (homepage) | ⚠️ FAKE testimonials | Vozidla + makléři OK z DB |
| recenze/page.tsx | 🔴 KOMPLETNĚ FAKE | 8 hardcoded recenzí |
| chci-prodat/page.tsx | ⚠️ 1 fake testimonial | Stats z DB OK |
| nabidka/page.tsx | ✅ | Prisma data + filtry |
| makleri/page.tsx | ✅ | Prisma data |
| o-nas/page.tsx | ✅ | Tým = skuteční zakladatelé (legitimní statický obsah), stats z DB |
| kariera/page.tsx | ✅ | Positions = skutečné otevřené pozice (legitimní statický obsah) |
| marketplace/page.tsx | ✅ | Stats z DB, howItWorks/faq = statický marketingový obsah (OK) |
| inzerce/page.tsx | ✅ | Prisma data, steps/benefits = statický obsah (OK) |
| sluzby/*/page.tsx | ✅ | Statický marketingový obsah (OK) |
| kolik-stoji-moje-auto/page.tsx | ✅ | PriceCalculator čerpá z DB |
| dily/katalog/page.tsx | ✅ | API fetch |
| shop/katalog/page.tsx | ✅ | API fetch |
| muj-ucet/page.tsx | ✅ | API /api/profile stats |

### app/(pwa)/
| Stránka | Status | Poznámka |
|---------|--------|----------|
| makler/dashboard/page.tsx | ✅ | Prisma data |
| makler/stats/page.tsx | ✅ | Prisma data — komentáře "placeholder" jsou jen pro CSS charts, data jsou reálná |
| makler/commissions/page.tsx | ✅ | Prisma data |
| makler/leaderboard/page.tsx | ✅ | Prisma groupBy |
| makler/vehicles/page.tsx | ✅ | Prisma data |
| makler/materials/page.tsx | ✅ | Prisma data |
| makler/leads/page.tsx | ✅ | Prisma data |
| makler/messages/page.tsx | ✅ | Pusher + Prisma |

### app/(pwa-parts)/
| Stránka | Status | Poznámka |
|---------|--------|----------|
| parts/page.tsx | ✅ | SupplierStats z DB |
| parts/orders/page.tsx | ✅ | API fetch |
| parts/my/page.tsx | ✅ | API fetch |
| parts/donors/page.tsx | ✅ | API fetch |

### app/(partner)/
| Stránka | Status | Poznámka |
|---------|--------|----------|
| partner/dashboard/page.tsx | ✅ | Client fetch /api/partner/dashboard (error state = OK, ne fake data) |
| partner/stats/page.tsx | ✅ | Client fetch /api/partner/stats — grafy z reálných dat |
| partner/billing/page.tsx | ✅ | Client fetch — reálné tržby |
| partner/orders/page.tsx | ✅ | Client fetch |
| partner/messages/page.tsx | ⚠️ STUB text | Notifikace funkční, stub text v subtitle |
| partner/documents/page.tsx | 🟡 STUB | Hardcoded nedostupné dokumenty |

---

## PRIORITIZOVANÝ AKČNÍ PLÁN

| # | Soubor | Typ | Priorita | Akce |
|---|--------|-----|----------|------|
| 1 | `recenze/page.tsx` | 8 fake recenzí | 🔴 ASAP | Napojit na DB nebo explicitně označit jako demo/schovat |
| 2 | `page.tsx` testimonials | 3 fake recenze | 🔴 ASAP | Napojit na DB nebo nahradit statickým hodnotovým contentem |
| 3 | `chci-prodat/page.tsx` | 1 fake recenze | 🔴 ASAP | Stejná recenze jako homepage → konsolidovat nebo napojit na DB |
| 4 | `recenze/layout.tsx` | Fake structured data | 🔴 ASAP | Generovat z DB nebo odstranit reviewBody |
| 5 | `admin/dashboard` grafy | Placeholder UI | 🟡 Post-MVP | Implementovat chart komponenty |
| 6 | `partner/messages` stub text | Neosobní text | 🟡 Brzy | Opravit text + diakritiku |
| 7 | `partner/documents` stub | Připravujeme tlačítka | 🟡 Viz task #34 | Reálné dokumenty nebo skrýt |
| 8 | `ShopTrustBar` text badges | Design placeholder | 🟢 Post-MVP | Brand SVG assets |

---

## ZÁVĚR

**Největší problém: falešné recenze.** Stránky `/recenze`, homepage a `/chci-prodat` zobrazují vymyšlené osoby s vymyšlenými citáty. Navíc `/recenze/layout.tsx` propaguje tyto fake recenze jako structured data do Googlu.

**220+ ostatních stránek je čistých** — všechna data z Prisma nebo API. Statický marketingový obsah (steps, benefits, faq, howItWorks) na landing stránkách je legitimní a nevyžaduje změnu.
