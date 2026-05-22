# Audit — Flow notifikace "Nový zájemce" v PWA makléře

**Autor:** PLÁNOVAČ  
**Datum:** 2026-04-26  
**Status:** HOTOVO

---

## Shrnutí

Notifikace "Nový zájemce" má **BROKEN LINK** — odkazuje na neexistující stránku `/makler/vehicles/{id}/inquiries`, zatímco skutečná stránka s dotazy je na `/makler/messages/{id}`. Navíc stránka Zprávy **CHYBÍ v bottom navigaci** a je dostupná jen z detailu vozidla.

---

## 1. Kam vede klik na notifikaci "Nový zájemce"?

### NotificationBell (komponenta)
**Soubor:** `components/pwa/NotificationBell.tsx:57-76`

```typescript
const handleNotificationClick = async (notification: Notification) => {
  // ... mark as read ...
  if (notification.link) {
    router.push(notification.link);  // ← naviguje na notification.link
  }
};
```

### Kde se notifikace vytváří
**Soubor:** `app/api/vehicles/[id]/inquiries/route.ts:122-128`

```typescript
await createNotification({
  userId: vehicle.brokerId,
  type: "MESSAGE",
  title: `Nový dotaz na ${vehicle.brand} ${vehicle.model}`,
  body: `${data.buyerName}: ${data.message}`,
  link: `/makler/vehicles/${vehicle.id}/inquiries`,  // ← BROKEN LINK
});
```

### Kam notifikace odkazuje vs. kde stránka existuje

| Notifikace link | Skutečná stránka | Stav |
|----------------|------------------|------|
| `/makler/vehicles/{id}/inquiries` | **NEEXISTUJE** | **❌ 404** |
| `/makler/messages/{id}` | `app/(pwa)/makler/messages/[vehicleId]/page.tsx` | ✅ OK |

**BUG:** Notifikace odkazuje na `/makler/vehicles/{id}/inquiries`, ale stránka je na `/makler/messages/{id}`. Klik na notifikaci → **404**.

---

## 2. Existuje stránka detailu zájemce / lead detailu v PWA?

### Stránka se seznamem dotazů pro dané vozidlo: ✅ EXISTUJE
**Soubor:** `app/(pwa)/makler/messages/[vehicleId]/page.tsx`  
**URL:** `/makler/messages/{vehicleId}`

Zobrazuje:
- Header s názvem vozidla + tlačítko zpět na `/makler/messages`
- Seznam všech `VehicleInquiry` pro dané vozidlo (seřazených od nejnovějšího)
- Pro každý inquiry: jméno, telefon, email, zpráva, status, nabídnutá cena
- Akční tlačítka přes `<InquiryActions>` komponentu

### Přehled všech vozidel s dotazy: ✅ EXISTUJE
**Soubor:** `app/(pwa)/makler/messages/page.tsx`  
**URL:** `/makler/messages`

Zobrazuje:
- Seznam všech vozidel makléře, ke kterým existují dotazy
- Pro každé vozidlo: miniatura, název, počet nových dotazů (badge), poslední dotaz
- Klik → `/makler/messages/{vehicleId}`

### Detail jednoho konkrétního zájemce: ❌ NEEXISTUJE
Neexistuje stránka `/makler/messages/{vehicleId}/{inquiryId}` pro zobrazení jednoho konkrétního dotazu. Dotazy se zobrazují v seznamu na stránce vozidla.

---

## 3. Jak se vytváří notifikace "Nový zájemce"?

### Flow pro makléřská vozidla (Vehicle):

```
Kupující na webu → ContactForm (components/web/ContactForm.tsx)
  → POST /api/vehicles/{id}/inquiries
    → prisma.vehicleInquiry.create({
        vehicleId, brokerId, buyerName, buyerPhone, buyerEmail, message, status: "NEW"
      })
    → createNotification({
        userId: vehicle.brokerId,
        type: "MESSAGE",
        title: "Nový dotaz na {brand} {model}",
        body: "{buyerName}: {message}",
        link: "/makler/vehicles/{vehicleId}/inquiries"  ← BROKEN
      })
```

### Flow pro inzerátová vozidla (Listing):

