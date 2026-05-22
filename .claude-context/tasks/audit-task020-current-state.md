# Audit stavu TASK-020 — Eshop autodíly

**Datum:** 2026-04-13
**Autor:** Plánovač

---

## Shrnutí

Eshop autodíly je **z velké části implementovaný**. Jádro (Prisma modely, API routes, frontend katalog, checkout, supplier PWA, admin) funguje. Chybí pokročilé funkce (visual search, OEM cross-reference, donor car, reviews) a některé integrace (carrier API).

---

## 1. Prisma Schema

### ✅ HOTOVO
| Model | Umístění | Popis |
|-------|----------|-------|
| **Part** | schema.prisma:890-960 | Kompletní model — slug, supplierId, category, name, searchVector (tsvector), partNumber, oemNumber, manufacturer, warranty, partType (USED/NEW/AFTERMARKET), condition, price, wholesalePrice, markupPercent, stock, weight, dimensions, compatibleBrands/Models/Year, universalFit, status, viewCount, feedConfigId |
| **PartImage** | schema.prisma:962-973 | url, order, isPrimary |
| **Order** | schema.prisma:1010-1064 | orderNumber, buyerId, status (PENDING→CONFIRMED→SHIPPED→DELIVERED→CANCELLED), deliveryMethod (ZASILKOVNA/DPD/PPL/GLS/CESKA_POSTA/PICKUP), paymentMethod (BANK_TRANSFER/COD/CARD), paymentStatus, trackingNumber, trackingUrl, shippingLabelUrl, guestToken |
| **OrderItem** | schema.prisma:1067-1092 | orderId, partId, supplierId, quantity, unitPrice, totalPrice, commissionRateApplied, carmaklerFee, supplierPayout, status |
| **ReturnRequest** | schema.prisma:1098-1146 | type (WITHDRAWAL/WARRANTY), items JSON, reason, defectDesc, photos, bankAccount, requestedAmount, approvedAmount, refundedAt, status (NEW→RECEIVED→IN_REVIEW→APPROVED→REFUNDED→REJECTED), deadlineAt |
| **PartsFeedConfig** | schema.prisma:1604-1633 | supplierId, feedUrl, feedFormat (XML/CSV/JSON), fieldMapping, updateFrequency (DAILY/WEEKLY/MANUAL), markupType/Value, categoryMarkups |
| **PartsFeedImportLog** | schema.prisma:1635+ | Import logy |
| **SeoContent** | schema.prisma:979-1008 | SEO landing pages pro brand/model/year/category |
| **Partner** | schema.prisma:1657+ | Partner/supplier model |

### ❌ CHYBÍ
| Model | Poznámka |
|-------|----------|
| **PartCategory** (separátní model) | Kategorie jsou enum stringy v Part.category, ne relační tabulka |
| **Cart/CartItem** (DB persistence) | Košík je 100% localStorage, žádná DB persistence |
| **SubOrder** | Neexistuje — Order má přímo OrderItem |
| **DonorCar** | Neexistuje jako samostatný model — jen compatibleBrands/Models/Year na Part |
| **Review/Rating** | Žádný model pro hodnocení dílů/dodavatelů |

---

## 2. API Routes

### ✅ HOTOVO
| Route | Soubor | Funkce |
|-------|--------|--------|
| `POST /api/parts` | app/api/parts/route.ts | Vytvoření dílu (PARTS_SUPPLIER/ADMIN) |
| `GET/PATCH/DELETE /api/parts/[id]` | app/api/parts/[id]/route.ts | CRUD jednotlivého dílu |
| `GET /api/parts/compatible` | app/api/parts/compatible/route.ts | Kompatibilní díly podle VIN nebo brand/model/year |
| `GET /api/parts/for-vehicle` | app/api/parts/for-vehicle/route.ts | Díly pro konkrétní vozidlo |
| `GET /api/parts/supplier-stats` | app/api/parts/supplier-stats/route.ts | Statistiky dodavatele |
| `POST /api/parts/import` | app/api/parts/import/route.ts | Import dílů z feedu |
| `POST /api/orders` | app/api/orders/route.ts | Vytvoření objednávky (guest i auth) |
| `GET /api/orders/[id]` | app/api/orders/[id]/route.ts | Detail objednávky |
| `PATCH /api/orders/[id]/status` | app/api/orders/[id]/status/route.ts | Změna statusu objednávky |
| `POST /api/orders/[id]/returns` | app/api/orders/[id]/returns/route.ts | Vytvoření reklamace/vrácení (14 dní) |
| `GET /api/orders/track/[token]` | app/api/orders/track/[token]/route.ts | Guest tracking objednávky |
| `GET/POST /api/feeds/import/config` | app/api/feeds/import/config/route.ts | CRUD feed konfigurací |
| `GET/PATCH/DELETE /api/feeds/import/config/[id]` | app/api/feeds/import/config/[id]/route.ts | Správa konkrétního feedu |
| `POST /api/feeds/import/run` | app/api/feeds/import/run/route.ts | Spuštění importu |
| `GET /api/feeds/import/logs` | app/api/feeds/import/logs/route.ts | Logy importů |
| `GET /api/feeds/bazos.xml` | app/api/feeds/bazos.xml/route.ts | XML feed pro Bazoš |
| `GET /api/feeds/sauto.xml` | app/api/feeds/sauto.xml/route.ts | XML feed pro Sauto |
| `GET /api/feeds/tipcars.xml` | app/api/feeds/tipcars.xml/route.ts | XML feed pro TipCars |
| `GET /api/search/smart` | app/api/search/smart/route.ts | Smart search + autocomplete (tsvector + pg_trgm) |

