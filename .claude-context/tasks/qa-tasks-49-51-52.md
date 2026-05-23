# QA Report — Tasks #49, #51, #52

**Datum:** 2026-05-22  
**Commity:** `4297503` (Task #52), `ced4059` (Task #49), Task #51 (dealer CRM)  
**Build:** ✓ Compiled 1310/1310 static pages, exit 0

---

## Task #52 — OG images na detaily: PASS s poznámkou ⚠️

### Pokrytí

| Soubor | runtime | alt | size | contentType | getOptimizedUrl | fallback |
|---|---|---|---|---|---|---|
| `bazar/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ `partner.logo` | ✅ |
| `dily/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ `rawImage` | ✅ |
| `shop/produkt/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ `rawImage` | ✅ |
| `autoservisy/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ `servis.logo` | ✅ |
| `stk/[slug]` | ✅ | ✅ | ✅ | ✅ | **❌ CHYBÍ** | ✅ text-only |

### ⚠️ stk/[slug] — chybí getOptimizedUrl

`autoservisy/[slug]` fetche a zobrazuje `servis.logo`. `stk/[slug]` fetche ze stejného modelu (AutoServis), ale selektor neobsahuje `logo`:

```typescript
// autoservisy/[slug] — SPRÁVNĚ:
select: { name, city, averageRating, reviewCount, logo }
getOptimizedUrl(servis.logo, 1200, "auto")

// stk/[slug] — PROBLÉM:
select: { name, city, averageRating, reviewCount, stkWaitDays }
// žádný getOptimizedUrl, žádná fotka
```

STK OG renderuje text-branded layout (název + město + hodnocení + čekací doba). Funkční fallback, ale požadavek "getOptimizedUrl() z lib/cloudinary" nesplněn.

**Fix:** přidat `logo: true` do selectu a `getOptimizedUrl(servis.logo, 1200, "auto")` → shodný pattern s autoservisy.

Ostatní 4 soubory: implementace výborná. bazar/autoservisy OG zobrazuje logo jako background s dark overlay — konzistentní s blog OG vzorem. ✅

---

## Task #51 — Dealer CRM: PASS s poznámkou ⚠️

### Prisma + Migrace

| Požadavek | Status |
|---|---|
| Inquiry: viewingDate, viewingResult, note, priority, updatedAt | ✅ |
| Migrace `20260522160000_add_dealer_crm_fields` | ✅ |
| Lead model nedotčen | ✅ (migrace mění jen Inquiry) |
| VehicleInquiry nedotčen | ✅ |

### 5 API Endpoints

| Endpoint | Metoda | Zod | Auth | Status |
|---|---|---|---|---|
| `/api/dealer/inquiries` | GET | ✅ `inquiryListQuerySchema.parse()` | ✅ session | ✅ |
| `/api/dealer/inquiries/stats` | GET | — | ✅ session | ✅ |
| `/api/dealer/inquiries/[id]/status` | PUT | ✅ `inquiryStatusSchema` | ✅ session | ✅ |
| `/api/dealer/inquiries/[id]/note` | PUT | ✅ `inquiryNoteSchema` | ✅ session | ✅ |
| `/api/dealer/inquiries/[id]/reply` | POST | ✅ `inquiryReplySchema` | ✅ session | ✅ |

### ⚠️ Auth check — bez explicitní ADVERTISER role kontroly

Všechny endpointy ověřují `session.user.id` a filtrují data přes `listing: { userId: session.user.id }` (ownership). Jakýkoliv přihlášený uživatel může volat endpoint a dostane prázdná data.

Zadání říká "auth check (ADVERTISER role)". Chybí:
```typescript
// Mělo by být:
if (!["ADVERTISER", "ADMIN", "BACKOFFICE"].includes(session.user.role)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**Závažnost:** MEDIUM — data isolation funguje, ale špatný uživatelský typ může endpoint volat zbytečně. Neblokující.

### poptavky page — tabbed inbox ✅

`DealerInquiryInbox` má 4 tasby přesně dle spec:

| Tab | Statuses | Status |
|---|---|---|
| Nové | NEW, READ | ✅ |
| Rozpracované | REPLIED | ✅ |
| Prohlídky | VIEWING | ✅ |
| Uzavřené | SOLD, CLOSED, NO_INTEREST | ✅ |

Badge counts: `tabCounts` fetche počty pro všechny 4 tasby paralelně. ✅  
Paginace, search, reply modal — implementováno. ✅

### statistiky page ✅

Paralelní Prisma queries přes `Promise.all`:
- `DealerStatsCards` — activeListings, totalInquiries, repliedInquiries, soldCount, viewingCount ✅
- `DealerFunnel` — konverzní trychtýř ✅
- `TopVehiclesChart` — top vozidla dle poptávek ✅
- noindex ✅

### InzeratyNav ✅

2 nové tasby přidány (Poptávky + Statistiky). Poptávky má live badge s počtem NEW poptávek (fetch na mount). ✅

Pozn.: Zadání "3 taby s badge" — přidány 2 tasby + 1 badge. Pokud měly být 3 nové tasby, chybí 1.

### lib/validators/dealer-inquiry.ts ✅

4 schémata: `inquiryStatusSchema`, `inquiryNoteSchema`, `inquiryReplySchema`, `inquiryListQuerySchema`. Správná Zod validace. ✅

---

## Task #49 — STK mapa: PASS ✅

### Komponenty

| Soubor | "use client" | Poznámka |
|---|---|---|
| `MapView.tsx` | ✅ | react-leaflet, MarkerClusterGroup, Mapy.cz tiles |
| `MapListView.tsx` | ✅ | mobile tab switcher + desktop split |
| `StationCard.tsx` | — | Server Component, pure display, OK |

### MapView.tsx — implementace

- `react-leaflet` + `react-leaflet-cluster` ✅
- `MAPYCZ_TILES` z `lib/map-config.ts` ✅
- `MarkerClusterGroup` pro clustering markerů ✅
- `Popup` s názvem, hodnocením, odkazem na detail ✅
- "use client" ✅ (leaflet vyžaduje)

### MapListView.tsx — layout

- **Mobile:** tab switcher (`lg:hidden`) — "Seznam" | "Mapa" ✅
- **Desktop:** `grid-cols-1 lg:grid-cols-[380px_1fr]` — seznam vlevo, mapa vpravo ✅
- Dynamický import MapView (`next/dynamic`, SSR=false) ✅ — nutné pro leaflet
- Filtry: region select + search input ✅
- Výška mapy: `h-[400px] lg:h-[600px]` ✅

### lib/map-config.ts

```typescript
export const MAPYCZ_TILES = "https://mapserver.mapy.cz/turist-m/{z}-{x}-{y}";
export const CZ_CENTER: [number, number] = [49.8, 15.5];
export const CZ_ZOOM = 7;
export interface MapMarker { id, slug, lat, lng, name, city, rating, reviewCount, phone?, categories, type: "stk" | "servis" }
```
✅

### Prisma schema + migrace

Migrace `20260522140000_add_stk_official_fields`:
```sql
CREATE INDEX "AutoServis_latitude_longitude_idx" ON "AutoServis"("latitude", "longitude");
CREATE INDEX "AutoServis_region_idx" ON "AutoServis"("region");
```
AutoServis model: `latitude Float?`, `longitude Float?` ✅

### Integrace do stránek

autoservisy/page.tsx + stk/page.tsx:
```typescript
const mapMarkers: MapMarker[] = servisy
  .filter((s) => s.latitude && s.longitude)  // GPS filter ✅
  .map((s) => ({ lat: s.latitude!, lng: s.longitude!, type: "servis/stk", ... }));
// ...
{mapMarkers.length > 0 && <MapListView markers={mapMarkers} type="servis" />}
```
Podmíněné zobrazení (jen pokud existují GPS data) ✅

### Packages

```json
"leaflet": "^1.9.4",
"react-leaflet": "^5.0.0",
"react-leaflet-cluster": "^4.1.3",
"@types/leaflet": "^1.9.21"
```
✅

---

## Build

```
✓ Compiled successfully in 28.4s
✓ Generating static pages (1310/1310)
Exit: 0
```

1310 stránek (+4 oproti předchozímu buildu — nové dealer CRM a statistiky routes). ✅

---

## Souhrn

| Task | Výsledek | Poznámka |
|---|---|---|
| **#52 — OG images** | **PASS ⚠️** | stk/[slug] chybí getOptimizedUrl — snadný fix |
| **#51 — Dealer CRM** | **PASS ⚠️** | ADVERTISER role check chybí v API; 4 tasby správně |
| **#49 — STK mapa** | **PASS ✅** | Kompletní — Mapy.cz, clustering, mobile/desktop layout |
| **Build** | **PASS ✅** | 0 errors |