```
Kupující → SellerInfo formulář (components/web/SellerInfo.tsx)
  → POST /api/listings/{id}/inquiry
    → prisma.inquiry.create({ listingId, senderId, name, email, phone, message })
    → createNotification({
        userId: listing.userId,
        type: "MESSAGE",
        title: "Nový dotaz na {brand} {model}",
        body: "{name} ({phone}) — {message}",
        link: "/inzerce/moje/{listingId}"  ← OK (jiný flow)
      })
```

---

## 4. Existuje model pro buyer interest / lead v Prisma schema?

### VehicleInquiry (pro makléřská vozidla): ✅ EXISTUJE
**Soubor:** `prisma/schema.prisma:406-431`

```
model VehicleInquiry {
  id         String  @id @default(cuid())
  vehicleId  String
  brokerId   String
  
  buyerName   String      ← jméno kupujícího
  buyerPhone  String      ← telefon kupujícího
  buyerEmail  String?     ← email (volitelný)
  message     String      ← zpráva od kupujícího
  
  status       String @default("NEW")  // NEW, REPLIED, VIEWING_SCHEDULED, NEGOTIATING, RESERVED, SOLD, NO_INTEREST
  reply        String?     ← odpověď makléře
  repliedAt    DateTime?
  viewingDate  DateTime?   ← datum prohlídky
  viewingResult String?    // INTERESTED, THINKING, NO_INTEREST
  offeredPrice  Int?       ← nabídnutá cena
  agreedPrice   Int?       ← dohodnutá cena
}
```

### Lead (pro příchozí leady — např. z webu "chci prodat"): ✅ EXISTUJE
**Soubor:** `prisma/schema.prisma:594-634`

```
model Lead {
  id    String @id @default(cuid())
  name  String
  phone String
  email String?
  brand, model, year, mileage, expectedPrice, description
  source       String  // WEB_FORM, EXTERNAL_APP, MANUAL, REFERRAL
  assignedToId String? ← přiřazený makléř
  status       String  // NEW, ASSIGNED, CONTACTED, MEETING_SCHEDULED, ...
  vehicleId    String? ← propojení na vytvořené vozidlo
}
```

### Inquiry (pro inzertní platformu): ✅ EXISTUJE
**Soubor:** `prisma/schema.prisma:779+`
- Oddělenný model pro dotazy na inzeráty (Listing), ne na makléřská vozidla (Vehicle)

### Notification model: ✅ EXISTUJE
**Soubor:** `prisma/schema.prisma:498-514`

```
model Notification {
  id     String  @id @default(cuid())
  userId String
  type   String  // COMMISSION, VEHICLE, SYSTEM, MESSAGE
  title  String
  body   String
  link   String?    ← kam notifikace naviguje
  read   Boolean @default(false)
  createdAt DateTime
}
```

---

## 5. Kde makléř vidí kontaktní údaje zájemce?

### Přes stránku zpráv: `/makler/messages/{vehicleId}`
**Zobrazuje:** jméno, telefon, email, zprávu, status, nabídnutou cenu  
**Akce:** odpovědět, zavolat (`tel:` link), naplánovat prohlídku, označit "bez zájmu"

**Komponenty:**
- `components/pwa/messages/InquiryActions.tsx` — hlavní interakční karta
- `components/pwa/messages/InquiryCard.tsx` — zobrazovací karta (typ + export)

### Přes detail vozidla: `/makler/vehicles/{id}`
**Soubor:** `components/pwa/vehicles/VehicleDetailHub.tsx:444-445, 590`
- Alert banner: "{N} nový dotaz" → link na `/makler/messages/{vehicleId}`
- Sekce "Dotazy kupujících" → posledních 5 dotazů + "Zobrazit vše" link

### Přes BottomNav: ❌ NEPŘÍSTUPNÉ
**Soubor:** `components/pwa/BottomNav.tsx`  
Bottom navigace má: Domů, Vozy, Přidat, Kontakty, Profil  
**Zprávy/Messages CHYBÍ v navigaci.** Stránka `/makler/messages` je dostupná pouze:
1. Z detailu vozidla (VehicleDetailHub)
2. Z notifikace (ale ta má broken link → 404)

