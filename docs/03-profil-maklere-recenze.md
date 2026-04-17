# Carmakler - Modul 3: Profil makléře & Recenze

## Přehled modulu

Veřejný profil makléře na webu + systém recenzí od klientů. Klíčové pro budování důvěry a diferenciaci makléřů.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Databáze:** PostgreSQL + Prisma ORM
- **Obrázky:** Cloudinary nebo AWS S3
- **SEO:** Next.js Metadata API

---

## Datový model

### Rozšíření User modelu (z Modulu 1)

```prisma
model User {
  // ... existující pole z Modulu 1
  
  // Veřejný profil
  slug              String?   @unique  // jan-novak-praha
  publicBio         String?   @db.Text
  publicPhone       String?            // Může se lišit od interního
  publicEmail       String?
  
  // Sociální sítě
  linkedIn          String?
  facebook          String?
  instagram         String?
  
  // Certifikáty a ocenění
  certificates      Certificate[]
  
  // Statistiky (cachované)
  totalSales        Int       @default(0)
  totalReviews      Int       @default(0)
  averageRating     Float     @default(0)
  avgDaysToSell     Int?      // Průměrná doba prodeje
  
  // Vztahy
  reviews           Review[]  @relation("BrokerReviews")
  givenReviews      Review[]  @relation("ClientReviews")
}

model Certificate {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  name        String   // "Odhadce vozidel"
  issuer      String?  // "Asociace prodejců vozidel"
  issuedAt    DateTime?
  expiresAt   DateTime?
  imageUrl    String?
  
  createdAt   DateTime @default(now())
}
```

### Review

```prisma
model Review {
  id            String       @id @default(cuid())
  
  // Vazby
  brokerId      String
  broker        User         @relation("BrokerReviews", fields: [brokerId], references: [id])
  
  vehicleId     String?      // Volitelně - ke kterému vozu
  vehicle       Vehicle?     @relation(fields: [vehicleId], references: [id])
  
  // Autor recenze
  clientId      String?      // Pokud je registrovaný
  client        User?        @relation("ClientReviews", fields: [clientId], references: [id])
  clientName    String       // Zobrazované jméno
  clientEmail   String       // Pro ověření (nezobrazuje se)
  
  // Hodnocení
  overallRating Int          // 1-5 hvězdiček
  
  // Detailní hodnocení
  communication Int?         // 1-5
  speed         Int?         // 1-5 (rychlost vyřízení)
  reliability   Int?         // 1-5 (spolehlivost)
  expertise     Int?         // 1-5 (odbornost)
  
  // Text
  title         String?
  content       String       @db.Text
  
  // Odpověď makléře
  brokerReply   String?      @db.Text
  brokerReplyAt DateTime?
  
  // Status
  status        ReviewStatus @default(PENDING)
  verifiedPurchase Boolean   @default(false)  // Ověřený nákup
  
  // Timestamps
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum ReviewStatus {
  PENDING       // Čeká na moderaci
  APPROVED      // Schváleno
  REJECTED      // Zamítnuto
  HIDDEN        // Skryto (na žádost)
}
```

---

## URL struktura

```
/makleri                          # Seznam všech makléřů
/makleri/[mesto]                  # Makléři ve městě (Praha, Brno...)
/makler/[slug]                    # Profil makléře (jan-novak-praha)
/makler/[slug]/recenze            # Všechny recenze makléře
/makler/[slug]/nabidky            # Všechny vozy makléře
```

---

## Veřejný profil makléře

### Obsah profilu

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────┐  Jan Novák                              ⭐ 4.8 (47)   │
│  │      │  Senior makléř                                          │
│  │ FOTO │  Praha a okolí                                         │
│  │      │                                                        │
│  └──────┘  📞 +420 777 123 456                                  │
│            ✉️ jan.novak@carmakler.cz                             │
│                                                                  │
│            [LinkedIn] [Facebook]                                 │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  O MNĚ                                                          │
│  ─────                                                          │
│  S prodejem automobilů se zabývám přes 10 let. Specializuji     │
│  se na prémiové vozy a SUV. Mým cílem je najít pro každého      │
│  klienta ideální vůz za férovou cenu.                           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STATISTIKY                                                      │
│  ─────────                                                       │
│  🚗 156 prodaných vozů    ⏱️ Ø 18 dní do prodeje               │
│  ⭐ 4.8 průměrné hodnocení  💬 47 recenzí                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SPECIALIZACE                                                    │
│  ───────────                                                     │
│  [SUV] [Prémiové vozy] [Elektromobily]                          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CERTIFIKÁTY                                                     │
│  ──────────                                                      │
│  ✓ Odhadce vozidel (APOV, 2023)                                 │
│  ✓ Specialista na prémiové vozy (BMW Academy, 2022)             │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AKTUÁLNÍ NABÍDKY (8)                        [Zobrazit všechny] │
│  ────────────────                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ BMW X5  │ │ Audi Q7 │ │ MB GLE  │ │ VW Toua │               │
│  │ 890k Kč │ │ 750k Kč │ │ 1.2M Kč │ │ 650k Kč │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RECENZE (47)                                [Zobrazit všechny] │
│  ───────────                                                     │
│                                                                  │
│  ⭐⭐⭐⭐⭐  "Perfektní zkušenost!"                              │
│  Martin K. • ověřený nákup • 15.1.2026                          │
│  "Pan Novák mi pomohl najít přesně to auto, které jsem          │
│  hledal. Profesionální přístup, vše vyřízeno během týdne."      │
│                                                                  │
│  → Odpověď makléře: "Děkuji za krásné hodnocení, Martine!       │
│    Bylo mi potěšením."                                           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ⭐⭐⭐⭐☆  "Spolehlivý makléř"                                  │
│  Jana P. • 10.1.2026                                            │
│  "Dobrá komunikace, jen trvalo trochu déle než jsem čekala."    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Systém recenzí

