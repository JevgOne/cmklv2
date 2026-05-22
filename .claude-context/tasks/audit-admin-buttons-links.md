# Audit admin panelu — tlačítka, odkazy, akce

## Shrnutí
- Celkem zkontrolováno: **38 stránek**, **35 komponent**
- Nalezeno kritických problémů: **3**
- Nalezeno varování: **4**
- Placeholder/nefunkční: **2**

---

## Kritické problémy (nefunkční odkazy/akce)

### 1. BrokersPageContent — odkaz na neexistující detail makléře
- **Soubor:** `components/admin/BrokersPageContent.tsx:69`
- **Odkaz/akce:** `<a href={/admin/brokers/${brokerId}}>` (tlačítko Zobrazit 👁)
- **Cíl:** `/admin/brokers/[id]`
- **Stav:** NEEXISTUJE — `app/(admin)/admin/brokers/[id]/page.tsx` chybí
- **Dopad:** Klik na "Zobrazit" u jakéhokoliv makléře → 404

### 2. BrokersPageContent — odkaz na neexistující edit makléře
- **Soubor:** `components/admin/BrokersPageContent.tsx:76`
- **Odkaz/akce:** `<a href={/admin/brokers/${brokerId}/edit}>` (tlačítko Upravit ✏️)
- **Cíl:** `/admin/brokers/[id]/edit`
- **Stav:** NEEXISTUJE — `app/(admin)/admin/brokers/[id]/edit/page.tsx` chybí
- **Dopad:** Klik na "Upravit" u jakéhokoliv makléře → 404

### 3. Blog — odkaz na "Nový článek" používá nestandartní cestu
- **Soubor:** `app/(admin)/admin/blog/page.tsx:37`
- **Odkaz/akce:** `<a href="/admin/blog/new/edit">` (tlačítko + Nový článek)
- **Cíl:** `/admin/blog/new/edit`
- **Stav:** FUNGUJE — `[id]/edit/page.tsx` správně zachytí `id="new"` a řeší to v kódu (line 21: `const isNew = id === "new"`)
- **Poznámka:** Toto NENÍ problém, jen nestandartní pattern. Funguje správně.

**→ SKUTEČNĚ KRITICKÉ: #1 a #2 (chybějící broker detail/edit stránky)**

---

## Varování (potenciální problémy)

### 4. AdminHeader — search bar je nefunkční placeholder
- **Soubor:** `components/admin/AdminHeader.tsx:27-31`
- **Prvek:** `<input type="text" placeholder="Hledat vozidla, makléře...">` 
- **Stav:** Nemá žádný `onChange`, `onSubmit` ani search handler — čistě vizuální placeholder
- **Dopad:** Uživatel může psát do search baru, ale nic se nestane
- **Priorita:** Nízká (UX problém, ne broken link)

### 5. Dashboard ExportButton — placeholder akce
- **Soubor:** `app/(admin)/admin/dashboard/ExportButton.tsx:14`
- **Akce:** `onClick` pouze zobrazí tooltip "Export dat bude brzy dostupný."
- **Stav:** Placeholder — žádný skutečný export
- **Dopad:** Uživatel klikne Export → vidí zprávu, ale nic se neexportuje
- **Priorita:** Nízká (informativní placeholder)

### 6. NotificationBell a NotificationsPageContent — volají broker API z admin panelu
- **Soubory:**
  - `components/admin/NotificationBell.tsx:25` — `fetch("/api/broker/notifications")`
  - `components/admin/NotificationsPageContent.tsx:37,54` — `fetch("/api/broker/notifications")`
- **Stav:** Tyto komponenty volají `/api/broker/notifications` z admin kontextu. API route existuje (`app/api/broker/notifications/route.ts`), ale je primárně pro role BROKER. Pro ADMIN/BACKOFFICE uživatele může vracet prázdné výsledky nebo chybu dle autorizace v API route.
- **Dopad:** Notifikační zvoneček v admin headeru může být nefunkční pro ne-broker role
- **Priorita:** Střední

### 7. ManagerBrokerDetailContent — volá neexistující manažerský deactivate endpoint pro non-manager kontext
- **Soubor:** `components/admin/ManagerBrokerDetailContent.tsx:117`
- **Akce:** `fetch(/api/manager/brokers/${broker.id}/deactivate, { method: "POST" })`
- **Stav:** Route existuje (`app/api/manager/brokers/[id]/deactivate/route.ts`), ale tato komponenta se používá jen v manažerské sekci — OK
- **Priorita:** Žádná (funguje správně v kontextu)

---

## Placeholder tlačítka (záměrně disabled)

### 8. VehiclesPageContent — "Přidat vozidlo" disabled
- **Soubor:** `components/admin/VehiclesPageContent.tsx:234`
- **Prvek:** `<Button variant="primary" size="sm" disabled title="Vozidla přidávají makléři přes PWA aplikaci">`
- **Stav:** Záměrně disabled s vysvětlením v title. Správné chování.

