# Carmakler - Modul 5: Web Frontend (Portál)

## Přehled modulu

Veřejný web pro zákazníky - vyhledávání vozů, profily makléřů, budoucí platforma pro zadávání vozů k prodeji.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Animace:** Framer Motion
- **Mapy:** Mapy.cz API nebo Google Maps
- **Real-time:** Pusher nebo Socket.io (pro live viewers)
- **Analytics:** Vercel Analytics / Google Analytics

---

## Inspirace

**Autorro.sk** - čistý design, dobrá filtrace, přehledné karty vozů

---

## URL Struktura

```
/                                 # Homepage
/vozy                             # Katalog všech vozů
/vozy/[slug]                      # Detail vozu
/vozy/suv                         # Kategorie SUV
/vozy/elektro                     # Elektromobily
/makleri                          # Seznam makléřů
/makleri/[mesto]                  # Makléři ve městě
/makler/[slug]                    # Profil makléře
/prodat-auto                      # Formulář pro prodejce (FÁZE 4)
/o-nas                            # O společnosti
/jak-to-funguje                   # Jak funguje služba
/kontakt                          # Kontakt
/blog                             # Blog/aktuality
```

---

## Homepage

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [LOGO]                    Vozy   Makléři   Prodat auto   O nás   [CTA] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    ╔════════════════════════════════════════╗           │
│                    ║                                        ║           │
│    HERO SECTION    ║   Najděte svůj vysněný vůz            ║           │
│    (video/image)   ║   s osobním makléřem                  ║           │
│                    ║                                        ║           │
│                    ║   [Značka ▾] [Model ▾] [Cena ▾] [🔍]  ║           │
│                    ║                                        ║           │
│                    ╚════════════════════════════════════════╝           │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🔥 PRÁVĚ PŘIDANÉ                                    [Zobrazit všechny] │
│                                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 📷      │ │ 📷      │ │ 📷      │ │ 📷      │ │ 📷      │           │
│  │ BMW X5  │ │ Audi Q7 │ │ Škoda   │ │ VW Golf │ │ Mercedes│           │
│  │ 890k Kč │ │ 750k Kč │ │ 450k Kč │ │ 380k Kč │ │ 1.2M Kč │           │
│  │ 👁 156  │ │ 👁 89   │ │ 👁 234  │ │ 👁 67   │ │ 👁 312  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  JAK TO FUNGUJE                                                          │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │      1       │  │      2       │  │      3       │                   │
│  │   Vyberte    │  │   Kontakt    │  │  Koupeno!   │                   │
│  │     vůz      │  │  s makléřem  │  │             │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ⭐ NEJLÉPE HODNOCENÍ MAKLÉŘI                                            │
│                                                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐            │
│  │ 👤 Jan Novák    │ │ 👤 Petra Malá   │ │ 👤 Karel Dvořák │            │
│  │ ⭐ 4.9 (52)     │ │ ⭐ 4.8 (47)     │ │ ⭐ 4.8 (38)     │            │
│  │ Praha           │ │ Brno            │ │ Ostrava         │            │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘            │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  💬 CO ŘÍKAJÍ NAŠI KLIENTI                                               │
│                                                                          │
│  "Skvělá zkušenost! Pan Novák mi našel přesně to, co jsem hledal."      │
│  — Martin K., Praha                                                      │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📊 V ČÍSLECH                                                            │
│                                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │  1,250  │  │   85    │  │  4.8⭐  │  │   18    │                     │
│  │prodaných│  │ makléřů │  │hodnocení│  │dní Ø    │                     │
│  │  vozů   │  │         │  │         │  │do prodej│                     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  FOOTER: O nás | Kontakt | Pro makléře | Podmínky | GDPR                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Katalog vozů (/vozy)

### Filtry

