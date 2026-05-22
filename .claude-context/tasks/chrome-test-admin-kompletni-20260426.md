# Chrome Test — Kompletní audit admin panelu

**Datum:** 2026-04-26  
**Prostředí:** Produkce — https://carmakler.cz  
**Přihlášen jako:** admin@carmakler.cz (role: ADMINISTRÁTOR / Jan Carmak)  
**Scope:** Kompletní proklikání admin panelu jako reálný uživatel

---

## KRITICKÝ BUG (nová zjištění)

### 🔴 BUG: Manager sekce blokuje ADMIN roli

**Stránky:** `/admin/manager`, `/admin/manager/brokers`, `/admin/manager/approvals`, `/admin/manager/bonuses`

**Symptom:**
- `/admin/manager` → redirect na `https://carmakler.cz/` (homepage)
- `/admin/manager/brokers` → redirect na `https://carmakler.cz/` (homepage)
- `/admin/manager/approvals` → redirect na `/admin/dashboard`
- `/admin/manager/bonuses` → redirect na `/admin/dashboard`

**Příčina (nalezena v kódu):**
```typescript
// app/(admin)/admin/manager/page.tsx:17
if (!session?.user || session.user.role !== "MANAGER") {
  redirect("/");
}
// Stejná podmínka i v brokers, approvals, bonuses page
```

**Problém:** Podmínka `role !== "MANAGER"` blokuje i ADMIN roli. Sidebar zobrazuje odkaz na Manager sekci pro ADMIN uživatele, ale kliknutí vede na homepage.

**Dopad:** ADMIN nemá přístup do manažerské sekce přes vlastní admin panel.  
**Priorita:** P1 — viditelný broken link v admin sidebaru

---

## Dashboard — `/admin/dashboard` ✅

- **Načítá:** ✅
- **Stat karty (4):** 11 Aktivních vozidel, 0 Kč Provize, 6 Aktivních makléřů, 1 Čeká na schválení ✅
- **Grafy:** Prodeje za 12M, Provize podle regionů — zobrazeny ✅
- **Poslední aktivita:** 5 záznamů ✅
- **Čekající schválení:** 1× Audi A4 s tlačítky Schválit/Zamítnout (aktivní, neklikáno) ✅
- **Export tlačítko:** Kliknuto → placeholder bez viditelného feedbacku ⚠️ (P2 — již evidováno)

---

## Makléři — `/admin/brokers` ✅

- **Načítá:** ✅
- **Počet:** 7 makléřů (6 aktivních, 2 onboarding, 1 čekající) ✅
- **Filtr tabs:** Všichni / Aktivní / Onboarding / Čekající / Zamítnutí ✅
- **Tlačítka:** Exportovat, Pozvat makléře ✅

### Detail makléře 👁 `/admin/brokers/[id]` ✅ (P0 oprava ověřena)
- Dříve: 404 ❌ → Nyní: stránka se načítá ✅
- Zobrazuje: jméno, status, kontakty, statistiky, sekce Vozidla/Provize ✅
- Tlačítko Upravit ✏️ přítomno ✅

### Edit makléře ✏️ `/admin/brokers/[id]/edit` ✅ (P0 oprava ověřena)
- Dříve: 404 ❌ → Nyní: formulář se načítá ✅
- 11 polí předvyplněných daty ✅
- Uložení testováno: telefon změněn → redirect na detail → toast → data uložena ✅
- Testovací data reverted ✅

---

## Vozidla — `/admin/vehicles` ✅

- **Načítá:** ✅
- **Počet:** 12 vozidel (11 aktivních, 1 čekající) ✅
- **Filtr tabs:** Všechna / Aktivní / Čekající / Zamítnutá / Prodaná ✅
- **Akce na každém vozidle:** 👁 detail, ✏️ edit, 🗑 smazat ✅

### Detail vozidla 👁 `/admin/vehicles/[id]` ✅
- H1: "Opel Astra CDTi" ✅
- Sekce: Fotografie (2), Základní informace, Cena a makléř, Popis ✅
- Data: VIN, rok, nájezd, palivo, výkon, karoserie, barva, makléř, cena ✅

### Edit vozidla ✏️ `/admin/vehicles/[id]/edit` ✅
- H1: "Upravit: Opel Astra" ✅
- 5 polí, submit "Uložit změny" ✅

---

## Inzerce — `/admin/inzerce` ✅

- **Načítá:** ✅
- **Tabs:** Všechny, Flagované, Ke schválení ✅
- **Akce:** Schválit, Zamítnout, Detail ✅

### Detail inzerátu ✅
- Klik na "Detail" → naviguje na `/admin/inzerce/[id]` ✅
- H1: "Mazda CX-5" ✅