### Workflow recenzí

```
1. VYTVOŘENÍ RECENZE
   ├── Po prodeji vozu (automatická výzva emailem)
   └── Manuálně přes web/formulář
   
2. MODERACE (PENDING)
   ├── Kontrola obsahu
   ├── Ověření emailu
   └── Kontrola duplicit
   
3. PUBLIKACE (APPROVED)
   ├── Zobrazeno na profilu makléře
   ├── Započítáno do hodnocení
   └── Notifikace makléři
   
4. ODPOVĚĎ MAKLÉŘE (volitelné)
   └── Makléř může odpovědět přes PWA
```

### Automatická výzva k recenzi

```javascript
// Po označení vozu jako SOLD
async function sendReviewRequest(sale: Sale) {
  // Počkat 3 dny po prodeji
  await scheduleEmail({
    to: sale.buyerEmail,
    template: 'review-request',
    data: {
      brokerName: sale.broker.firstName,
      vehicleName: `${sale.vehicle.brand} ${sale.vehicle.model}`,
      reviewLink: `${BASE_URL}/recenze/nova?token=${generateToken(sale)}`
    },
    sendAt: addDays(sale.soldAt, 3)
  });
}
```

### Formulář recenze

```
┌──────────────────────────────────────────────────────────────┐
│  OHODNOŤTE MAKLÉŘE                                           │
│  Jan Novák                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Vaše celkové hodnocení*                                     │
│  ☆ ☆ ☆ ☆ ☆                                                  │
│                                                              │
│  Detailní hodnocení (volitelné)                              │
│  Komunikace    ☆ ☆ ☆ ☆ ☆                                    │
│  Rychlost      ☆ ☆ ☆ ☆ ☆                                    │
│  Spolehlivost  ☆ ☆ ☆ ☆ ☆                                    │
│  Odbornost     ☆ ☆ ☆ ☆ ☆                                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Nadpis recenze                                              │
│  [Perfektní zkušenost!_____________________]                 │
│                                                              │
│  Vaše zkušenost*                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │                                                      │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  Min. 50 znaků                                               │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Vaše jméno*    [Martin K.________________]                  │
│  Email*         [martin@email.cz__________]                  │
│                 ℹ️ Email nebude zveřejněn                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [         ODESLAT RECENZI         ]                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Seznam makléřů

### Stránka /makleri

```
┌──────────────────────────────────────────────────────────────────┐
│  NAŠI MAKLÉŘI                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Filtr: [Všechna města ▾]  Řazení: [Nejlépe hodnocení ▾]       │
│                                                                  │
│  Praha (12) • Brno (8) • Ostrava (5) • Plzeň (3) • ...          │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ┌──────┐  Jan Novák                     ⭐ 4.8 (47)       │ │
│  │ │ FOTO │  Praha • SUV, Prémiové vozy                      │ │
│  │ └──────┘  🚗 8 aktivních nabídek                          │ │
│  │           [Zobrazit profil]                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ┌──────┐  Petra Malá                    ⭐ 4.9 (32)       │ │
│  │ │ FOTO │  Brno • Elektromobily, Hybridy                   │ │
│  │ └──────┘  🚗 5 aktivních nabídek                          │ │
│  │           [Zobrazit profil]                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ...                                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Profily makléřů

```
GET    /api/brokers                     # Seznam makléřů (veřejný)
GET    /api/brokers/:slug               # Detail makléře (veřejný)
PUT    /api/brokers/:id/profile         # Úprava profilu (vlastní)
POST   /api/brokers/:id/avatar          # Upload avataru
```

### Recenze

```
GET    /api/brokers/:id/reviews         # Recenze makléře
POST   /api/reviews                     # Vytvořit recenzi
PUT    /api/reviews/:id/reply           # Odpověď makléře
GET    /api/reviews/pending             # Ke schválení (BackOffice)
POST   /api/reviews/:id/approve         # Schválit (BackOffice)
POST   /api/reviews/:id/reject          # Zamítnout (BackOffice)
```

### Certifikáty

```
GET    /api/brokers/:id/certificates    # Certifikáty makléře
POST   /api/certificates                # Přidat certifikát
DELETE /api/certificates/:id            # Smazat certifikát
```