```
┌────────────────────────────────────────────────────────────────────┐
│  FILTRY                                              [Resetovat]  │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Značka          [Všechny ▾]                                      │
│  Model           [Všechny ▾]  (závislý na značce)                 │
│                                                                    │
│  Cena            [od____] - [do____] Kč                           │
│                  ├──────────●────────┤                            │
│                                                                    │
│  Rok výroby      [od____] - [do____]                              │
│  Najeto          [do________] km                                  │
│                                                                    │
│  Palivo          ☐ Benzín  ☐ Diesel  ☐ Elektro  ☐ Hybrid         │
│  Převodovka      ☐ Manuál  ☐ Automat                              │
│  Karoserie       ☐ Sedan  ☐ Kombi  ☐ SUV  ☐ Hatchback            │
│                                                                    │
│  Lokace          [Celá ČR ▾]                                      │
│                                                                    │
│  [🔍 Hledat]                                                      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Seznam vozů

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Nalezeno 156 vozů                    Řazení: [Nejnovější ▾]            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ┌──────────┐                                                       │ │
│  │ │          │  Škoda Octavia RS 2.0 TSI                            │ │
│  │ │   📷     │  2020 • 85 000 km • Benzín • DSG • Combi             │ │
│  │ │          │                                                       │ │
│  │ │  12 fotek│  📍 Praha            👤 Jan Novák ⭐4.8              │ │
│  │ └──────────┘                                                       │ │
│  │              👁 234 zobrazení  •  🔴 3 lidé si právě prohlíží     │ │
│  │                                                                    │ │
│  │  [Klimatizace] [LED] [Navigace] [Tempomat] +5                     │ │
│  │                                                                    │ │
│  │                                           450 000 Kč   [Detail]   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ...                                                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [1] [2] [3] ... [12]  →                                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Detail vozu (/vozy/[slug])

### Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Zpět na výpis      Škoda Octavia RS 2.0 TSI 2020                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────┐  ┌────────────────────────────┐│
│  │                                     │  │                            ││
│  │                                     │  │  450 000 Kč                ││
│  │         HLAVNÍ FOTKA                │  │  Cena k jednání            ││
│  │           (galerie)                 │  │                            ││
│  │                                     │  │  ─────────────────────────  ││
│  │  < [1/12] >                         │  │                            ││
│  │                                     │  │  📍 Praha 4, Autobazar XY  ││
│  └─────────────────────────────────────┘  │                            ││
│                                           │  👤 Makléř:                ││
│  ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐     │  ┌──────┐ Jan Novák        ││
│  │thumb││thumb││thumb││thumb││thumb│     │  │ FOTO │ ⭐ 4.8 (47)       ││
│  └─────┘└─────┘└─────┘└─────┘└─────┘     │  └──────┘                   ││
│                                           │                            ││
│  ─────────────────────────────────────── │  📞 +420 777 123 456       ││
│                                           │  ✉️ jan@carmakler.cz       ││
│  👁 456 zobrazení                        │                            ││
│  🔴 5 lidí si právě prohlíží tento vůz   │  [  Kontaktovat makléře  ] ││
│                                           │  [  Domluvit prohlídku   ] ││
│                                           │                            ││
│                                           │  ─────────────────────────  ││
│                                           │  ❤️ Uložit do oblíbených   ││
│                                           │  📤 Sdílet                 ││
│                                           └────────────────────────────┘│
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ZÁKLADNÍ ÚDAJE                                                          │
│  ──────────────                                                          │
│                                                                          │
│  ┌─────────────────┬─────────────────┬─────────────────┬───────────────┐│
│  │ Rok výroby      │ Najeto          │ Palivo          │ Převodovka    ││
│  │ 2020            │ 85 000 km       │ Benzín          │ DSG (automat) ││
│  ├─────────────────┼─────────────────┼─────────────────┼───────────────┤│
│  │ Výkon           │ Objem           │ Karoserie       │ Pohon         ││
│  │ 180 kW (245 HP) │ 1 984 ccm       │ Combi           │ Přední        ││
│  ├─────────────────┼─────────────────┼─────────────────┼───────────────┤│
│  │ Barva           │ STK do          │ Počet majitelů  │ Země původu   ││
│  │ Modrá Race      │ 12/2025         │ 1               │ Česko         ││
│  └─────────────────┴─────────────────┴─────────────────┴───────────────┘│
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  VÝBAVA                                                                  │
│  ─────                                                                   │
│                                                                          │
│  ✓ Automatická klimatizace    ✓ LED světlomety    ✓ Navigace            │
│  ✓ Vyhřívaná sedadla          ✓ Parkovací kamera  ✓ Tempomat            │
│  ✓ Elektrické okna            ✓ Centrální zamykání ✓ Start/Stop         │
│  ✓ Sportovní sedadla          ✓ Panoramatická střecha                   │
│  ... [Zobrazit vše]                                                      │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POPIS                                                                   │
│  ─────                                                                   │
│                                                                          │
│  Nabízím krásnou Škodu Octavia RS v top stavu. Vůz je po prvním         │
│  majiteli, servisovaný v autorizovaném servisu. Kompletní servisní      │
│  kniha, nové brzdy a rozvody. Zimní i letní pneu na ALU discích.        │
│                                                                          │
│  Možnost prověření v libovolném servisu. Financování a pojištění        │
│  zajistím.                                                               │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ⭐ RECENZE NA TENTO VŮZ (3)                          [Napsat recenzi]  │
│  ───────────────────────                                                 │
│                                                                          │
│  ⭐⭐⭐⭐⭐  "Krásný vůz, odpovídá popisu"                               │
│  Tomáš H. • prohlédl si vůz • 16.1.2026                                 │
│  "Byl jsem se na auto podívat, vše odpovídá inzerátu. Makléř velmi      │
│  ochotný, zodpověděl všechny dotazy."                                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ⭐⭐⭐⭐☆  "Pěkné auto, trochu vyšší cena"                              │
│  Jana K. • 14.1.2026                                                    │
│  "Vůz v dobrém stavu, ale cena mi přišla trochu vyšší vzhledem k roku." │
│                                                                          │
│  → Odpověď makléře: "Děkuji za zpětnou vazbu. Cena odpovídá stavu       │
│    a kompletní výbavě RS."                                               │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📍 KDE NAJDETE TENTO VŮZ                                               │
│  ────────────────────────                                                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │                         [MAPA]                                     │ │
│  │                    (interaktivní mapa)                             │ │
│  │                           📍                                       │ │
│  │                     přibližná lokace                               │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  📍 Praha 4 - Nusle                                                     │
│  🏢 Autobazar TopCar (partnerské místo)                                 │
│                                                                          │
│  ℹ️ Přesná adresa bude sdělena po domluvě s makléřem                    │
│                                                                          │
│  [📍 Navigovat]  [📞 Domluvit prohlídku]                                │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PODOBNÉ VOZY                                                            │
│  ────────────                                                            │
│                                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│  │ Octavia │ │ Golf GTI│ │ Leon FR │ │ Mazda 3 │                        │
│  │ 420k Kč │ │ 380k Kč │ │ 350k Kč │ │ 320k Kč │                        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Live Viewers & Počítadlo zobrazení

### Datový model

```prisma
model VehicleView {
  id          String   @id @default(cuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  
  sessionId   String   // Anonymní session
  userId      String?  // Pokud přihlášený
  
  ip          String?
  userAgent   String?
  referrer    String?
  
  createdAt   DateTime @default(now())
}

// Rozšíření Vehicle modelu
model Vehicle {
  // ... existující pole
  
  viewCount       Int      @default(0)  // Celkový počet zobrazení
  viewsToday      Int      @default(0)  // Dnešní zobrazení
  
  views           VehicleView[]
  reviews         VehicleReview[]
}
```

### Real-time viewers (Pusher/Socket.io)

```javascript
// Frontend - při načtení detailu vozu
useEffect(() => {
  // 1. Přihlásit se k channelu vozu
  const channel = pusher.subscribe(`vehicle-${vehicleId}`);
  
  // 2. Poslouchat změny počtu prohlížejících
  channel.bind('viewer-count', (data: { count: number }) => {
    setLiveViewers(data.count);
  });
  
  // 3. Oznámit že jsme začali prohlížet
  fetch(`/api/vehicles/${vehicleId}/view`, { method: 'POST' });
  
  // 4. Při odchodu oznámit odchod
  return () => {
    fetch(`/api/vehicles/${vehicleId}/leave`, { method: 'POST' });
    channel.unsubscribe();
  };
}, [vehicleId]);
```

```javascript
// Backend - tracking viewers
const activeViewers = new Map<string, Set<string>>(); // vehicleId -> Set of sessionIds

async function trackView(vehicleId: string, sessionId: string) {
  // Přidat do aktivních
  if (!activeViewers.has(vehicleId)) {
    activeViewers.set(vehicleId, new Set());
  }
  activeViewers.get(vehicleId)!.add(sessionId);
  
  // Broadcast nový počet
  await pusher.trigger(`vehicle-${vehicleId}`, 'viewer-count', {
    count: activeViewers.get(vehicleId)!.size
  });
  
  // Uložit zobrazení do DB (deduplikace per session/den)
  await prisma.vehicleView.upsert({
    where: {
      vehicleId_sessionId_date: {
        vehicleId,
        sessionId,
        date: startOfDay(new Date())
      }
    },
    create: { vehicleId, sessionId },
    update: {}
  });
  
  // Inkrementovat počítadlo
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { viewCount: { increment: 1 } }
  });
}
```

### UI komponenta

```jsx
function LiveViewers({ vehicleId }: { vehicleId: string }) {
  const [count, setCount] = useState(0);
  
  // ... Pusher subscription
  
  if (count <= 1) return null;
  
  return (
    <div className="flex items-center gap-2 text-red-600 animate-pulse">
      <span className="w-2 h-2 bg-red-600 rounded-full" />
      <span>{count} lidí si právě prohlíží tento vůz</span>
    </div>
  );
}
```

---

## Recenze k vozům

### Datový model

```prisma
model VehicleReview {
  id            String       @id @default(cuid())
  
  vehicleId     String
  vehicle       Vehicle      @relation(fields: [vehicleId], references: [id])
  
  // Autor
  authorName    String
  authorEmail   String       // Pro ověření
  
  // Hodnocení
  rating        Int          // 1-5
  title         String?
  content       String       @db.Text
  
  // Typ interakce
  interactionType VehicleInteractionType
  
  // Odpověď makléře
  brokerReply   String?
  brokerReplyAt DateTime?
  
  // Status
  status        ReviewStatus @default(PENDING)
  
  createdAt     DateTime     @default(now())
}

