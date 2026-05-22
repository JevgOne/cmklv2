# QA Audit: Prisma Schema + DB Modely

**Datum:** 2026-05-03
**Autor:** Plánovač (Task #8)
**Soubor:** `prisma/schema.prisma` (2543 řádků)

---

## 1. Přehled modelů (81 celkem)

### 1.1 Makléřská síť (core) — 16 modelů
| Model | Řádky | Účel |
|-------|-------|------|
| `User` | ~180 | Centrální uživatel (50+ relací, 13 rolí) |
| `Region` | 12 | Regionální struktura (PRAHA, BRNO, OSTRAVA_PLZEN, SMALL) |
| `Invitation` | 16 | Pozvánky manažerů pro makléře |
| `Vehicle` | 148 | Vozidla makléřů (VIN, 7-step intake, inspekce) |
| `VehicleImage` | 11 | Fotky vozidel |
| `VehicleChangeLog` | 15 | Audit log změn na vozidlech |
| `VehicleInquiry` | 35 | Poptávky od kupujících |
| `DamageReport` | 18 | Hlášení poškození |
| `Commission` | 30 | Provize makléřů (50/50 split) |
| `Contract` | 55 | Smlouvy (zprostředkovatelské, předávací) |
| `AiConversation` | 12 | AI asistent konverzace |
| `Lead` | 50 | Leady z externích zdrojů |
| `PriceReduction` | 15 | Návrhy snížení ceny |
| `Escalation` | 30 | Eskalace problémů |
| `SellerPayout` | 18 | Výplaty prodejcům |
| `BrokerPayout` | 22 | Výplaty provizí makléřům |

### 1.2 Inzertní platforma — 11 modelů
| Model | Řádky | Účel |
|-------|-------|------|
| `Listing` | 112 | Inzeráty vozidel (separátní od Vehicle) |
| `ListingImage` | 11 | Fotky inzerátů |
| `Inquiry` | 26 | Dotazy na inzeráty |
| `Watchdog` | 22 | Hlídací psi (notifikace na nové inzeráty) |
| `Favorite` | 13 | Oblíbené (listing + part polymorfní) |
| `Reservation` | 18 | Rezervace inzerátů (kauce 5000 Kč) |
| `CebiaReport` | 17 | CEBIA ověření VIN |
| `ListingFeedConfig` | 20 | Feed import konfigurace (UNUSED) |
| `ListingImportLog` | 15 | Feed import logy (UNUSED) |
| `FeedImportConfig` | 25 | Aktivní feed import konfigruace |
| `FeedImportLog` | 18 | Aktivní feed import logy |

### 1.3 Eshop autodíly — 16 modelů
| Model | Řádky | Účel |
|-------|-------|------|
| `Part` | 92 | Díly (TecDoc, donor car, feed import) |
| `PartImage` | 11 | Fotky dílů |
| `PartReservation` | 13 | Rezervace dílů v košíku (30 min) |
| `SeoContent` | 30 | SEO landing pages pro /dily/znacka/* |
| `Order` | 55 | Objednávky (multi-supplier) |
| `SubOrder` | 42 | Sub-objednávky per dodavatel |
| `OrderItem` | 25 | Položky objednávky |
| `ReturnRequest` | 50 | Vrácení a reklamace (RMA) |
| `PartsFeedConfig` | 28 | Feed konfigurace (velkoobchod) |
| `PartsFeedImportLog` | 18 | Feed import logy |
| `DonorVehicle` | 40 | Celé bouráky (donor cars) |
| `PartCrossReference` | 12 | OEM křížové reference |
| `PartRequest` | 23 | Burza dílů (poptávky) |
| `PartRequestOffer` | 15 | Nabídky na poptávky |
| `CustomerGarage` | 13 | Garáž zákazníka |
| `StockNotification` | 11 | "Opět skladem" notifikace |

### 1.4 Marketplace (investiční platforma) — 5 modelů
| Model | Řádky | Účel |
|-------|-------|------|
| `FlipOpportunity` | 62 | Investiční příležitosti |
| `Investment` | 20 | Investice do dealů |
| `MarketplaceApplication` | 40 | Žádosti o přístup |
| `DealNegotiation` | 33 | Vyjednávání podmínek |
| `DealComment` | 17 | Komentáře k dealům (UNUSED) |

### 1.5 Partnerský modul — 4 modely
| Model | Řádky | Účel |
|-------|-------|------|
| `Partner` | 75 | Partnerská firma (autobazar/vrakoviště) |
| `PartnerCommissionLog` | 12 | Log změn provizí |
| `PartnerActivity` | 18 | CRM aktivity |
| `PartnerLead` | 18 | Leady od partnerů |

### 1.6 Platby + finance — 2 modely
| Model | Řádky | Účel |
|-------|-------|------|
| `Payment` | 35 | Platby za vozidla (Stripe, převod) |
| `SellerPayout` | (viz core) | Výplaty prodejcům |

### 1.7 Komunikace + notifikace — 6 modelů
| Model | Řádky | Účel |
|-------|-------|------|
| `Notification` | 16 | Push/in-app notifikace |
| `NotificationPreference` | 10 | Nastavení notifikací uživatele |
| `SellerNotificationPreference` | 8 | Nastavení notifikací prodejce |
| `EmailLog` | 22 | Log odeslaných emailů |
| `SmsLog` | 10 | Log odeslaných SMS |
| `NewsletterSubscriber` | 14 | Newsletter odběratelé |

### 1.8 CRM — 2 modely
| Model | Řádky | Účel |
|-------|-------|------|
| `SellerContact` | 35 | Kontakty na prodejce |
| `SellerCommunication` | 15 | Log komunikace s prodejci |

### 1.9 Gamifikace + reputace — 6 modelů
| Model | Řádky | Účel |
|-------|-------|------|
| `UserAchievement` | 10 | Odemčené achievementy |
| `BrokerPointTransaction` | 18 | Bodové transakce (obrat) |
| `TrustScore` | 30 | Unified Trust Score (0-100) |
| `SkillTag` | 18 | Skill tagy od uživatelů |
| `AutoBadge` | 12 | Automatické odznaky |
| `ProfileBadge` | 8 | Profilové odznaky |

### 1.10 Profil + sociální — 3 modely
| Model | Řádky | Účel |
|-------|-------|------|
| `ProfileLike` | 22 | Polymorfní lajky (vehicle/listing/part) |
| `ProfileComment` | 28 | Polymorfní komentáře + guest komentáře |
| `ArticleReaction` | 14 | Reakce na články (LIKE, HEART, CLAP...) |

### 1.11 Blog / Magazín — 4 modely
| Model | Řádky | Účel |
|-------|-------|------|
| `Article` | 30 | Články/blog posty |
| `ArticleCategory` | 10 | Kategorie článků |
| `ArticleTag` | 8 | Tagy článků |
| `ArticleTagLink` | 6 | M2M pivot tabulka |

### 1.12 Auth + systém — 4 modely
| Model | Řádky | Účel |
|-------|-------|------|
| `PasswordResetToken` | 10 | Reset hesla tokeny |
| `EmailVerificationToken` | 10 | Verifikace emailu |
| `Review` | 14 | Recenze (statické, admin-managed) |
| `TeamMember` | 10 | Členové týmu (about page) |

### 1.13 SEO + tagy — 2 modely
| Model | Řádky | Účel |
|-------|-------|------|
| `Tag` | 14 | Hashtagy / SEO landing tagy |
| `SearchQuery` | 10 | Historie vyhledávání |

---

## 2. Nepoužívané modely (3)

Potvrzeno grep analýzou (0 referencí v `.ts/.tsx` souborech mimo schema):

### 2.1 `DealComment` (řádek 2526)
- **Účel:** Komentáře k marketplace dealům (FlipOpportunity)
- **Stav:** Definován v schématu, relace na User a FlipOpportunity existují, ale žádný kód ho nepoužívá
- **Riziko:** NÍZKÉ — komentáře k dealům zatím neimplementované
- **Doporučení:** Ponechat (feature planned), nebo smazat + znovu přidat při implementaci

### 2.2 `ListingFeedConfig` (řádek 912)
- **Účel:** Feed import konfigurace pro inzeráty (Sauto XML, TipCars XML)
- **Stav:** User relace (`feedConfigs`) existuje, ale 0 API routes nebo stránek ho používá
- **Konflikt:** Existuje aktivně používaný `FeedImportConfig` (řádek 1756) — pravděpodobný duplikát
- **Riziko:** STŘEDNÍ — zbytečný model, matoucí duplicita s `FeedImportConfig`
- **Doporučení:** Smazat v příští migraci, unifikovat na `FeedImportConfig`

### 2.3 `ListingImportLog` (řádek 934)
- **Účel:** Logy z importu inzerátů
- **Stav:** Jen relace na `ListingFeedConfig`, žádné přímé použití
- **Konflikt:** `FeedImportLog` (řádek 1781) je aktivně používaný
- **Riziko:** NÍZKÉ — smaže se společně s `ListingFeedConfig`
- **Doporučení:** Smazat v příští migraci

---

## 3. Relace — konzistence

### 3.1 Stav: KONZISTENTNÍ
Všechny relace mají oboustranné deklarace:
- Každý `@relation` field má odpovídající array field na druhé straně
- Cascade deletes (`onDelete: Cascade`) aplikovány na child entity (images, logs, pivot tables)
- SetNull (`onDelete: SetNull`) aplikováno na optional FK (např. `MarketplaceApplication.reviewedById`)

### 3.2 User model — centrální hub
- **50+ relací** na User modelu — to je architektonicky správné (jeden User = jedna identita napříč 4 produkty)
- Relace jsou explicitně pojmenované (`@relation("BrokerCommissions")`) — žádné ambiguity
- Žádné chybějící FK

### 3.3 Polymorfní vzory
| Model | Targets | Mechanismus |
|-------|---------|-------------|
| `ProfileLike` | Vehicle, Listing, Part | Nullable FK (právě 1 non-null) |
| `ProfileComment` | Vehicle, Listing, Part, Article | Nullable FK (právě 1 non-null) |
| `Favorite` | Listing, Part | Nullable FK (právě 1 non-null) |

**Poznámka:** Polymorfní relace přes nullable FK nemají DB-level constraint (CHECK constraint), jen aplikační logiku. V PostgreSQL by šlo přidat `CHECK` constraint přes raw SQL migraci.

### 3.4 Self-referenční relace
- `User.manager ↔ User.teamMembers` — hierarchie makléřů
- `DealComment.parent ↔ DealComment.replies` — vnořené komentáře

---

## 4. Indexy — pokrytí

### 4.1 Celkový počet indexů: ~130

### 4.2 Dobře indexované modely
| Model | Indexy | Hodnocení |
|-------|--------|-----------|
| `Vehicle` | 6 (`brand+model`, `status`, `brokerId`, `price`, `year`, `sellerType`) | Výborné |
| `Listing` | 11 (`userId`, `status`, `brand+model`, `price`, `year`, `city`, `listingType`, `isPremium`, `flagged`, `moderationStatus`, `listingTier`) | Výborné |
| `Part` | 12 (vč. `oemNumber`, `partNumber`, `manufacturer`, `tecdocArticleId`) | Výborné |
| `Order` | 3 + `guestToken` unique | OK |
| `Lead` | 5 (vč. composite `phone+brand+model`) | Výborné |
| `Partner` | 8 (vč. `stripeAccountId`, `stripePayoutsEnabled`) | Výborné |
| `FlipOpportunity` | 2 (`dealerId`, `status`) | OK |
| `DealNegotiation` | 4 | Výborné |

### 4.3 Chybějící/doporučené indexy
| Model | Doporučení | Priorita |
|-------|-----------|----------|
| `Vehicle` | `@@index([city])` — filtry podle města | MEDIUM |
| `Vehicle` | `@@index([fuelType])` — častý filtr | LOW |
| `Listing` | `@@index([createdAt])` — řazení "nejnovější" | MEDIUM |
| `FlipOpportunity` | `@@index([createdAt])` — timeline dealů | LOW |
| `Order` | `@@index([createdAt])` — admin řazení | LOW |
| `Reservation` | nic chybí — `expiresAt` index existuje | OK |

### 4.4 Fulltext search indexy
- `Vehicle.searchVector` — `Unsupported("tsvector")?` — index vytvořen raw SQL migrací
- `Listing.searchVector` — dtto
- `Part.searchVector` — dtto
- **Poznámka:** tsvector sloupce nejsou nativně managovány Prismou, vyžadují raw SQL triggers

---

## 5. Enum typy — string-based

### 5.1 Přístup: ŽÁDNÉ Prisma enum typy
Projekt používá **string-based enums** s komentáři v schématu. To je záměrné rozhodnutí:

**Výhody:**
- Jednodušší migrace (žádné ALTER TYPE)
- Flexibilita přidávat/odebírat hodnoty bez migrace
- Kompatibilní s JSON fields

**Nevýhody:**
- Žádná DB-level validace hodnot
- Typecheck pouze přes Zod validaci na API úrovni

### 5.2 Kompletní seznam string-enum polí

| Pole | Hodnoty | Konzistentní? |
|------|---------|----------------|
| `User.role` | 13 hodnot (ADMIN → PARTNER_VRAKOVISTE) | OK |
| `User.status` | PENDING, ONBOARDING, ACTIVE, SUSPENDED, INACTIVE | OK |
| `User.level` | STAR_1 → STAR_5 | OK |
| `Vehicle.status` | 9 hodnot (DRAFT → ARCHIVED) | OK |
| `Vehicle.fuelType` | 7 hodnot | OK |
| `Vehicle.transmission` | 4 hodnoty | OK |
| `Vehicle.bodyType` | 8 hodnot | OK |
| `Vehicle.condition` | 6 hodnot | OK — shodné s Listing |
| `Listing.status` | 5 hodnot (odlišné od Vehicle!) | OK — záměrně |
| `Part.category` | 12 hodnot | OK |
| `Part.partType` | USED, NEW, AFTERMARKET | OK |
| `Part.condition` | 5 hodnot (odlišné od Vehicle!) | OK — záměrně |
| `Order.status` | 5 hodnot | OK |
| `Order.deliveryMethod` | 6 dopravců | OK |
| `Order.paymentMethod` | 3 hodnoty | OK |
| `Partner.status` | 7 hodnot (CRM pipeline) | OK |
| `FlipOpportunity.status` | 10 hodnot (investiční pipeline) | OK |
| `Contract.status` | 6 hodnot | OK |
| `ReturnRequest.status` | 9 hodnot | OK |
| `TrustScore.tier` | NEW → PLATINUM (5 úrovní) | OK |

**Závěr:** Všechny string-enum hodnoty jsou konzistentní v rámci svého kontextu. Odlišné status enums pro Vehicle vs Listing jsou záměrné (jiný lifecycle).

---

## 6. JSON fields — přehled

| Model | Pole | Typ dat |
|-------|------|---------|
| `User` | `specializations`, `cities`, `favoriteBrands` | JSON string arrays |
| `User` | `documents`, `socialLinks`, `services`, `languageSkills`, `openingHours` | JSON objects |
| `Vehicle` | `equipment`, `highlights`, `inspectionData`, `workflowChecklist` | JSON mixed |
| `DamageReport` | `images` | JSON string array |
| `FlipOpportunity` | `photos`, `repairPhotos`, `repairMilestones` | JSON arrays |
| `DonorVehicle` | `damageZones`, `photos` | JSON mixed |
| `AiConversation` | `messages`, `context` | JSON structured |
| `Part` | `compatibleBrands`, `compatibleModels` | JSON string arrays |
| `SeoContent` | `sectionsJson`, `faqJson`, `quickFacts` | JSON structured |
| `TrustScore` | `metricsJson` | JSON object |
| `Partner` | `openingHours` | JSON object |

**Poznámka:** Většina JSON polí jsou string arrays uložené jako `String?`. To je OK pro read-heavy data, ale neumožňuje DB-level querying. Pro výkonové dotazy (filtry přes JSON) by bylo lepší `Json` type nebo dedikované relace. V současném použití to ale není problém.

---

## 7. Chybějící modely — analýza

### 7.1 Funkce bez DB modelu
Na základě rozboru API routes a stránek neexistují funkce, které by potřebovaly vlastní model a nemají ho. Vše je pokryto.

### 7.2 Potenciální budoucí modely
| Funkce | Stav | Model potřeba? |
|--------|------|-----------------|
| Chat/messaging (makléři) | Plánováno (TASK-QUEUE) | ANO — `Message`, `Conversation` |
| Stripe webhooks log | Jen runtime | NE — logování přes existující systém |
| Admin audit log | Částečně (`VehicleChangeLog`) | MOŽNÁ — generický `AuditLog` |
| Coupon/promo kódy (eshop) | Nerealizováno | ANO — pokud bude implementován |

---

## 8. DB Drift — migrace vs schema

### 8.1 Stav migrací
Celkem ~30 migrací v `prisma/migrations/`, poslední: `20260428070000_guest_comments`.

### 8.2 Review + TeamMember (zmíněno v build reportu)
- **`Review`** — v DB od `init` migrace + `sync_schema_drift` (2026-04-16). Aktivně používán v `app/api/admin/reviews/` (CRUD) a `prisma/seed.ts`.
- **`TeamMember`** — dedikovaná migrace `20260428060000_add_team_member`. Aktivně používán v `app/api/admin/team/` (CRUD) a `prisma/seed.ts` (3 upserty).
- **Závěr:** Oba modely MAJÍ migrace. Pokud chybí v dev DB, příčina je neprovedený `prisma migrate dev` po pullu — NE chybějící migrace.
- **Fix:** `npx prisma migrate dev` (nebo `migrate reset --force` při tsvector drift)

### 8.3 Známý schema drift
- `sync_schema_drift` migrace (2026-04-16) řešila 12 tabulek + 14 User sloupců — viz memory `project_schema_drift_catchup_20260416.md`
- Od té doby žádný nový drift detekován
- tsvector sloupce (Vehicle, Listing, Part) stále způsobují false-positive drift při `migrate dev` — standard fix: `migrate reset --force`

---

## 9. Další zjištění

### 9.1 tsvector drift (známý problém — viz §8.3)
- 3 modely používají `Unsupported("tsvector")?` — `Vehicle`, `Listing`, `Part`
- `prisma migrate dev` občas failne kvůli drift detekci tsvector/trgm
- Standard fix: `prisma migrate reset --force` (dev only)
- **Production unaffected** — `prisma migrate deploy` toto nekontroluje

### 9.2 Decimal typ
- `Partner.commissionRate` — `@db.Decimal(4, 2)` — správné pro procenta
- `SubOrder.commissionRate` — dtto
- `OrderItem.commissionRateApplied` — dtto (snapshot at order time)
- `PartnerCommissionLog.oldRate/newRate` — dtto

### 9.3 Unique constraints
- Všechny slug fields mají `@unique` (User, Vehicle, Listing, Part, Partner, Article, ArticleCategory, ArticleTag, Tag)
- Composite uniques správně nastavené (`@@unique([userId, listingId])` atd.)
- `Partner.ico` — `@unique` (IČO musí být unikátní)
- `Partner.userId` — `@unique` (1:1 s User)

### 9.4 Cascade delete coverage
- Child entities (images, logs, tags) — `onDelete: Cascade` ✅
- Optional references (reviewedBy, manager) — `onDelete: SetNull` ✅
- Main entities (Vehicle, Listing, Part) — žádný cascade (správné — nechceme cascade delete) ✅

---

## 10. Shrnutí a doporučení

### Celkové hodnocení: DOBRÝ STAV

| Kritérium | Stav | Skóre |
|-----------|------|-------|
| Počet modelů (81) | Odpovídá rozsahu platformy (4 produkty) | ✅ |
| Relace | Plně konzistentní, oboustranné | ✅ |
| Indexy (~130) | Solidní pokrytí, 2-3 doporučení na přidání | ✅ |
| Enum typy | String-based, konzistentní hodnoty | ✅ |
| Nepoužívané modely (3) | `DealComment`, `ListingFeedConfig`, `ListingImportLog` | ⚠️ |
| Chybějící modely | Žádné kritické | ✅ |
| JSON fields | Přiměřené použití | ✅ |
| Cascade deletes | Správně nastavené | ✅ |

### Prioritní akce
1. **MEDIUM:** Smazat `ListingFeedConfig` + `ListingImportLog` (duplicity s `FeedImportConfig`/`FeedImportLog`)
2. **LOW:** Rozhodnout o `DealComment` — ponechat nebo smazat
3. **LOW:** Přidat `@@index([city])` na Vehicle, `@@index([createdAt])` na Listing
4. **INFO:** Zvážit CHECK constraint na polymorfní modely (ProfileLike, ProfileComment) přes raw SQL