### ❌ CHYBÍ
| Route | Poznámka |
|-------|----------|
| `/api/cart/*` | Žádné cart API — košík je localStorage |
| `/api/parts/visual-search` | Žádné vizuální vyhledávání |
| `/api/parts/oem-lookup` | Žádné OEM křížové reference API |
| `/api/returns/*` | Returny jen přes /api/orders/[id]/returns, žádná admin správa |

---

## 3. Frontend stránky — app/(web)/dily/

### ✅ HOTOVO
| Stránka | Soubor | Popis |
|---------|--------|-------|
| Landing page dílů | app/(web)/dily/page.tsx | Hero, benefity, featured parts, kategorie s počty |
| Katalog | app/(web)/dily/katalog/page.tsx | Filtry (kategorie, značka, cena, stav), ProductCard grid |
| Značka landing | app/(web)/dily/znacka/[brand]/page.tsx | SEO stránky pro značky (Škoda, VW…), static generation |
| Model landing | app/(web)/dily/znacka/[brand]/[model]/page.tsx | Díly pro konkrétní model |
| Rok landing | app/(web)/dily/znacka/[brand]/[model]/[rok]/page.tsx | Díly pro ročník |
| Kategorie landing | app/(web)/dily/kategorie/[slug]/page.tsx | Díly dle kategorie |
| Detail dílu | app/(web)/dily/[slug]/page.tsx | Detail produktu |
| Vrakoviště profil | app/(web)/dily/vrakoviste/[slug]/page.tsx | Stránka vrakoviště |
| **Košík** | app/(web)/dily/kosik/page.tsx | localStorage košík, editace množství, celková cena |
| **Checkout wizard** | app/(web)/dily/objednavka/page.tsx | 3 kroky: 1) Doručení, 2) Platba, 3) Potvrzení |
| **Potvrzení objednávky** | app/(web)/dily/objednavka/potvrzeni/page.tsx | Shrnutí objednávky + číslo |
| **Moje objednávky** | app/(web)/dily/moje-objednavky/page.tsx | Seznam objednávek (auth user) + OrderTracker |

### ✅ Loading/Error states pro všechny dynamic routes

---

## 4. Admin stránky

### ✅ HOTOVO
| Stránka | Soubor | Popis |
|---------|--------|-------|
| Feed management | app/(admin)/admin/feeds/page.tsx | Seznam feed konfigurací, statistiky importu |
| Nový feed | app/(admin)/admin/feeds/new/page.tsx | Formulář pro nový feed |
| Edit feed | app/(admin)/admin/feeds/[id]/page.tsx | Editace feedu |
| Objednávky | app/(admin)/admin/orders/page.tsx | Tabulka objednávek, filtrování dle statusu |

### ❌ CHYBÍ
| Stránka | Poznámka |
|---------|----------|
| Admin správa dílů | Díly se spravují jen přes supplier PWA, ne admin |
| Admin správa reklamací | ReturnRequest model existuje, ale žádná admin UI |
| Admin dodavatelé | Žádný přehled dodavatelů/vrakovišť |

---

## 5. PWA Parts Supplier — app/(pwa-parts)/

### ✅ HOTOVO
| Stránka | Soubor | Popis |
|---------|--------|-------|
| Dashboard | app/(pwa-parts)/parts/page.tsx | Přivítání, stats, pending orders |
| Přidání dílu | app/(pwa-parts)/parts/new/page.tsx | 3-step wizard (fotky → detaily → cena) |
| Detail dílu | app/(pwa-parts)/parts/[id]/page.tsx | Zobrazení dílu |
| Editace dílu | app/(pwa-parts)/parts/[id]/edit/page.tsx | Editace |
| Moje díly | app/(pwa-parts)/parts/my/page.tsx | Seznam dílů s filtry |
| CSV import | app/(pwa-parts)/parts/import/page.tsx | Import z CSV/feedu |
| Objednávky | app/(pwa-parts)/parts/orders/page.tsx | Seznam objednávek dodavatele |
| Detail objednávky | app/(pwa-parts)/parts/orders/[id]/page.tsx | Detail + shipping label |
| Onboarding | app/(pwa-parts)/parts/onboarding/page.tsx | 3 kroky: profil → dokumenty → schválení |
| Profil | app/(pwa-parts)/parts/profile/page.tsx | Nastavení + Stripe karta |

