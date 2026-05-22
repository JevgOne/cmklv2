# QA Report — Tasks #11, #12

**Datum:** 2026-05-22  
**Commits:** c5c765a (Task #11), ff8e764 (Task #12)

---

## Task #11 — Recenze fix — PASS ✅

### BUG A — Tab filtr (ReviewList.tsx)
- SELLER→**SALE**, BUYER→**PURCHASE** ✅
- Použita "alternativa" (2 tabs) per plán doporučení ✅
- GENERAL/PARTS/MARKETPLACE padají do "Všechny" ✅

### BUG B — Badge mapping (ReviewList.tsx)
- `variant`: SALE→"verified", PURCHASE→"new", ostatní→"default" ✅
- Label: SALE→"Prodej auta", PURCHASE→"Nákup auta", PARTS→"Autodíly", MARKETPLACE→"Marketplace", fallback→"Recenze" ✅

### API Zod schémata
- `app/api/admin/reviews/route.ts`: enum `["GENERAL","SELLER","BUYER"]` → `["GENERAL","SALE","PURCHASE","PARTS","MARKETPLACE"]` ✅
- `app/api/admin/reviews/[id]/route.ts`: stejná oprava ✅

### ReviewsManager.tsx
- TYPE_LABELS: SELLER/BUYER→SALE/PURCHASE/PARTS/MARKETPLACE ✅
- Select options: synchronizovány ✅

### STOP pravidla
- STOP-1: ReviewForm typy = tab values ✅
- STOP-3: AdminSidebar obsahuje `{ href: "/admin/reviews", label: "Recenze" }` ✅
- Admin stránka `/admin/reviews/page.tsx` EXISTS ✅

### Lint
0 errors, 0 warnings na všech 4 souborech ✅

---

## Task #12 — Zprávy PWA — PASS ✅ (1 poznámka)

### Krok 1 — Email reply (inquiries/[inquiryId]/route.ts)
- `sendEmail` volán s `{ to, subject, html }` — odpovídá skutečné `lib/resend.ts` API ✅
- Plan psal `template: "inquiry-reply"` (React Email), ale `lib/resend.ts` používá `html:` — implementor správně adaptoval ✅
- `emails/` složka neexistuje — inline HTML je správný přístup pro tento projekt ✅
- Graceful: `if (data.reply && existing.buyerEmail)` — STOP-3 splněn ✅
- Fire-and-forget: `.catch(err => console.error(...))` — neblokuje response ✅
- Email obsah: buyerName, vehicleName, reply text, vehicleUrl CTA ✅
- vehicleUrl: `vehicle.slug || vehicle.id` (slug preferred, ID fallback) ✅

### Krok 2 — Badge fix
- `app/api/broker/unread-inquiries/route.ts` (nový endpoint) ✅
- Auth + role check (BROKER/MANAGER/REGIONAL_DIRECTOR/ADMIN) ✅
- Count query: `status: "NEW", brokerId: session.user.id` ✅
- BottomNav: endpoint `/api/broker/notifications` → `/api/broker/unread-inquiries`, `data.unreadCount` → `data.count` ✅
- STOP-5: logika badge zachována, pouze endpoint změněn ✅

### Lint
0 errors, 0 warnings na všech 3 souborech ✅

### ⚠️ Poznámka — HTML injection v emailu
```tsx
// app/api/vehicles/[id]/inquiries/[inquiryId]/route.ts ř. 127
<p style="... white-space: pre-wrap;">${data.reply}</p>
```
`data.reply` je embedded přímo do HTML bez escapování. Makléř se zvláštními znaky (`<b>`, `<script>`) by vyrenderoval HTML v emailu.

**Závažnost:** LOW — broker je interní ověřený uživatel, ne veřejný input.  
**Doporučení:** Přidat `data.reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')` před vložením.  
**Neblokuje merge** — funkcionalita je správná.

---

## Souhrnný výsledek

| Task | Status | Poznámka |
|---|---|---|
| #11 Recenze fix | **PASS ✅** | Všechny bugy opraveny, admin sidebar OK |
| #12 Zprávy PWA | **PASS ✅** | HTML escaping doporučen (LOW, neblokuje) |