enum VehicleInteractionType {
  VIEWED          // Prohlédl si vůz osobně
  TEST_DRIVE      // Testovací jízda
  INQUIRY         // Dotaz
  PURCHASED       // Koupil
  OTHER           // Jiné
}
```

### Kdy zobrazit možnost recenze

```javascript
// Podmínky pro napsání recenze na vůz:
// 1. Vůz je ACTIVE nebo RESERVED
// 2. Uživatel ještě nenapsal recenzi na tento vůz
// 3. Uživatel vyplní email pro ověření

const canWriteReview = 
  vehicle.status in ['ACTIVE', 'RESERVED'] &&
  !hasExistingReview(vehicleId, sessionId);
```

---

## Formulář "Prodat auto" (FÁZE 4)

### Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  CHCETE PRODAT SVÉ AUTO?                                        │
│  Náš makléř se o vše postará                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ZÁKLADNÍ ÚDAJE O VOZU                                        │
│                                                                  │
│  Značka*     [v Škoda     ▾]    Model*    [v Octavia   ▾]       │
│  Rok*        [v 2020      ▾]    Najeto*   [85000______] km      │
│                                                                  │
│  VIN (volitelné)  [_________________________]                    │
│  ℹ️ VIN pomůže s přesnějším oceněním                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  2. FOTOGRAFIE                                                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │          📷 Přetáhněte fotky sem                           │ │
│  │             nebo klikněte pro výběr                        │ │
│  │                                                            │ │
│  │          Min. 5 fotek, max. 20                             │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  3. VAŠE KONTAKTNÍ ÚDAJE                                        │
│                                                                  │
│  Jméno*         [_________________________]                     │
│  Telefon*       [_________________________]                     │
│  Email*         [_________________________]                     │
│  Město*         [v Praha       ▾]                               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  4. VAŠE PŘEDSTAVA O CENĚ                                        │
│                                                                  │
│  Požadovaná cena  [______________] Kč  (volitelné)              │
│                                                                  │
│  Poznámka                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Cokoliv dalšího co bychom měli vědět...                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ☐ Souhlasím se zpracováním osobních údajů                      │
│  ☐ Souhlasím s obchodními podmínkami                            │
│                                                                  │
│  [         ODESLAT POPTÁVKU         ]                           │
│                                                                  │
│  ℹ️ Makléř z vašeho regionu vás bude kontaktovat do 24 hodin   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Workflow po odeslání

```
1. Zákazník odešle formulář
   ↓