### ⚠️ ČÁSTEČNĚ
| Funkce | Stav |
|--------|------|
| Inventory management | Základní CRUD existuje, chybí stock alerts, reorder points, warehouse tracking |

---

## 6. Partner stránky — app/(partner)/partner/

### ✅ HOTOVO
| Stránka | Popis |
|---------|-------|
| /partner/parts/ | Partner inventory listing |
| /partner/parts/new/ | Přidání dílu (wholesale/vrakoviště) |
| /partner/parts/[id]/ | Detail dílu |
| /partner/orders/ | Objednávky partnera |
| /partner/ dashboard, billing, leads, vehicles, profile | Kompletní partner workflow |

---

## 7. Komponenty

### ✅ HOTOVO — Web
| Komponenta | Soubor | Funkce |
|------------|--------|--------|
| PartsSearch | components/web/PartsSearch.tsx | Vyhledávací formulář (brand/model/year) |
| SmartSearchBar | components/web/SmartSearchBar.tsx | Autocomplete search (/api/search/smart) |
| ProductCard | components/web/ProductCard.tsx | Karta dílu (badge, cena, stav, "Do košíku") |
| Cart | components/web/Cart.tsx | Cart modal/sidebar |
| CartIcon | components/web/CartIcon.tsx | Badge s počtem položek |
| OrderForm | components/web/OrderForm.tsx | Doručovací formulář + Zásilkovna widget |
| OrderTracker | components/web/OrderTracker.tsx | Visual status tracker |
| RecommendedParts | components/web/RecommendedParts.tsx | Doporučené díly |
| PartsBreadcrumbs | components/web/dily/PartsBreadcrumbs.tsx | Breadcrumbs |

### ✅ HOTOVO — PWA Parts
| Komponenta | Soubor |
|------------|--------|
| AddPartWizard | components/pwa-parts/parts/AddPartWizard.tsx |
| PhotoStep | components/pwa-parts/parts/PhotoStep.tsx |
| DetailsStep | components/pwa-parts/parts/DetailsStep.tsx |
| PricingStep | components/pwa-parts/parts/PricingStep.tsx |
| PartFilters | components/pwa-parts/parts/PartFilters.tsx |
| PartCard | components/pwa-parts/parts/PartCard.tsx |
| DeletePartDialog | components/pwa-parts/parts/DeletePartDialog.tsx |
| CompatibilitySelector | components/pwa-parts/parts/CompatibilitySelector.tsx |
| SupplierStats | components/pwa-parts/dashboard/SupplierStats.tsx |
| PendingOrders | components/pwa-parts/dashboard/PendingOrders.tsx |
| OrderCard, OrderActions | components/pwa-parts/orders/ |
| ShippingLabelCard | components/pwa-parts/orders/ShippingLabelCard.tsx |
| CsvImport | components/pwa-parts/CsvImport.tsx |
| SupplierStripeCard | components/pwa-parts/profile/SupplierStripeCard.tsx |
| SupplierTopBar, BottomNav | components/pwa-parts/ |

---

## 8. Lib & Utilities

### ✅ HOTOVO
| Soubor | Funkce |
|--------|--------|
| lib/cart.ts | getCart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount, onCartChange (event-based) |
| lib/search.ts | smartSearch() + getSearchSuggestions() — PostgreSQL tsvector + ts_rank + pg_trgm |
| lib/parts-categories.ts | Category enums (ENGINE, TRANSMISSION, BRAKES…), condition labels |
| lib/shipping/base.ts | Base shipping types |
| lib/shipping/types.ts | DeliveryMethod types |
| lib/shipping/prices.ts | Výpočet cen dopravy |
| lib/shipping/dispatcher.ts | Carrier dispatcher |
| lib/shipping/carriers/ | 6+ carrier subdirectories |
| lib/seo/ | 8 subdirectories pro SEO landing pages |
| lib/seo-data.ts | PARTS_BRANDS, PARTS_MODELS_BY_BRAND |
| lib/validators/parts.ts | createPartSchema, updatePartSchema, partFilterSchema, createOrderSchema |
| lib/validators/return.ts | createReturnSchema |
| lib/feed-import.ts | 16KB — parser pro SAUTO_XML, TIPCARS_XML, CSV formáty, field mapping, markup kalkulace |
| lib/canonical.ts | Canonical URL generace |