---

## OK (funguje správně)

### Sidebar navigace (AdminSidebar.tsx)
Všechny odkazy v sidebar vedou na existující stránky:
| Odkaz | Cílová stránka | Stav |
|-------|----------------|------|
| `/admin/dashboard` | `app/(admin)/admin/dashboard/page.tsx` | OK |
| `/admin/vehicles` | `app/(admin)/admin/vehicles/page.tsx` | OK |
| `/admin/inzerce` | `app/(admin)/admin/inzerce/page.tsx` | OK |
| `/admin/brokers` | `app/(admin)/admin/brokers/page.tsx` | OK |
| `/admin/leads` | `app/(admin)/admin/leads/page.tsx` | OK |
| `/admin/users` | `app/(admin)/admin/users/page.tsx` | OK |
| `/admin/career` | `app/(admin)/admin/career/page.tsx` | OK |
| `/admin/manager` | `app/(admin)/admin/manager/page.tsx` | OK |
| `/admin/manager/brokers` | `app/(admin)/admin/manager/brokers/page.tsx` | OK |
| `/admin/manager/approvals` | `app/(admin)/admin/manager/approvals/page.tsx` | OK |
| `/admin/manager/bonuses` | `app/(admin)/admin/manager/bonuses/page.tsx` | OK |
| `/admin/partners` | `app/(admin)/admin/partners/page.tsx` | OK |
| `/admin/feeds` | `app/(admin)/admin/feeds/page.tsx` | OK |
| `/admin/orders` | `app/(admin)/admin/orders/page.tsx` | OK |
| `/admin/returns` | `app/(admin)/admin/returns/page.tsx` | OK |
| `/admin/suppliers` | `app/(admin)/admin/suppliers/page.tsx` | OK |
| `/admin/parts` | `app/(admin)/admin/parts/page.tsx` | OK |
| `/admin/payments` | `app/(admin)/admin/payments/page.tsx` | OK |
| `/admin/payouts` | `app/(admin)/admin/payouts/page.tsx` | OK |
| `/admin/marketplace` | `app/(admin)/admin/marketplace/page.tsx` | OK |
| `/admin/blog` | `app/(admin)/admin/blog/page.tsx` | OK |
| `/admin/blog/ai-drafts` | `app/(admin)/admin/blog/ai-drafts/page.tsx` | OK |
| `/admin/tagy` | `app/(admin)/admin/tagy/page.tsx` | OK |
| `/admin/profile` | `app/(admin)/admin/profile/page.tsx` | OK |
| `/admin/notifications` | `app/(admin)/admin/notifications/page.tsx` | OK |

### Dynamické detail stránky
| Odkaz | Cílová stránka | Stav |
|-------|----------------|------|
| `/admin/vehicles/[id]` | `app/(admin)/admin/vehicles/[id]/page.tsx` | OK |
| `/admin/vehicles/[id]/edit` | `app/(admin)/admin/vehicles/[id]/edit/page.tsx` | OK |
| `/admin/inzerce/[id]` | `app/(admin)/admin/inzerce/[id]/page.tsx` | OK |
| `/admin/leads/[id]` | `app/(admin)/admin/leads/[id]/page.tsx` | OK |
| `/admin/partners/[id]` | `app/(admin)/admin/partners/[id]/page.tsx` | OK |
| `/admin/marketplace/[id]` | `app/(admin)/admin/marketplace/[id]/page.tsx` | OK |
| `/admin/manager/brokers/[id]` | `app/(admin)/admin/manager/brokers/[id]/page.tsx` | OK |
| `/admin/manager/brokers/[id]/transfer` | `app/(admin)/admin/manager/brokers/[id]/transfer/page.tsx` | OK |
| `/admin/manager/vehicles/[id]/edit` | `app/(admin)/admin/manager/vehicles/[id]/edit/page.tsx` | OK |
| `/admin/blog/[id]/edit` | `app/(admin)/admin/blog/[id]/edit/page.tsx` | OK |
| `/admin/feeds/[id]` | `app/(admin)/admin/feeds/[id]/page.tsx` | OK |
| `/admin/returns/[id]` | `app/(admin)/admin/returns/[id]/page.tsx` | OK |

