# Carmakler - Projektový souhrn

## O projektu

Platforma pro automakléře s webovým portálem a PWA aplikací.

---

## Tech Stack

- **Frontend:** Next.js 14+ (App Router)
- **Backend:** Next.js API Routes
- **Databáze:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js nebo Clerk
- **PWA:** next-pwa / Serwist
- **Real-time:** Pusher / Socket.io
- **Mapy:** Mapy.cz API
- **Email:** Resend
- **Hosting:** Vercel

---

## Hierarchie uživatelů

```
Administrátor
├── BackOffice (schvalování, operativa)
├── Regionální ředitel (bonus 3% z regionu)
│   └── Manažer (bonus 5% z týmu, může mít vlastní vozy)
│       └── Makléř (50% z provize)
```

---

## Provizní model

```
Provize = 5% z prodejní ceny (minimum 25 000 Kč)

Split:
├── Makléř: 50%
└── Firma: 50%
    ├── Manažer: 5%
    ├── Ředitel: 3%
    └── Carmakler: 42%

Bonusy (pojištění, leasing): stejný split 50/50
```

---

## Moduly projektu

### Modul 1: Autentizace & Role
- Registrace, login, role
- Hierarchie: Admin → BackOffice → Ředitel → Manažer → Makléř
- Matice oprávnění
- Workflow deaktivace makléře (přeřazení vozů)

### Modul 2: Správa vozů & Workflow
- CRUD vozů
- **VIN je SVATÝ - nelze změnit po uložení!**
- Schvalovací workflow (Draft → Pending → Active)
- Change log s důvody změn
- Automatické flagy (velká sleva, změna km)

### Modul 3: Profil makléře & Recenze
- Veřejný profil makléře
- URL: `/makler/jan-novak-praha`
- Statistiky (prodeje, hodnocení, doba prodeje)
- Recenze od klientů
- Odpovědi makléře na recenze

### Modul 4: Provize & Finance
- Výpočet provizí
- Bonusy za pojištění/leasing
- Přehled výplat
- Dashboard pro makléře, manažery, ředitele

### Modul 5: Web Frontend (Portál)
- Homepage, katalog vozů, filtry
- Detail vozu s galerií
- **Recenze k vozům** (nejen k makléřům)
- **"X lidí si právě prohlíží" (live viewers)**
- **Počítadlo zobrazení**
- **Lokace vozu** (město, městská část, mapa)
- Formulář "Prodat auto" (FÁZE 4)

### Modul 6: PWA pro makléře
- Dashboard s přehledem
- Správa vozů (přidání, editace)
- Mobilní focení vozů
- VIN scanner
- Přehled provizí
- Push notifikace
- Offline podpora

### Modul 7: Integrace
- Vaše appka s čísly prodejců (leady)
- VIN dekodér
- Export na Sauto.cz, TipCars
- Mapy.cz API (lokace)
- Affiliate (pojištění, leasing)

---

## Klíčové featury

### ✅ VIN pravidlo
- VIN se zadává 1x při vytvoření
- Po uložení NELZE změnit
- Jiný VIN = nový inzerát

### ✅ Change log
- Změna ceny → povinný důvod
- Změna km/roku → povinný důvod
- Automatické flagy pro BackOffice

### ✅ Live viewers
- Real-time počet lidí prohlížejících vůz
- "🔴 5 lidí si právě prohlíží tento vůz"

### ✅ Recenze k vozům
- Kromě recenzí makléřů
- Hodnocení konkrétních vozů
- Typ interakce (prohlídka, testovací jízda, koupě)

### ✅ Lokace vozu
- Město + městská část (veřejné)
- Přibližná mapa (ne přesná adresa!)
- Partnerská místa (autobazary)
- Přesná adresa až po kontaktu

### ✅ Provizní systém
- 5% (min 25k) → 50% makléř / 50% firma
- Bonusy manažer (5%) a ředitel (3%)
- Tracking pojištění a leasingu

---

## Fáze vývoje

### FÁZE 1 (MVP)
- [x] Auth + role (Admin, BackOffice, Makléř)
- [x] Správa vozů + workflow
- [x] Web katalog
- [x] PWA základní

### FÁZE 2 (Rozšíření)
- [x] Manažeři + týmy
- [x] Provizní systém
- [x] Recenze
- [x] Live viewers

### FÁZE 3 (Regiony)
- [ ] Regionální ředitelé
- [ ] Export na portály
- [ ] Integrace pojištění/leasing

### FÁZE 4 (Platforma)
- [ ] Formulář "Prodat auto"
- [ ] Pool leadů pro makléře
- [ ] Integrace vaší appky

---

## Soubory dokumentace

```
/carmakler-briefs/
├── 01-autentizace-role.md
├── 02-sprava-vozu-workflow.md
├── 03-profil-maklere-recenze.md
├── 04-provize-finance.md
├── 05-web-frontend.md
├── 06-pwa-makleri.md
├── 07-integrace-externi.md
└── 00-souhrn.md (tento soubor)
```

---

## Kontakty a poznámky

**Klient:** Jevg
**Projekt:** Carmakler
**Datum:** Leden 2026

### Otevřené body k diskuzi:
- Přesné provizní sazby
- Přiřazování leadů (auto/manuál/rotace)
- Partneři pro pojištění/leasing
- Formát dat z vaší appky s čísly