---

## Nalezené problémy

| # | Priorita | Problém | Soubor | Řádek |
|---|----------|---------|--------|-------|
| 1 | **P0 KRITICKÝ** | Notification link vede na neexistující `/makler/vehicles/{id}/inquiries` → 404 | `app/api/vehicles/[id]/inquiries/route.ts` | 127 |
| 2 | **P1 STŘEDNÍ** | Stránka Zprávy (`/makler/messages`) chybí v BottomNav — makléř ji nenajde | `components/pwa/BottomNav.tsx` | — |
| 3 | **P2 NICE TO HAVE** | Neexistuje detail jednoho dotazu — všechny dotazy pro vozidlo jsou v jednom seznamu | — | — |

---

## Doporučené opravy

### Oprava #1 (P0 — 1 řádek):
**Soubor:** `app/api/vehicles/[id]/inquiries/route.ts:127`

```diff
- link: `/makler/vehicles/${vehicle.id}/inquiries`,
+ link: `/makler/messages/${vehicle.id}`,
```

### Oprava #2 (P1 — ~15 řádků):
Přidat "Zprávy" do BottomNav. Dvě varianty:

**A) Nahradit "Kontakty" za "Zprávy"** (pokud zprávy jsou důležitější):
```typescript
{
  label: "Zprávy",
  href: "/makler/messages",
  icon: (active) => /* message/chat icon */,
  hasBadge: true,  // badge s počtem nových dotazů
}
```

**B) Přidat 6. položku** (příliš mnoho pro bottom nav) — NE  
**C) Přidat do dashboardu** jako sekci/shortcut — nejsnazší

**Doporučení:** Přidat "Zprávy" jako QuickAction na dashboard (vedle existujících) + opravit notification link. BottomNav nechat jak je.

### Oprava #3 (P2 — nice to have):
Neřešit nyní. Seznam dotazů na stránce vozidla je dostatečný.

---

## Kompletní flow diagram

```
KUPUJÍCÍ (web)
  │
  ├─ Makléřské vozidlo → ContactForm
  │   └→ POST /api/vehicles/{id}/inquiries
  │       ├→ VehicleInquiry.create (DB)
  │       └→ Notification.create
  │           link: "/makler/vehicles/{id}/inquiries" ← BROKEN (404)
  │           správně: "/makler/messages/{id}"
  │
  └─ Inzertní vozidlo → SellerInfo
      └→ POST /api/listings/{id}/inquiry
          ├→ Inquiry.create (DB)
          └→ Notification.create
              link: "/inzerce/moje/{id}" ← OK

MAKLÉŘ (PWA)
  │
  ├─ NotificationBell → klik na notifikaci → router.push(notification.link)
  │   → /makler/vehicles/{id}/inquiries → 404 ❌
  │
  ├─ Dashboard → NotificationsList → klik → router.push(notification.link)
  │   → /makler/vehicles/{id}/inquiries → 404 ❌
  │
  ├─ VehicleDetailHub → "N nových dotazů" banner / "Dotazy kupujících" sekce
  │   → /makler/messages/{vehicleId} → ✅ FUNGUJE
  │
  └─ /makler/messages (přehled) → /makler/messages/{vehicleId} (detail)
      → InquiryActions: jméno, telefon, email, zpráva, odpovědět, zavolat, prohlídka
      → ✅ FUNGUJE (ale není v navigaci)
```

---

## API endpoints — stav

| Endpoint | Method | Účel | Stav |
|----------|--------|------|------|
| `GET /api/vehicles/[id]/inquiries` | GET | Seznam dotazů k vozidlu | ✅ OK |
| `POST /api/vehicles/[id]/inquiries` | POST | Nový dotaz (z webu, bez auth) | ✅ OK (ale notification link broken) |
| `PUT /api/vehicles/[id]/inquiries/[inquiryId]` | PUT | Aktualizace dotazu (reply, viewing, status) | ✅ OK |
| `GET /api/broker/notifications` | GET | Seznam notifikací makléře | ✅ OK |
| `PATCH /api/broker/notifications` | PATCH | Mark as read | ✅ OK |

---

*Audit proveden: 2026-04-26*
