# Carmakler - Modul 6: PWA pro makléře

## Přehled modulu

Progresivní webová aplikace pro makléře - správa vozů, komunikace s klienty, přehled provizí. Funkční offline, push notifikace, mobilní focení.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router) s PWA
- **PWA:** next-pwa nebo Serwist
- **Offline:** Service Worker + IndexedDB
- **Push:** Web Push API + Pusher
- **Kamera:** MediaDevices API
- **Styling:** Tailwind CSS + shadcn/ui

---

## PWA Požadavky

### Manifest

```json
{
  "name": "Carmakler Pro",
  "short_name": "Carmakler",
  "description": "Aplikace pro automakléře",
  "start_url": "/app",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#1a1a1a",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Offline podpora

```javascript
// Service Worker strategie
const strategies = {
  // API calls - network first, fallback to cache
  '/api/*': 'NetworkFirst',
  
  // Statické assety - cache first
  '/static/*': 'CacheFirst',
  '/_next/static/*': 'CacheFirst',
  
  // Obrázky vozů - cache with expiration
  '/images/vehicles/*': 'StaleWhileRevalidate',
  
  // App shell - precache
  '/app': 'Precache',
  '/app/*': 'Precache',
};
```

### IndexedDB pro offline data

```javascript
// Offline storage schema
const offlineDB = {
  drafts: {
    // Rozpracované inzeráty (offline vytvoření)
    keyPath: 'localId',
    indexes: ['status', 'updatedAt']
  },
  vehicles: {
    // Cache mých vozů
    keyPath: 'id',
    indexes: ['status', 'updatedAt']
  },
  pendingActions: {
    // Fronta akcí k synchronizaci
    keyPath: 'id',
    indexes: ['type', 'createdAt']
  },
  images: {
    // Offline fotky (base64)
    keyPath: 'localId',
    indexes: ['vehicleLocalId']
  }
};
```

---

## Navigace & Layout

### Bottom Navigation

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                         [OBSAH]                                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   🏠        🚗        ➕        💰        👤                    │
│  Domů     Vozy    Přidat   Provize   Profil                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Struktura obrazovek

```
/app                          # Dashboard
/app/vehicles                 # Moje vozy
/app/vehicles/new             # Nový inzerát
/app/vehicles/[id]            # Detail vozu
/app/vehicles/[id]/edit       # Editace vozu
/app/commissions              # Moje provize
/app/leads                    # Leady (FÁZE 4)
/app/messages                 # Zprávy
/app/profile                  # Můj profil
/app/notifications            # Notifikace
```

---

## Dashboard (/app)

### Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  ☰  Carmakler Pro                              🔔 (3)   👤      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Ahoj, Honzo! 👋                                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │   TENTO MĚSÍC                                               ││
│  │                                                             ││
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐              ││
│  │   │  45 500   │  │     3     │  │     8     │              ││
│  │   │    Kč     │  │  prodeje  │  │aktivních  │              ││
│  │   │  provize  │  │           │  │   vozů    │              ││
│  │   └───────────┘  └───────────┘  └───────────┘              ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  📢 NOTIFIKACE                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🆕 Nový lead ve vašem regionu                    před 5min ││
│  │    Škoda Fabia, Praha 10                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ✅ Inzerát schválen                             před 1h    ││
│  │    VW Golf GTI byl publikován                               ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 💬 Nový dotaz                                    před 2h    ││
│  │    BMW X5 - "Jaký je stav pneu?"                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  🚗 MOJE VOZY                              [Zobrazit všechny →]│
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ 📷       │ │ 📷       │ │ 📷       │                        │
│  │ Octavia  │ │ Golf GTI │ │ BMW X5   │                        │
│  │ 450k     │ │ 380k     │ │ 890k     │                        │
│  │ 👁 234   │ │ 👁 156   │ │ 👁 312   │                        │
│  │ 🟢 Active│ │ 🟡 Pend. │ │ 🟢 Active│                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│   🏠        🚗        ➕        💰        👤                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Přidání vozu (/app/vehicles/new)

### Step 1: VIN

```
┌──────────────────────────────────────────────────────────────────┐
│  ←  NOVÝ INZERÁT                                         1/4    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │                    📷 SKENOVAT VIN                          ││
│  │                                                             ││
│  │              [Otevřít kameru]                               ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│                        nebo                                      │
│                                                                  │
│  VIN kód                                                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ TMBAJ7NE5L0123456                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ⚠️ VIN nelze po uložení změnit!                                │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              DEKÓDOVAT A POKRAČOVAT                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│   🏠        🚗        ➕        💰        👤                    │
└──────────────────────────────────────────────────────────────────┘
```

### Step 2: Údaje (předvyplněné z VIN)

```
┌──────────────────────────────────────────────────────────────────┐
│  ←  NOVÝ INZERÁT                                         2/4    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ZÁKLADNÍ ÚDAJE                                                  │
│  ✨ Předvyplněno z VIN                                          │
│                                                                  │
│  Značka*                                                         │
│  [v Škoda                                    ▾]                 │
│                                                                  │
│  Model*                                                          │
│  [v Octavia                                  ▾]                 │
│                                                                  │
│  Varianta                                                        │
│  [ RS 2.0 TSI                                  ]                 │
│                                                                  │
│  Rok výroby*                                                     │
│  [v 2020                                     ▾]                 │
│                                                                  │
│  Najeto*                                                         │
│  [ 85000                                       ] km              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  TECHNICKÉ ÚDAJE                                                 │
│                                                                  │
│  Palivo*           [v Benzín     ▾]                             │
│  Převodovka*       [v DSG        ▾]                             │
│  Výkon             [ 180         ] kW                           │
│  Karoserie         [v Combi      ▾]                             │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  STAV                                                            │
│                                                                  │
│  Stav vozu*        [v Velmi dobrý▾]                             │
│  STK platná do     [📅 12/2025    ]                             │
│  Servisní kniha    [🔘 Ano]                                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    POKRAČOVAT                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│   🏠        🚗        ➕        💰        👤                    │
└──────────────────────────────────────────────────────────────────┘
```

### Step 3: Fotky (mobilní focení)

```
┌──────────────────────────────────────────────────────────────────┐
│  ←  NOVÝ INZERÁT                                         3/4    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FOTOGRAFIE                                                      │
│  Přidejte min. 5 fotek                                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                      📷 VYFOTIT                            │ │
│  │                                                            │ │
│  │               [Otevřít kameru]                             │ │
│  │                                                            │ │
│  │                        nebo                                │ │
│  │                                                            │ │
│  │               [Vybrat z galerie]                           │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  NAHRANÉ FOTKY (7)                                               │
│                                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                           │
│  │ 📷 ⭐│ │ 📷   │ │ 📷   │ │ 📷   │                           │
│  │      │ │      │ │      │ │      │                           │
│  │  ✕   │ │  ✕   │ │  ✕   │ │  ✕   │                           │
│  └──────┘ └──────┘ └──────┘ └──────┘                           │
│                                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐                                    │
│  │ 📷   │ │ 📷   │ │ 📷   │                                    │
│  │      │ │      │ │      │                                    │
│  │  ✕   │ │  ✕   │ │  ✕   │                                    │
│  └──────┘ └──────┘ └──────┘                                    │
│                                                                  │
│  💡 Tip: Foťte za denního světla, uklizené auto                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    POKRAČOVAT                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│   🏠        🚗        ➕        💰        👤                    │
└──────────────────────────────────────────────────────────────────┘
```

### Step 4: Cena a odeslání

```
┌──────────────────────────────────────────────────────────────────┐
│  ←  NOVÝ INZERÁT                                         4/4    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CENA A LOKACE                                                   │
│                                                                  │
│  Prodejní cena*                                                  │
│  [ 450 000                                     ] Kč              │
│                                                                  │
│  [🔘] Cena k jednání                                            │
│                                                                  │
│  Město*                                                          │
│  [v Praha                                    ▾]                 │
│                                                                  │
│  Adresa (volitelné)                                              │
│  [ Vinohradská 10, Praha 2                     ]                 │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  VÝBAVA                                                          │
│                                                                  │
│  [✓] Klimatizace    [✓] LED světla    [✓] Navigace             │
│  [✓] Tempomat       [ ] Panorama      [✓] Parksenzory          │
│  [✓] Vyhř. sedadla  [✓] Kamera        [ ] Head-up              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  POPIS                                                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Prodám krásnou Octavii RS v top stavu...                   ││
│  │                                                             ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │               ULOŽIT JAKO DRAFT                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │            ODESLAT KE SCHVÁLENÍ                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│   🏠        🚗        ➕        💰        👤                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Moje vozy (/app/vehicles)