---

## Blog — `/admin/blog` ✅

- **Načítá:** ✅
- **Počet:** 3 publikované články ✅
- **Akce:** Upravit, Archivovat, Smazat ✅
- **Tabs:** Vše / Koncepty / Ke schválení / Publikováno / Archiv ✅

### Nový článek `/admin/blog/new/edit` ✅
- H1: "Nový článek" ✅
- 10 polí: Titulek, URL slug, Kategorie (7 možností), Čas čtení, Excerpt, Obrázek, Obsah (HTML), SEO titulek, SEO popis ✅
- Tlačítko "Vytvořit koncept" ✅

### Edit článku `/admin/blog/[id]/edit` ✅
- H1: "Upravit: Trh s ojetinami v ČR..." ✅
- Formulář předvyplněn daty článku ✅
- Tlačítko "Uložit" ✅

---

## Notifikační zvoneček ✅

- **Badge:** zobrazuje "1" (1 nepřečtená) ✅
- **Dropdown panel:** Otevírá se po kliknutí ✅
- **Obsah:** "Nový makléř čeká na schválení — Tomáš Nováček" (19 d) ✅
- **"Zobrazit vše" odkaz:** přítomen ✅
- **Poznámka audit P1:** Funguje správně pro ADMIN roli ✅

---

## Sidebar navigace — rychlý průchod

| Stránka | H1 | Stav |
|---------|-----|------|
| `/admin/leads` | "Lead management" | ✅ |
| `/admin/users` | "Uživatelé" | ✅ |
| `/admin/career` | "Kariérní systém" | ✅ |
| `/admin/partners` | "CRM Partneru" | ✅ |
| `/admin/orders` | "Objednávky" | ✅ |
| `/admin/payments` | "Platby" | ✅ |
| `/admin/marketplace` | "Marketplace" | ✅ |
| `/admin/notifications` | "Upozornění" | ✅ |
| `/admin/tagy` | "Tagy" | ✅ |
| `/admin/feeds` | "Feed importy" | ✅ |
| `/admin/returns` | "Reklamace a vrácení" | ✅ |
| `/admin/suppliers` | "Dodavatelé" | ✅ |
| `/admin/parts` | "Správa dílů" | ✅ |
| `/admin/payouts` | "Výplaty" | ✅ |
| `/admin/blog/ai-drafts` | "AI Návrhy článků" | ✅ |
| `/admin/profile` | "Můj profil" | ✅ |
| `/admin/manager` | — | 🔴 REDIRECT na `/` |
| `/admin/manager/brokers` | — | 🔴 REDIRECT na `/` |
| `/admin/manager/approvals` | — | 🔴 REDIRECT na `/admin/dashboard` |
| `/admin/manager/bonuses` | — | 🔴 REDIRECT na `/admin/dashboard` |

---

## Dynamické detail stránky

| URL | Stav | Poznámka |
|-----|------|---------|
| `/admin/brokers/[id]` | ✅ | P0 oprava ověřena |
| `/admin/brokers/[id]/edit` | ✅ | P0 oprava ověřena, save funguje |
| `/admin/vehicles/[id]` | ✅ | Detail s daty |
| `/admin/vehicles/[id]/edit` | ✅ | Formulář s poli |
| `/admin/inzerce/[id]` | ✅ | Detail inzerátu |
| `/admin/leads/[id]` | ✅ | Lead detail (Lucie Veselá) |
| `/admin/blog/[id]/edit` | ✅ | Předvyplněný editor |
| `/admin/marketplace` | ✅ | 4 flipy, platební akce |
| `/admin/manager/*` | 🔴 | Všechny → redirect (ADMIN blokován) |

---

## Souhrn

| Kategorie | Stav |
|-----------|------|
| P0 opravy (broker 404) | ✅ VERIFIED v produkci |
| Dashboard | ✅ PASS |
| Vehicles | ✅ PASS |
| Inzerce | ✅ PASS |
| Blog | ✅ PASS |
| Notifications | ✅ PASS |
| Sidebar (16/20 stránek) | ✅ PASS |
| Manager sekce (4 stránky) | 🔴 BUG — ADMIN blokován |
| Export tlačítko (Dashboard) | ⚠️ placeholder (P2) |
| Search bar (AdminHeader) | ⚠️ placeholder (P2) |

**Nový bug nalezen:** Manager sekce (`/admin/manager/*`) — ADMIN role je blokována page-level podmínkou `role !== "MANAGER"`. Sidebar zobrazuje odkaz, ale ADMIN se nedostane dovnitř.

---

*Chrome test dokončen: 2026-04-26*
