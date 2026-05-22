# Implementace: Admin + Manager ucty a dashboard

**Task:** #48
**Status:** HOTOVO
**Date:** 2026-04-12
**Commits:** 3fecb20 (sidebar), b235c67 (accounts + API access)

---

## Realne ucty (HESLA — SMAZAT PO PREDANI)

| Email | Role | Heslo |
|-------|------|-------|
| jevgenij@carmakler.cz | ADMIN | `Xk9$mPw2vR4nQz` |
| radim@carmakler.cz | ADMIN | `Ht7#jLs5bN8wYx` |
| katerina@carmakler.cz | MANAGER | `Rf3&kWp6dM2cJv` |

> Ucty jsou v seed.ts s bcrypt hashovanym heslem. Po prvnim prihlaseni doporucuji zmenit heslo.

---

## Prava MANAGER vs ADMIN

### MANAGER MUZE:
- Videt vse v admin panelu (Dashboard, Vozidla, Inzerce, Makleri, Leady, Partneri, Eshop, Finance, Marketplace)
- Schvalovat/zamitnout vozidla, inzeraty
- Moderovat inzeraty (approve/reject)
- Spravovat feeds (cist, editovat, importovat)
- Cist provize, faktury, reklamace
- Cist historii provizi partneru

### MANAGER NEMUZE:
- Mazat data (feed DELETE = 403, UI tlacitko skryte)
- Delat refundy (returns PUT = ADMIN/BACKOFFICE only)
- Menit provizni sazby partneru (canEditCommission = ADMIN/BACKOFFICE only)
- Posilat verifikacni emaily (send-verification-emails = ADMIN only)

---

## Zmeny v API routes (14 souboru)

| Route | Metoda | MANAGER pristup |
|-------|--------|-----------------|
| `/api/admin/vehicles` | GET | YES |
| `/api/admin/vehicles/[id]/approve` | POST | YES |
| `/api/admin/listings` | GET | YES |
| `/api/admin/listings/[id]` | GET, PATCH | YES |
| `/api/admin/listings/flagged` | GET | YES |
| `/api/admin/listings/[id]/moderate` | PATCH | YES |
| `/api/admin/feeds` | GET, POST | YES |
| `/api/admin/feeds/[id]` | GET, PATCH | YES |
| `/api/admin/feeds/[id]` | **DELETE** | **NO (ADMIN only)** |
| `/api/admin/feeds/[id]/logs` | GET | YES |
| `/api/admin/feeds/[id]/import` | POST | YES |
| `/api/admin/feeds/suppliers` | GET | YES |
| `/api/admin/returns/[id]` | GET | YES |
| `/api/admin/returns/[id]` | **PUT (refund)** | **NO (ADMIN only)** |
| `/api/admin/reports/commission-summary` | GET | YES |
| `/api/admin/partners/[id]/commission` | **PATCH** | **NO (ADMIN only)** |
| `/api/admin/partners/[id]/commission/history` | GET | YES |
| `/api/admin/send-verification-emails` | POST | **NO (ADMIN only)** |

---

## AdminSidebar zmeny (commit 3fecb20)

MANAGER + REGIONAL_DIRECTOR nyni vidi VSECHNY sekce:
- HLAVNI (Dashboard, Vozidla, Inzerce, Makleri, Leady)
- MANAZER (Muj tym, Moji makleri, Schvalovani, Bonusy)
- PARTNERI, ESHOP, FINANCE, MARKETPLACE

Role labels opraveny pro vsechny 4 admin role.

---

## Chybejici admin stranky (GAP analyza)

| Priorita | Stranka | Popis |
|----------|---------|-------|
| VYSOKA | `/admin/users` | Sprava uzivatelu, roli, opravneni |
| VYSOKA | `/admin/orders` | Objednavky eshop dilu |
| STREDNI | `/admin/parts` | Katalog dilu |
| STREDNI | `/admin/marketplace/dealers` | Verifikace dealeru |
| STREDNI | `/admin/marketplace/investors` | Verifikace investoru |
| NIZKA | `/admin/settings` | Systemove nastaveni |

---

## Build

- `npm run build` — PASS
- TypeScript errors: **0**