```
┌──────────────────────────────────────────────────────────────────┐
│  ←  MOJE VOZY                                    [+ Přidat]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Všechny ▾]  [Aktivní]  [Draft]  [Ke schválení]  [Prodané]    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ┌────────┐                                                 │ │
│  │ │        │  Škoda Octavia RS 2.0 TSI                      │ │
│  │ │  📷    │  2020 • 85 000 km • Benzín                     │ │
│  │ │        │                                                 │ │
│  │ └────────┘  450 000 Kč                                    │ │
│  │                                                            │ │
│  │  🟢 Aktivní    👁 234    🔴 3 právě prohlíží              │ │
│  │  Přidáno: 10.1.2026                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ┌────────┐                                                 │ │
│  │ │        │  VW Golf GTI                                   │ │
│  │ │  📷    │  2019 • 65 000 km • Benzín                     │ │
│  │ │        │                                                 │ │
│  │ └────────┘  380 000 Kč                                    │ │
│  │                                                            │ │
│  │  🟡 Ke schválení    Odesláno: před 2h                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ┌────────┐                                                 │ │
│  │ │        │  BMW X5 xDrive                                 │ │
│  │ │  📷    │  2021 • 45 000 km • Diesel                     │ │
│  │ │        │                                                 │ │
│  │ └────────┘  890 000 Kč                                    │ │
│  │                                                            │ │
│  │  🔵 Rezervace   👁 312   Zájemce: Martin K.               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│   🏠        🚗        ➕        💰        👤                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Editace ceny (s důvodem)

```
┌──────────────────────────────────────────────────────────────────┐
│  ←  ZMĚNA CENY                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Škoda Octavia RS 2.0 TSI                                       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Původní cena                                                    │
│  450 000 Kč                                                      │
│                                                                  │
│  Nová cena*                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 420 000                                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                           Kč                     │
│                                                                  │
│  Změna: -30 000 Kč (-6.7%)                                      │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Důvod změny*                                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Zákazník smlouval, nabídl hotovost                         ││
│  │                                                             ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ℹ️ Důvod bude viditelný pro BackOffice                        │
│                                                                  │
│                                                                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   ULOŽIT ZMĚNU                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│   🏠        🚗        ➕        💰        👤                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Provize (/app/commissions)

