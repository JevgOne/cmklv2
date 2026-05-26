# AUDIT: Role-Based Access System — Carmakler

**Task #4 (TASK-R01)** | Implementátor | 2026-05-26
**Status:** HOTOVO

---

## §1 Role v systému

### 1.1 Definované role (schema.prisma:21)

```
ADMIN, BACKOFFICE, REGIONAL_DIRECTOR, MANAGER, BROKER,
ADVERTISER, BUYER, PARTS_SUPPLIER, WHOLESALE_SUPPLIER,
INVESTOR, VERIFIED_DEALER, PARTNER_BAZAR, PARTNER_VRAKOVISTE
```

**Celkem: 13 rolí** (default = BROKER)

### 1.2 Role skupiny (middleware.ts)

| Skupina | Role | Účel |
|---------|------|------|
| ADMIN_ROLES | ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | /admin/* přístup |
| MAKLER_ROLES | BROKER, MANAGER, REGIONAL_DIRECTOR, ADMIN | /makler/* PWA |
| INZERENT_ROLES | ADVERTISER, ADMIN, BACKOFFICE | /moje-inzeraty (definováno, nepoužíváno v middleware) |
| BUYER_ROLES | BUYER, ADVERTISER, ADMIN, BACKOFFICE | (definováno, nepoužíváno v middleware) |
| PARTS_SUPPLIER_ROLES | PARTS_SUPPLIER, WHOLESALE_SUPPLIER, PARTNER_VRAKOVISTE, ADMIN, BACKOFFICE | /parts/* PWA |
| MARKETPLACE_DEALER_ROLES | VERIFIED_DEALER, ADMIN, BACKOFFICE | /marketplace/dealer/* |
| MARKETPLACE_INVESTOR_ROLES | INVESTOR, ADMIN, BACKOFFICE | /marketplace/investor/* |
| MARKETPLACE_ALL_ROLES | VERIFIED_DEALER, INVESTOR, ADMIN, BACKOFFICE | /marketplace/deals/* (inline) |
| PARTNER_ROLES | PARTNER_BAZAR, PARTNER_VRAKOVISTE, ADMIN, BACKOFFICE | /partner/* |

---

## §2 Middleware ochrana (middleware.ts)

### 2.1 Chráněné route prefixy

| Prefix | Autentizace | Role | Onboarding redirect |
|--------|-------------|------|---------------------|
| `/admin/*` | Token required → /login | ADMIN_ROLES | — |
| `/makler/onboarding/*` | Token required → /login | MAKLER_ROLES | ACTIVE → /makler/dashboard |
| `/makler/dashboard,vehicles,...` | Token required → /login | MAKLER_ROLES | ONBOARDING → /makler/onboarding |
| `/parts/*` | Token required → /login | PARTS_SUPPLIER_ROLES | ONBOARDING → /parts/onboarding |
| `/marketplace/deals/*` | Token required → /marketplace/apply | MARKETPLACE_ALL_ROLES | — |
| `/marketplace/dealer/*` | Token required → /marketplace/apply | MARKETPLACE_DEALER_ROLES | — |
| `/marketplace/investor/*` | Token required → /marketplace/apply | MARKETPLACE_INVESTOR_ROLES | — |
| `/partner/*` | Token required → /login | PARTNER_ROLES | ONBOARDING → /partner/onboarding |
| `/moje-inzeraty/*` | Token required → /login | Any authenticated | — |
| `/muj-ucet/*` | Token required → /login | Any authenticated | — |
| `/shop/moje-objednavky/*` | Token required → /login | Any authenticated | — |
| `/dily/moje-objednavky/*` | Token required → /login | Any authenticated | — |

### 2.2 Nechráněné route prefixy (veřejné)

Vše ostatní je veřejné — `/nabidka`, `/blog`, `/stk`, `/autoservisy`, `/dily`, `/shop`, `/inzerce`, `/marketplace` (landing), `/kontakt`, `/o-nas`, atd.

### 2.3 Nalezené problémy v middleware

| # | Problém | Severity | Detail |
|---|---------|----------|--------|
| M-1 | INZERENT_ROLES a BUYER_ROLES definovány ale NEPOUŽITY | INFO | Middleware chrání `/moje-inzeraty` jen autentizací (any role), ne INZERENT_ROLES |
| M-2 | `/makler/[slug]` veřejné profily NEchráněné | OK | Záměrné — veřejné profily makléřů. Middleware chrání jen explicitní cesty v `protectedMaklerPaths` |
| M-3 | Chybí `/makler/notifications` v protectedMaklerPaths | WARNING | `/makler/notifications` není v seznamu chráněných cest — mohl by být přístupný bez BROKER role |

---

## §3 Admin page-level ochrana

### 3.1 Stránky BEZ page-level role check (spoléhají jen na middleware)

Middleware povoluje ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR na celý `/admin/*`. Tyto stránky nemají vlastní role check:

| Stránka | Efektivní přístup | Riziko |
|---------|-------------------|--------|
| dashboard/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | LOW — OK pro všechny admin role |
| brokers/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | LOW — OK pro všechny |
| payments/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | MEDIUM — MANAGER a RD vidí platby |
| broker-reviews/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | LOW — OK |
| inzerce/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | LOW — OK |
| inzerce/[id]/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | LOW — OK |
| autoservisy/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | LOW — OK |
| leads/[id]/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | MEDIUM — REGIONAL_DIRECTOR vidí detail leadu |
| marketplace/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | LOW — overview |
| marketplace/applications/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | MEDIUM — MANAGER/RD vidí marketplace aplikace |
| team/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | MEDIUM — MANAGER/RD vidí tým |
| partners/new/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | MEDIUM — kdo může vytvářet partnery? |
| partners/[id]/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | LOW — detail |
| vehicles/page.tsx | MW: ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR | LOW — OK |

### 3.2 Stránky S page-level check (přísnější než middleware)

| Stránka | Middleware role | Page-level role | Efekt |
|---------|---------------|-----------------|-------|
| seo/metadata/[id] | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN only | BACKOFFICE, MANAGER, RD vyloučeni |
| tagy/page.tsx | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN only | BACKOFFICE, MANAGER, RD vyloučeni |
| blog/ai-drafts | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN only | BACKOFFICE, MANAGER, RD vyloučeni |
| blog/page.tsx | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE | MANAGER, RD vyloučeni |
| blog/comments | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE | MANAGER, RD vyloučeni |
| marketplace/[id] | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE | MANAGER, RD vyloučeni |
| marketplace/applications/[id] | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE | MANAGER, RD vyloučeni |
| users/page.tsx | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE, MANAGER | RD vyloučen |
| vehicles/[id] | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE, MANAGER | RD vyloučen |
| vehicles/[id]/edit | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE, MANAGER | RD vyloučen |
| vehicles/new | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE, MANAGER | RD vyloučen |
| parts/page.tsx | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE, MANAGER | RD vyloučen |
| suppliers/page.tsx | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE, MANAGER | RD vyloučen |
| returns/ | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE, MANAGER | RD vyloučen |
| feeds/ | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE, MANAGER | RD vyloučen |
| workflow/ | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, MANAGER, RD | BACKOFFICE vyloučen |
| manager/* | ADMIN, BACKOFFICE, MANAGER, RD | MANAGER, REGIONAL_DIRECTOR, ADMIN | BACKOFFICE vyloučen |
| notifications | ADMIN, BACKOFFICE, MANAGER, RD | ADMIN, BACKOFFICE, MANAGER, RD, BROKER | Rozšiřuje! BROKER přidán |

### 3.3 Nalezené problémy

| # | Problém | Severity | Detail |
|---|---------|----------|--------|
| P-1 | notifications/page.tsx přidává BROKER roli | HIGH | Page-level check povoluje BROKER, ale middleware BROKER nepustí na /admin/* → redirect loop nebo 302 ping-pong. BROKER se na stránku nikdy nedostane přes middleware, ale role check je špatně. |
| P-2 | SEO pages bez page-level check | MEDIUM | `/admin/seo/page.tsx`, `/admin/seo/metadata/page.tsx`, `/admin/seo/audit/page.tsx` nemají page-level ADMIN-only check, ale sidebar je ADMIN only a API je ADMIN only. MANAGER/BACKOFFICE vidí stránku ale API vrátí 403. |
| P-3 | Sidebar vs page-level nesoulad | INFO | Sidebar ukazuje SEO jen ADMIN, ale stránky jsou přístupné MW rolím pokud znají URL. |

---

## §4 API route ochrana — Admin

### 4.1 Matice: Admin API × Role

| API Route | GET | POST | PATCH | DELETE |
|-----------|-----|------|-------|--------|
| seo/pages | ADMIN | ADMIN | ADMIN (bulk) | — |
| seo/pages/[id] | ADMIN | — | ADMIN | ADMIN |
| seo/audit | ADMIN | ADMIN | — | — |
| vehicles | A,BO,M | — | — | — |
| vehicles/[id] | A,BO,M | — | A,BO,M | A,BO |
| vehicles/[id]/approve | — | A,BO,M | — | — |
| brokers | A,BO,M,RD | — | — | — |
| brokers/[id] | A,BO,M,RD | — | A,M,RD | — |
| brokers/[id]/activate | — | M,RD,A | — | — |
| brokers/[id]/reject | — | M,RD,A,BO | — | — |
| users | A,BO,M | A | — | — |
| users/[id] | A | — | A | — |
| users/[id]/password | — | — | A | — |
| orders | A,BO,M | — | A,BO,M | — |
| returns | A,BO,M | — | — | — |
| returns/[id] | A,BO,M | — | A,BO | — |
| parts | A,BO,M | — | A,BO | — |
| suppliers | A,BO,M | — | — | — |
| feeds | A,BO,M | A,BO,M | — | — |
| feeds/[id] | A,BO,M | — | A,BO,M | A,BO |
| feeds/[id]/import | — | A,BO,M | — | — |
| feeds/[id]/logs | A,BO,M | — | — | — |
| feeds/suppliers | A,BO,M | — | — | — |
| team | A,BO | A,BO | — | — |
| team/[id] | A,BO | — | A,BO | A,BO |
| reviews | A,BO,M | A,BO,M | — | — |
| reviews/[id] | A,BO,M | — | A,BO,M | — |
| broker-reviews | A,BO | A,BO | — | — |
| broker-reviews DELETE | — | — | — | A |
| notifications | A,BO,M,RD | A,BO,M,RD | — | — |
| comments/[id] | — | — | A,BO | A,BO |
| listings | A,BO,M | — | — | — |
| listings/[id] | A,BO,M | — | A,BO,M | — |
| listings/flagged | A,BO,M | — | — | — |
| listings/[id]/moderate | — | — | A,BO,M | — |
| autoservisy | A,BO | A,BO | — | — |
| autoservisy/reviews/[id] | A,BO | — | A,BO | — |
| export | A,BO | — | — | — |
| profile | A,BO,M,RD | — | A,BO,M,RD | — |
| profile/password | — | — | A,BO,M,RD | — |
| career | A,BO,M,RD | — | — | — |
| career/[id]/level | — | — | A,M | — |
| marketplace/applications | A,BO | — | — | — |
| marketplace/applications/[id] | A,BO | — | A,BO | — |
| send-verification-emails | — | A | — | — |
| partners/[id]/commission | — | — | (canEditCommission) | — |
| reports/commission-summary | (canViewSummary) | — | — | — |

**Legenda:** A=ADMIN, BO=BACKOFFICE, M=MANAGER, RD=REGIONAL_DIRECTOR

### 4.2 Nalezené problémy v Admin API

| # | Problém | Severity | Detail |
|---|---------|----------|--------|
| A-1 | Nekonzistentní naming | LOW | Některé soubory: `ALLOWED_ROLES`, jiné `ADMIN_ROLES`, jiné `ACTIVATE_ROLES`, jiné inline array |
| A-2 | Career level change: ADMIN+MANAGER ale ne BACKOFFICE | INFO | Záměrné? BACKOFFICE nemůže měnit level |
| A-3 | Broker reviews DELETE: jen ADMIN | INFO | Záměrné — destruktivní akce jen pro ADMIN |

---

## §5 Non-Admin API ochrana

### 5.1 Matice: Non-Admin API × Role

| API Route | Metoda | Povolené role | Ochrana |
|-----------|--------|---------------|--------|
| broker/* (stats, profile, achievements, commissions, leaderboard) | GET | BROKER, MANAGER, RD, ADMIN | ALLOWED_ROLES constant |
| broker/vehicles | GET | BROKER, MANAGER, ADMIN | ⚠ RD chybí (na rozdíl od ostatních broker routes) |
| broker/tour-complete | POST | Any authenticated | ⚠ Žádný role check |
| broker/notifications | GET/PATCH | BROKER, MANAGER, RD, ADMIN, PARTS_SUPPLIER | ⚠ PARTS_SUPPLIER přidán |
| marketplace/opportunities | GET | VD, INVESTOR, ADMIN, BO | MARKETPLACE_ALLOWED_ROLES |
| marketplace/opportunities | POST | VD, ADMIN, BO | DEALER_ROLES |
| marketplace/opportunities/[id]/approve | POST | ADMIN, BO | ADMIN_ROLES |
| marketplace/investments | POST | INVESTOR, ADMIN, BO | INVESTOR_ROLES |
| marketplace/stats | GET | Role-based filtering | Dynamic |
| marketplace/apply | POST | Public | ✓ Záměrné |
| partner/* (dashboard, profile, parts, vehicles, leads, billing) | GET | PB, PV | PARTNER_ROLES |
| manager/* (stats, brokers, vehicles, bonuses) | GET/POST | MANAGER, RD, ADMIN | Inline check |
| parts | GET | Public | ✓ Záměrné (katalog) |
| parts | POST | PS, WS, PV, ADMIN, BO | allowedRoles |
| parts/my | GET | PS, WS, PV, ADMIN, BO | SUPPLIER_ROLES |
| donor-vehicles | GET/POST | PS, ADMIN, BO | ALLOWED_ROLES |
| vehicles | GET | Public (ACTIVE only) | ✓ Záměrné |
| vehicles | POST | Any authenticated | ⚠ Žádný role check |
| vehicles/[id] | PATCH | Owner + ADMIN | Ownership check |
| leads | GET | BROKER, MANAGER, ADMIN, BO, RD | Role-specific filtering |
| leads/external | POST | X-API-Key | API key auth |
| scout-leads | GET | Role-filtered | Dynamic |
| scout-leads/ingest | POST | X-API-Key | API key auth |
| workflow | GET/POST | ADMIN, MANAGER, RD, BROKER | ALLOWED_ROLES |
| contracts | POST | Any authenticated | ⚠ Žádný role check |
| escalations | POST | Any authenticated | ⚠ Žádný role check |
| orders | POST | Guest/anonymous | ✓ Záměrné (e-commerce) |
| listings | POST | Any/anonymous | ✓ Záměrné (inzerce) |

**Legenda:** VD=VERIFIED_DEALER, PS=PARTS_SUPPLIER, WS=WHOLESALE_SUPPLIER, PB=PARTNER_BAZAR, PV=PARTNER_VRAKOVISTE

### 5.2 Kritické nálezy

| # | Problém | Severity | Detail |
|---|---------|----------|--------|
| N-1 | `POST /api/vehicles` — žádný role check | HIGH | Jakýkoliv přihlášený uživatel (BUYER, ADVERTISER...) může vytvořit Vehicle. Mělo by být omezeno na BROKER, MANAGER, ADMIN. |
| N-2 | `POST /api/contracts` — žádný role check | HIGH | Jakýkoliv přihlášený uživatel může vytvářet smlouvy. Mělo by být BROKER, MANAGER, ADMIN. |
| N-3 | `POST /api/escalations` — žádný role check | MEDIUM | Jakýkoliv přihlášený uživatel může vytvořit eskalaci. Pravděpodobně záměrné (BROKER eskaluje), ale chybí role omezení. |
| N-4 | `broker/vehicles` vynechává REGIONAL_DIRECTOR | LOW | Ostatní broker/* routes povolují RD, ale vehicles ne. Nekonzistence. |
| N-5 | `broker/notifications` zahrnuje PARTS_SUPPLIER | LOW | Neobvyklé — PARTS_SUPPLIER nemá broker notifikace. |
| N-6 | `broker/tour-complete` — žádný role check | LOW | Každý přihlášený uživatel může označit tour jako dokončený. |

---

## §6 Sidebar vs Middleware vs Page-level vs API — konzistence

### 6.1 SEO sekce — nesoulad

| Vrstva | Přístup |
|--------|---------|
| Sidebar | ADMIN only (roles: ["ADMIN"]) |
| Middleware | ADMIN, BACKOFFICE, MANAGER, REGIONAL_DIRECTOR (prefix /admin) |
| Page-level | `/admin/seo/page.tsx` — žádný check (MW only) |
| Page-level | `/admin/seo/metadata/page.tsx` — žádný check (MW only) |
| Page-level | `/admin/seo/metadata/[id]/page.tsx` — ADMIN only ✓ |
| Page-level | `/admin/seo/audit/page.tsx` — žádný check (MW only) |
| API | ADMIN only (requireAdmin) |

**Problém:** BACKOFFICE/MANAGER/RD se dostanou na `/admin/seo` přes URL (MW je pustí), ale sidebar to neukazuje. Dashboard a metadata stránky nemají page-level check → uvidí HTML ale API vrátí 403. Detail stránka má ADMIN-only check → redirect.

**Doporučení:** Přidat ADMIN-only page-level check na `/admin/seo/page.tsx`, `/admin/seo/metadata/page.tsx`, `/admin/seo/audit/page.tsx`.

### 6.2 Blog sekce

| Vrstva | Přístup |
|--------|---------|
| Sidebar | ADMIN only (v sekci "OBSAH", roles: ["ADMIN"]) |
| blog/page.tsx | ADMIN, BACKOFFICE |
| blog/[id]/edit | ADMIN, BACKOFFICE, BROKER |
| blog/ai-drafts | ADMIN only |
| blog/comments | ADMIN, BACKOFFICE |

**Problém:** blog/[id]/edit povoluje BROKER, ale sidebar blog neukazuje. BROKER by musel znát URL. Sidebar říká ADMIN-only ale stránky povolují i BACKOFFICE.

### 6.3 Marketplace sekce

| Vrstva | Přístup |
|--------|---------|
| Sidebar | ADMIN, BACKOFFICE, MANAGER |
| marketplace/page.tsx | MW only (ADMIN, BO, M, RD) |
| marketplace/[id] | ADMIN, BACKOFFICE |
| marketplace/applications/page.tsx | MW only |
| marketplace/applications/[id] | ADMIN, BACKOFFICE |

**Problém:** MANAGER vidí marketplace v sidebaru a list page, ale detaily a aplikace jsou ADMIN+BO only.

---

## §7 Souhrnná doporučení

### Kritické (HIGH)

1. **N-1: POST /api/vehicles bez role check** — přidat BROKER/MANAGER/ADMIN omezení
2. **N-2: POST /api/contracts bez role check** — přidat BROKER/MANAGER/ADMIN omezení
3. **P-1: notifications/page.tsx BROKER role** — odebrat BROKER z page-level check (MW ho nepustí)

### Důležité (MEDIUM)

4. **P-2: SEO pages bez ADMIN check** — přidat page-level `role !== "ADMIN"` check na 3 SEO stránky
5. **N-3: POST /api/escalations bez role check** — zvážit omezení na BROKER/MANAGER
6. **M-3: /makler/notifications chybí v protectedMaklerPaths** — přidat do middleware

### Nízké (LOW/INFO)

7. **A-1: Nekonzistentní naming** — standardizovat na ALLOWED_ROLES/ADMIN_ROLES pattern
8. **M-1: INZERENT_ROLES/BUYER_ROLES nepoužité** — zvážit cleanup nebo doimplementování
9. **N-4: broker/vehicles vynechává RD** — sjednotit s ostatními broker routes
10. **N-5: broker/notifications zahrnuje PARTS_SUPPLIER** — ověřit záměr

---

## §8 Matice Role × Funkce (přehled)

```
                    ADMIN  BO  MANAGER  RD  BROKER  ADV  BUYER  PS  WS  PV  INV  VD  PB
Admin Dashboard      ✓     ✓    ✓      ✓
Admin Vehicles       ✓     ✓    ✓
Admin Brokers        ✓     ✓    ✓      ✓
Admin Users          ✓     ✓    ✓
Admin Leads          ✓     ✓    ✓      ✓
Admin Partners       ✓     ✓    ✓      ✓
Admin Payments       ✓     ✓    ✓      ✓
Admin Orders         ✓     ✓    ✓
Admin Returns        ✓     ✓    ✓
Admin Parts          ✓     ✓    ✓
Admin Suppliers      ✓     ✓    ✓
Admin Feeds          ✓     ✓    ✓
Admin Blog           ✓     ✓
Admin SEO            ✓
Admin Team           ✓     ✓
Admin Reviews        ✓     ✓    ✓
Admin Marketplace    ✓     ✓
Admin Career         ✓     ✓    ✓      ✓
Admin Workflow       ✓          ✓      ✓
Admin Notifications  ✓     ✓    ✓      ✓
Manager Section      ✓          ✓      ✓
PWA Makléř                            ✓    ✓          ✓
PWA Parts                                              ✓   ✓   ✓
Partner Portal                                                          ✓    ✓
Marketplace Deal     ✓     ✓                                       ✓    ✓
Marketplace Dealer   ✓     ✓                                            ✓
Marketplace Investor ✓     ✓                                       ✓
Inzerce (moje)       Any authenticated user
Objednávky (moje)    Any authenticated user
Veřejný web          Public (no auth)
```

**Legenda:** BO=BACKOFFICE, RD=REGIONAL_DIRECTOR, ADV=ADVERTISER, PS=PARTS_SUPPLIER, WS=WHOLESALE_SUPPLIER, PV=PARTNER_VRAKOVISTE, INV=INVESTOR, VD=VERIFIED_DEALER, PB=PARTNER_BAZAR