---

## SEO a Metadata

### Profil makléře

```javascript
export async function generateMetadata({ params }): Promise<Metadata> {
  const broker = await getBrokerBySlug(params.slug);
  
  return {
    title: `${broker.fullName} - Automakléř ${broker.city} | Carmakler`,
    description: `${broker.fullName} - ověřený automakléř v ${broker.city}. ⭐ ${broker.averageRating} (${broker.totalReviews} recenzí). ${broker.totalSales} prodaných vozů.`,
    openGraph: {
      images: [broker.avatar],
    },
  };
}
```

### Strukturovaná data (JSON-LD)

```javascript
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": broker.fullName,
  "jobTitle": "Automakléř",
  "image": broker.avatar,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": broker.city,
    "addressCountry": "CZ"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": broker.averageRating,
    "reviewCount": broker.totalReviews
  }
};
```

---

## Výpočet hodnocení

### Průměrné hodnocení

```javascript
async function recalculateBrokerRating(brokerId: string) {
  const reviews = await prisma.review.findMany({
    where: { 
      brokerId, 
      status: 'APPROVED' 
    },
    select: { overallRating: true }
  });
  
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews
    : 0;
  
  await prisma.user.update({
    where: { id: brokerId },
    data: { 
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10 // 1 desetinné místo
    }
  });
}
```

### Aktualizace statistik

```javascript
// Spouštět jako CRON job (1x denně) nebo po každém prodeji
async function updateBrokerStats(brokerId: string) {
  const sales = await prisma.vehicle.findMany({
    where: { 
      brokerId, 
      status: 'SOLD',
      soldAt: { not: null }
    },
    select: { 
      createdAt: true, 
      soldAt: true 
    }
  });
  
  const totalSales = sales.length;
  
  // Průměrná doba prodeje
  const avgDaysToSell = totalSales > 0
    ? Math.round(
        sales.reduce((sum, v) => {
          const days = differenceInDays(v.soldAt!, v.createdAt);
          return sum + days;
        }, 0) / totalSales
      )
    : null;
  
  await prisma.user.update({
    where: { id: brokerId },
    data: { totalSales, avgDaysToSell }
  });
}
```

---

## Moderace recenzí

### BackOffice - Fronta recenzí

```
┌──────────────────────────────────────────────────────────────────┐
│  RECENZE KE SCHVÁLENÍ (5)                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⭐⭐⭐⭐⭐  "Perfektní zkušenost!"           čeká 2h       │ │
│  │ Pro: Jan Novák • Od: Martin K. (martin@email.cz)          │ │
│  │                                                            │ │
│  │ "Pan Novák mi pomohl najít přesně to auto, které jsem     │ │
│  │ hledal. Profesionální přístup..."                         │ │
│  │                                                            │ │
│  │ ☑️ Ověřený nákup (Škoda Octavia, 15.1.2026)               │ │
│  │                                                            │ │
│  │ [✓ Schválit]  [✗ Zamítnout]  [Upravit]                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ⭐  "Hrozná zkušenost"                       čeká 5h       │ │
│  │ Pro: Petra Malá • Od: Anonym (test@test.cz)               │ │
│  │                                                            │ │
│  │ "NEDOPORUČUJI!!! Podvod!!!"                               │ │
│  │                                                            │ │
│  │ ⚠️ Podezřelé: Anonymní email, krátký text                 │ │
│  │                                                            │ │
│  │ [✓ Schválit]  [✗ Zamítnout]  [Kontaktovat autora]        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Pravidla moderace

```javascript
const moderationRules = {
  autoApprove: {
    // Automaticky schválit pokud:
    verifiedPurchase: true,
    minRating: 3,
    minTextLength: 50,
    noSpamWords: true
  },
  
  autoFlag: {
    // Označit k manuální kontrole pokud:
    rating: 1,                    // 1 hvězdička
    containsUrls: true,           // Obsahuje odkazy
    shortText: true,              // < 30 znaků
    suspiciousEmail: true,        // Disposable email
    duplicateContent: true,       // Podobný text jiné recenzi
    spamWords: ['podvod', 'scam', 'nedoporučuji!!!']
  },
  
  autoReject: {
    // Automaticky zamítnout pokud:
    disposableEmail: true,        // Jednorázový email
    duplicateFromSameIp: true,    // Více recenzí ze stejné IP
    containsPhoneOrEmail: true,   // Osobní údaje v textu
  }
};
```

---

## Poznámky pro vývojáře

1. **Slug generování** - automaticky z jména + město, zajistit unikátnost (jan-novak-praha, jan-novak-praha-2).

2. **Cachování statistik** - recalculate pouze při změně, ne při každém zobrazení.

3. **Ověřený nákup** - propojit s Commission/Sale záznamy pro důvěryhodnost.

4. **Odpověď makléře** - max 1 odpověď na recenzi, možnost editace 24h.

5. **GDPR** - smazání recenzí při žádosti, anonymizace po X letech.