---

## 9. Search & Vyhledávání

### ✅ HOTOVO
| Funkce | Implementace |
|--------|-------------|
| Fulltext search | PostgreSQL tsvector na Part.searchVector + ts_rank |
| Autocomplete | pg_trgm similarity, 200ms debounce, od 2 znaků |
| Smart search API | /api/search/smart?q=...&suggestions=true — parts + listings |
| Čeština/diakritika | Podpora áčďéěíňóřšťúůýž |

### ⚠️ ČÁSTEČNĚ
| Funkce | Stav |
|--------|------|
| VIN-based parts lookup | /api/parts/compatible?vin=... existuje ale jen fallback na brand/model/year, ne plný VIN decode |

### ❌ CHYBÍ
| Funkce | Poznámka |
|--------|----------|
| Visual/image search | Žádné rozpoznávání dílů z fotek |
| OEM cross-reference | oemNumber pole existuje na Part, ale žádná lookup DB ani API |
| VIN decoder integrace | /api/vin/decode existuje pro vozidla, ale parts compatible ho nepoužívá |

---

## 10. Celkové shrnutí

### ✅ HOTOVO (plně funkční)
1. **Core CRUD dílů** — Prisma modely + API + frontend
2. **Katalog & browsing** — Landing, kategorie, značky, modely, roky, SEO
3. **Košík** — localStorage-based, plně funkční (add/remove/quantity)
4. **Checkout** — 3-step wizard (doručení → platba → potvrzení)
5. **Guest checkout** — Objednávka bez přihlášení + guest tracking token
6. **Objednávky** — Vytvoření, tracking statusu, přehled "Moje objednávky"
7. **Vrácení/Reklamace** — ReturnRequest model + API (14 dní odstoupení, záruční reklamace)
8. **Feed import** — PartsFeedConfig + parser (XML/CSV/JSON) + admin UI
9. **Smart search** — PostgreSQL tsvector + pg_trgm autocomplete
10. **Supplier PWA** — Dashboard, přidání dílů (wizard), editace, import, objednávky
11. **Partner workflow** — Wholesale/vrakoviště díly, objednávky, billing
12. **Admin feeds** — CRUD feed konfigurací + import logy
13. **Admin objednávky** — Přehled a filtrování
14. **Shipping** — Typy, ceny, Zásilkovna widget
15. **SEO** — Landing pages pro brand/model/year/category

### ⚠️ ČÁSTEČNĚ (existuje základ, chybí dokončení)
1. **Shipping integrace** — Typy a ceny definovány, Zásilkovna widget funguje, ale carrier API (DPD/PPL/GLS) nejsou napojeny
2. **VIN-based parts** — /api/parts/compatible existuje ale jen brand/model/year fallback
3. **Inventory management** — Základní CRUD, chybí stock alerts, reorder points
4. **Return workflow** — Model + API existuje, chybí admin UI pro správu reklamací

### ❌ CHYBÍ (neimplementováno)
1. **Visual/image search** — Rozpoznávání dílů z fotek
2. **OEM cross-reference** — Křížové reference oemNumber (lookup databáze)
3. **DonorCar model** — Sledování zdrojového vozidla pro díly
4. **Cart persistence (DB)** — Košík jen v localStorage, ne v databázi
5. **Reviews/Ratings** — Žádné hodnocení dílů ani dodavatelů
6. **Admin správa reklamací** — UI pro schvalování/zamítání returnů
7. **Admin správa dodavatelů** — Přehled dodavatelů/vrakovišť
8. **Admin správa dílů** — Hromadná správa dílů z admin panelu
9. **Cron automatický feed sync** — PartsFeedConfig podporuje updateFrequency ale žádný cron job
10. **Wholesale/B2B tiers** — Žádné subscription pricing pro velkoobchod
11. **"Zákazníci také koupili"** — Žádné doporučovací algoritmy
12. **Carrier API integrace** — DPD/PPL/GLS API calls pro real-time tracking, štítky

---

## Doporučení pro další vývoj (priorita)

1. **🔴 Vysoká:** Admin UI pro reklamace — model existuje, chybí jen frontend
2. **🔴 Vysoká:** Cron job pro automatický feed sync — infrastruktura hotová
3. **🟡 Střední:** Carrier API integrace (začít s Zásilkovnou, pak DPD)
4. **🟡 Střední:** Admin přehled dodavatelů
5. **🟢 Nízká:** Visual search, OEM cross-reference, DonorCar
6. **🟢 Nízká:** Cart DB persistence, Reviews