### API volání z admin komponent
| Komponenta | API endpoint | Stav |
|-----------|-------------|------|
| BrokersPageContent | `GET /api/admin/brokers` | OK |
| BrokersPageContent | `POST /api/admin/brokers/[id]/reject` | OK |
| BrokerApprovalCard | `PUT /api/admin/brokers/[id]/activate` | OK |
| BrokerApprovalCard | `POST /api/admin/brokers/[id]/reject` | OK |
| InviteBrokerModal | `POST /api/invitations` | OK |
| VehiclesPageContent | `GET /api/admin/vehicles` | OK |
| VehiclesPageContent | `DELETE /api/admin/vehicles/[id]` | OK |
| ListingsPageContent | `GET /api/admin/listings` | OK |
| ListingsPageContent | `PATCH /api/admin/listings/[id]` | OK |
| ListingDetailContent | `GET /api/admin/listings/[id]` | OK |
| ListingDetailContent | `PATCH /api/admin/listings/[id]` | OK |
| ApprovalActions | `POST /api/admin/vehicles/[id]/approve` | OK |
| ManagerApprovalActions | `POST /api/manager/vehicles/[id]/approve` | OK |
| PaymentsPageContent | `GET /api/payments` | OK |
| PaymentsPageContent | `PUT /api/payments/[id]/confirm` | OK |
| PayoutsPageContent | `GET /api/payouts/seller` | OK |
| PayoutsPageContent | `GET /api/payouts/broker` | OK |
| PayoutsPageContent | `POST /api/payouts/seller/[id]/process` | OK |
| PayoutsPageContent | `PUT /api/payouts/broker/[id]/approve` | OK |
| PayoutsPageContent | `POST /api/payouts/broker/generate` | OK |
| ProfileForm | `PATCH /api/admin/profile` | OK |
| CareerOverviewContent | `GET /api/admin/career` | OK |
| CareerOverviewContent | `PUT /api/admin/career/[id]/level` | OK |
| PartnersTable | `GET /api/partners` | OK |
| PartnerDetail | `GET/PATCH /api/partners/[id]` | OK |
| PartnerDetail | `GET/POST /api/partners/[id]/activities` | OK |
| PartnerDetail | `POST /api/partners/[id]/activate` | OK |
| AdminLeadsTable | navigace na `/admin/leads/[id]` | OK |
| LeadAssignment | `PUT /api/leads/[id]/assign` | OK |
| ManagerBrokersContent | navigace na `/admin/manager/brokers/[id]` | OK |
| ManagerBrokerDetailContent | `POST /api/manager/brokers/[id]/deactivate` | OK |
| TransferVehiclesContent | `POST /api/manager/brokers/[id]/transfer-vehicles` | OK |
| ManagerNotificationPreferences | `GET/PUT /api/settings/notifications` | OK |
| FlipManagement | navigace na `/admin/marketplace/[id]` | OK |
| PaymentConfirmation | `PUT /api/marketplace/investments/[id]/confirm-payment` | OK |
| AdminFlipDetailPage | `GET /api/marketplace/opportunities/[id]` | OK |
| AdminFlipDetailPage | `POST /api/marketplace/opportunities/[id]/approve` | OK |
| AdminFlipDetailPage | `POST /api/marketplace/opportunities/[id]/payout` | OK |
| BlogArticlesTable | `POST /api/blog/articles/[id]/publish` | OK |
| BlogArticlesTable | `DELETE /api/blog/articles/[id]` | OK |
| BlogArticlesTable | `PATCH /api/blog/articles/[id]` | OK |
| AiDraftGenerator | `POST /api/blog/ai-generate` | OK |
| AiDraftGenerator | `POST /api/blog/articles` | OK |
| ArticleEditor | `POST/PATCH /api/blog/articles[/id]` | OK |
| AdminOrdersPage | `GET/PATCH /api/admin/orders` | OK |
| AdminSuppliersPage | `GET /api/admin/suppliers` | OK |
| AdminPartsPage | `GET/PATCH /api/admin/parts` | OK |
| AdminReturnsPage | `GET /api/admin/returns` | OK |
| AdminReturnDetailPage | `GET/PUT /api/admin/returns/[id]` | OK |
| AdminUsersPage | `GET/PATCH /api/admin/users` | OK |
| VehicleEditForm | `PUT /api/manager/vehicles/[id]` | OK |

---

## Doporučená oprava (priorita)

1. **[P0 — KRITICKÉ]** Vytvořit `app/(admin)/admin/brokers/[id]/page.tsx` — detail stránka makléře
2. **[P0 — KRITICKÉ]** Vytvořit `app/(admin)/admin/brokers/[id]/edit/page.tsx` — edit stránka makléře
3. **[P2 — NICE TO HAVE]** Implementovat funkční search v AdminHeader nebo odstranit placeholder
4. **[P2 — NICE TO HAVE]** Implementovat skutečný export v dashboard ExportButton
5. **[P1 — STŘEDNÍ]** Ověřit a případně opravit NotificationBell — volá `/api/broker/notifications` i pro ADMIN role

---

*Audit proveden: 2026-04-25*
*Auditovaný scope: `app/(admin)/admin/**`, `components/admin/**`, relevantní API routes*