```
┌──────────────────────────────────────────────────────────────────┐
│  ←  MOJE PROVIZE                                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │   K VÝPLATĚ                                                 ││
│  │                                                             ││
│  │          32 000 Kč                                         ││
│  │                                                             ││
│  │   Čeká na schválení                                        ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [Leden 2026 ▾]                                                 │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   45 500 Kč   │  │  3 prodeje    │  │  2 bonusy     │       │
│  │    celkem     │  │               │  │               │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  HISTORIE                                                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 15.1.2026                                                  │ │
│  │ Škoda Octavia RS • Prodáno za 450 000 Kč                  │ │
│  │                                                            │ │
│  │ Provize z prodeje         12 500 Kč    ✅ Schváleno       │ │
│  │ Bonus pojištění            1 500 Kč    ✅ Schváleno       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 10.1.2026                                                  │ │
│  │ VW Golf GTI • Prodáno za 380 000 Kč                       │ │
│  │                                                            │ │
│  │ Provize z prodeje         12 500 Kč    ⏳ Čeká            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 05.1.2026                                                  │ │
│  │ BMW X3 • Prodáno za 750 000 Kč                            │ │
│  │                                                            │ │
│  │ Provize z prodeje         18 750 Kč    ✅ Vyplaceno       │ │
│  │ Bonus leasing              2 500 Kč    ✅ Vyplaceno       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│   🏠        🚗        ➕        💰        👤                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Push notifikace

### Typy notifikací

```javascript
const notificationTypes = {
  // Vozy
  VEHICLE_APPROVED: {
    title: 'Inzerát schválen ✅',
    body: '{vehicle} byl publikován',
    action: '/app/vehicles/{id}'
  },
  VEHICLE_REJECTED: {
    title: 'Inzerát vrácen ⚠️',
    body: '{vehicle} - {reason}',
    action: '/app/vehicles/{id}/edit'
  },
  VEHICLE_INQUIRY: {
    title: 'Nový dotaz 💬',
    body: '{vehicle} - "{message}"',
    action: '/app/messages/{id}'
  },
  VEHICLE_VIEW_MILESTONE: {
    title: 'Hodně zájemců! 🔥',
    body: '{vehicle} má už {count} zobrazení',
    action: '/app/vehicles/{id}'
  },
  
  // Provize
  COMMISSION_APPROVED: {
    title: 'Provize schválena 💰',
    body: '{amount} Kč za {vehicle}',
    action: '/app/commissions'
  },
  PAYOUT_SENT: {
    title: 'Výplata odeslána 🎉',
    body: '{amount} Kč bylo odesláno na váš účet',
    action: '/app/commissions'
  },
  
  // Leady (FÁZE 4)
  NEW_LEAD: {
    title: 'Nový lead! 🆕',
    body: '{brand} {model} v {city}',
    action: '/app/leads/{id}'
  },
  LEAD_ASSIGNED: {
    title: 'Lead přiřazen 📋',
    body: '{brand} {model} - kontaktujte zákazníka',
    action: '/app/leads/{id}'
  },
  
  // Recenze
  NEW_REVIEW: {
    title: 'Nová recenze ⭐',
    body: '{rating}⭐ od {author}',
    action: '/app/profile/reviews'
  },
};
```

### Implementace

```javascript
// Service Worker - push handler
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/192.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    data: { url: data.action },
    actions: [
      { action: 'open', title: 'Otevřít' },
      { action: 'dismiss', title: 'Zavřít' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
```

---

## Offline funkce

### Co funguje offline

```javascript
const offlineCapabilities = {
  // ✅ Plně offline
  viewMyVehicles: true,      // Cachované vozy
  createDraft: true,         // Uloženo lokálně
  takePhotos: true,          // Uloženo v IndexedDB
  viewCommissions: true,     // Cachované data
  
  // ⚠️ Částečně offline
  editVehicle: 'queued',     // Změny se uloží a syncnou
  changePrice: 'queued',     // Fronta změn
  
  // ❌ Vyžaduje online
  submitForApproval: false,  // Musí být online
  viewLeads: false,          // Real-time data
  sendMessage: false,        // Vyžaduje server
};
```

### Sync queue

```javascript
// Při offline akci
async function queueAction(action: PendingAction) {
  await db.pendingActions.add({
    id: generateId(),
    type: action.type,
    payload: action.payload,
    createdAt: new Date(),
    retries: 0
  });
  
  // Zaregistrovat sync
  if ('serviceWorker' in navigator && 'sync' in registration) {
    await registration.sync.register('sync-actions');
  }
}

// Service Worker - background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  const actions = await db.pendingActions.toArray();
  
  for (const action of actions) {
    try {
      await processAction(action);
      await db.pendingActions.delete(action.id);
    } catch (error) {
      // Retry later
      await db.pendingActions.update(action.id, {
        retries: action.retries + 1
      });
    }
  }
}
```

---

## Poznámky pro vývojáře

1. **PWA install prompt** - zobrazit na dashboardu pro nové uživatele.

2. **Camera API** - preferovat zadní kameru, komprese fotek před uploadem.

3. **Offline drafty** - jasně označit že nejsou synchronizované.

4. **Background sync** - testovat na různých zařízeních, fallback na manual sync.

5. **Push permissions** - žádat až po první úspěšné akci (ne hned po loginu).

6. **VIN scanner** - použít knihovnu pro OCR nebo vlastní ML model.