2. Vytvoří se "Lead" v systému
   - Status: NEW
   ↓
3. Notifikace:
   - Makléřům v regionu (v PWA)
   - BackOffice (email)
   ↓
4. Přiřazení makléře:
   - Automaticky (rotace/první)
   - Nebo manuálně BackOffice
   ↓
5. Makléř kontaktuje zákazníka
   - Status: CONTACTED
   ↓
6. Prohlídka vozu, focení
   - Status: IN_PROGRESS
   ↓
7. Vytvoření inzerátu
   - Propojení s leadem
   ↓
8. Schválení, publikace
```

---

## SEO Optimalizace

### Meta tags pro detail vozu

```javascript
export async function generateMetadata({ params }): Promise<Metadata> {
  const vehicle = await getVehicle(params.slug);
  
  return {
    title: `${vehicle.brand} ${vehicle.model} ${vehicle.year} - ${formatPrice(vehicle.price)} | Carmakler`,
    description: `Prodej ${vehicle.brand} ${vehicle.model} ${vehicle.variant || ''}, rok ${vehicle.year}, ${formatMileage(vehicle.mileage)}, ${vehicle.fuelType}. ${vehicle.city}. Osobní makléř zajistí bezpečný nákup.`,
    openGraph: {
      images: [vehicle.images[0]?.url],
      type: 'product',
    },
  };
}
```

### Strukturovaná data (JSON-LD)

```javascript
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Car",
  "name": `${vehicle.brand} ${vehicle.model} ${vehicle.variant}`,
  "brand": { "@type": "Brand", "name": vehicle.brand },
  "model": vehicle.model,
  "vehicleModelDate": vehicle.year,
  "mileageFromOdometer": {
    "@type": "QuantitativeValue",
    "value": vehicle.mileage,
    "unitCode": "KMT"
  },
  "fuelType": vehicle.fuelType,
  "vehicleTransmission": vehicle.transmission,
  "image": vehicle.images.map(i => i.url),
  "offers": {
    "@type": "Offer",
    "price": vehicle.price,
    "priceCurrency": "CZK",
    "availability": "https://schema.org/InStock"
  }
};
```

---

## API Endpoints (Web specifické)

```
GET    /api/public/vehicles              # Veřejný seznam vozů
GET    /api/public/vehicles/:slug        # Detail vozu
POST   /api/public/vehicles/:id/view     # Zaznamenat zobrazení
POST   /api/public/vehicles/:id/leave    # Odejít (live viewers)
POST   /api/public/vehicles/:id/inquiry  # Poslat dotaz
POST   /api/public/vehicles/:id/review   # Přidat recenzi

GET    /api/public/brokers               # Seznam makléřů
GET    /api/public/brokers/:slug         # Profil makléře

POST   /api/public/sell-request          # Formulář "Prodat auto"

GET    /api/public/stats                 # Statistiky pro homepage
```

---

## Poznámky pro vývojáře

1. **Performance** - statické generování pro SEO, ISR pro aktualizace.

2. **Live viewers** - použít Redis pro sdílení stavu mezi instancemi.

3. **Počítadlo zobrazení** - deduplikovat per session/den, nepočítat boty.

4. **Recenze k vozům** - moderovat jako recenze makléřů, propojit s makléřem vozu.

5. **Mobile first** - katalog a detail musí být perfektní na mobilu.
