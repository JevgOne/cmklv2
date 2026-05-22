# Implementace P0-09: Vraceni a reklamace

**Status:** HOTOVO
**Datum:** 2026-04-05
**Implementoval:** implementator agent

---

## Provedene zmeny

### 1. `prisma/schema.prisma`
- Pridan model `ReturnRequest` (prejmenovano z `Return` — reserved keyword v JS)
- Pridana relace `returns ReturnRequest[]` do Order
- 4 indexy: orderId, status, type, createdAt
- Pole: type (WITHDRAWAL/WARRANTY), items (JSON), reason, defectDesc, photos, contact*, bankAccount, requestedAmount, approvedAmount, status, rejectionReason, deadlineAt, adminNotes

### 2. `lib/validators/return.ts` (NOVY)
- Zod schema `createReturnSchema` s validaci typu, polozek, kontaktu, fotek

### 3. `app/api/orders/[id]/returns/route.ts` (NOVY)
- POST: vytvoreni zadosti (overeni DELIVERED, 14-den lhuta pro WITHDRAWAL, kalkulace castky, 30-den deadline)
- GET: seznam vraceni/reklamaci pro objednavku

### 4. `app/api/admin/returns/[id]/route.ts` (NOVY)
- GET: detail reklamace (ADMIN/BACKOFFICE only)
- PUT: zmena stavu, rejectionReason, approvedAmount, adminNotes. Automaticky refundedAt pri REFUNDED.

### 5. `app/(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` (NOVY)
- Formular pro 14-denni odstoupeni od smlouvy
- Vyber polozek, duvod, kontakt, IBAN
- Odpocet zbyvajicich dni, odkaz na reklamacni rad

### 6. `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` (NOVY)
- Formular pro zarucni reklamaci
- Navic: popis zavady, upload fotek pres /api/upload
- Info o 30-denni lhute

### 7. `app/(web)/shop/moje-objednavky/page.tsx`
- Pridana tlacitka "Chci vratit" a "Reklamovat" u DELIVERED objednavek

### 8. `app/(web)/dily/moje-objednavky/page.tsx`
- Shodna zmena jako shop

## Odchylky od planu

- Model prejmenovano z `Return` na `ReturnRequest` (JS reserved keyword)
- guestToken pole v Order uz existoval od jineho agenta (P0-10)

## Overeni

- [x] Model `ReturnRequest` existuje, migrace prosla
- [x] Build prochazi (305 stranek)
- [x] Unit testy prochazi (141/141)
- [x] Stranky vraceni a reklamace se renderuji
- [x] Tlacitka na moje-objednavky se zobrazi jen u DELIVERED
- [x] Odkaz na /reklamacni-rad pritomen
