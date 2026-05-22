# EVŽEN — Kontrola P0-1: Admin reklamace UI (commit 88f3262)

**Datum:** 2026-04-13 (revize 2)
**Kontrolor:** Evžen THE KING
**Commit:** 88f3262
**Zadání:** TASK-QUEUE.md, sekce D (řádky 2293–2326) + admin správa objednávek (řádky 1955–1959)

---

## 1. Srovnání: ZADANÝ MODEL vs IMPLEMENTOVANÝ MODEL

### Zadání specifikuje (řádky 2306–2326):

```prisma
model Return {
  subOrderId  String           ← vazba na SubOrder
  type        ReturnType       ← WITHDRAWAL | COMPLAINT
  rmaNumber   String @unique   ← unikátní RMA číslo
  status      ReturnStatus     ← REQUESTED → SHIPPED_BACK → RECEIVED → APPROVED → REFUNDED | REJECTED
  refundAmount Int?
  resolution  String?
  resolvedAt  DateTime?
}
```

### Implementace (prisma/schema.prisma:1098–1146):

```prisma
model ReturnRequest {
  orderId          String        ← vazba na Order (NE SubOrder)
  type             String        ← WITHDRAWAL | WARRANTY (NE COMPLAINT)
  items            String        ← JSON array (navíc oproti zadání — lepší)
  reason, defectDesc, photos     ← (navíc — lepší)
  contactName/Email/Phone        ← (navíc — lepší)
  bankAccount      String?       ← (navíc — potřebné pro refund)
  requestedAmount  Int           ← (místo refundAmount)
  approvedAmount   Int?          ← (navíc — lepší, odděluje požadované vs schválené)
  status           String        ← NEW → RECEIVED → IN_REVIEW → APPROVED → REFUNDED/PARTIALLY_REFUNDED | REJECTED | CANCELLED
  rejectionReason  String?       ← (navíc — lepší)
  deadlineAt       DateTime?     ← 30 dní dle §19/3 ZOS (navíc — lepší)
  adminNotes       String?       ← (navíc — lepší)
  ❌ rmaNumber     CHYBÍ
  ❌ resolution    CHYBÍ
  ❌ resolvedAt    CHYBÍ (jen refundedAt)
}
```

---

## 2. Bod po bodu: ZADÁNÍ vs IMPLEMENTACE

### Sekce D — Vrácení a reklamace (řádky 2293–2304)

| # | Zadání (doslovně) | Implementováno? | Kde | Poznámka |
|---|-------------------|----------------|-----|----------|
| D1 | "Odstoupení od smlouvy (14 dní): zákonný nárok u distančního prodeje" | ✅ | Typ WITHDRAWAL | — |
| D2 | "Platí jen pro díly s doručením (ne osobní odběr)" | ⚠️ ČÁSTEČNĚ | API `orders/[id]/returns/route.ts:31` checkuje `DELIVERED`, ale NE delivery method | API zkontroluje status=DELIVERED, ale nezjišťuje jestli to byl osobní odběr vs doručení |
| D3 | "Použité díly: vracení pokud nebyl namontován/změněn" | ❌ CHYBÍ | — | Žádná kontrola v UI ani API |
| D4 | "Náklady na zpětné zaslání nese zákazník" | ⚠️ JEN TEXT | — | Informace by měla být v UI formuláři, ale nikde se nezobrazuje |
| D5 | "Flow: zákazník klikne 'Chci vrátit'" | ✅ | `shop/moje-objednavky/[id]/vraceni/page.tsx` | Zákaznická stránka existuje |
| D6 | "→ vybere důvod" | ✅ | Formulář s textarea (reason) | — |
| D7 | "→ systém generuje RMA číslo" | ❌ CHYBÍ | — | Model nemá pole `rmaNumber`, API negeneruje žádný identifikátor. Zákazník nemá referenci pro zpětné odeslání |
| D8 | "→ zákazník odešle zpět" | ❌ CHYBÍ | — | Status `SHIPPED_BACK` ze zadání neexistuje. Žádný tracking zpětné zásilky |
| D9 | "→ dodavatel zkontroluje" | ⚠️ ČÁSTEČNĚ | Admin detail | Admin může posoudit (IN_REVIEW), ale **dodavatel** nemá žádný přístup k reklamacím |
| D10 | "→ schválí → Stripe refund" | ⚠️ ČÁSTEČNĚ | Status APPROVED→REFUNDED | Status flow existuje, ale refund je jen manuální změna statusu — ŽÁDNÉ Stripe refund API volání |
| D11 | "Reklamace (12-24 měsíců záruky)" | ✅ | Typ WARRANTY | — |
| D12 | "Nové díly: 24 měsíců / Použité díly: 12 měsíců" | ❌ CHYBÍ | — | API nekontroluje záruční dobu podle typu dílu |
| D13 | "Flow: fotky závady + popis" | ✅ | `reklamace/page.tsx` + `defectDesc`, `photos` | Upload na Cloudinary, preview v admin |
| D14 | "dodavatel + Carmakler BackOffice řeší" | ⚠️ ČÁSTEČNĚ | Admin řeší | BackOffice ano, ale **dodavatel nemá** přístup k reklamacím (partner portál nemá route) |
| D15 | "30 dní na vyřízení" | ✅ | `deadlineAt` + overdue warning | API auto-nastaví +30 dní, admin vidí lhůtu + varování |

### Sekce D — Zadaný model (řádky 2306–2326)

| # | Pole ze zadání | Implementováno? | Poznámka |
|---|---------------|----------------|----------|
| M1 | `subOrderId → SubOrder` | ❌ ZMĚNĚNO | `orderId → Order`. SubOrder model v schema NEEXISTUJE vůbec. To je OK — split objednávky nebyl implementován, return je na Order úrovni |
| M2 | `type: WITHDRAWAL \| COMPLAINT` | ⚠️ PŘEJMENOVÁNO | COMPLAINT → WARRANTY. Lepší název, ale odlišný od zadání |
| M3 | `rmaNumber: String @unique` | ❌ CHYBÍ | Klíčový gap — zákazník nemá referenci |
| M4 | `status: REQUESTED → SHIPPED_BACK → RECEIVED → APPROVED → REFUNDED \| REJECTED` | ⚠️ ZMĚNĚNO | Implementace: NEW → RECEIVED → IN_REVIEW → APPROVED → REFUNDED/PARTIALLY_REFUNDED/REJECTED/CANCELLED. Chybí `SHIPPED_BACK` krok |
| M5 | `refundAmount` | ⚠️ ZMĚNĚNO | Rozděleno na `requestedAmount` + `approvedAmount` — lepší |
| M6 | `resolution: String?` | ❌ CHYBÍ | — |
| M7 | `resolvedAt: DateTime?` | ⚠️ ČÁSTEČNĚ | Pouze `refundedAt` (jen pro refund, ne pro rejection) |

---

## 3. Admin UI — detail kontroly

### Admin list (`/admin/returns`)

| Prvek | Status |
|-------|--------|
| Tabulka s reklamacemi | ✅ |
| Filtr: fulltext search (číslo, jméno, email) | ✅ |
| Filtr: typ (WITHDRAWAL/WARRANTY) | ✅ |
| Filtr: status | ✅ |
| Filtr: date range | ❌ CHYBÍ (task #14) |
| Paginace | ✅ |
| Overdue warning | ✅ |
| Odkaz na detail | ✅ |

### Admin detail (`/admin/returns/[id]`)

| Prvek | Status | Poznámka |
|-------|--------|----------|
| Základní údaje (typ, objednávka, částky, data) | ✅ | |
| Důvod + popis závady | ✅ | |
| Fotky závady | ✅ | Galerie s odkazy |
| Kontakt (jméno, email, telefon, banka) | ✅ | |
| Položky k vrácení | ✅ | Ale zobrazují jen quantity+reason, NE název dílu |
| Objednávka summary | ✅ | |
| Změna statusu | ✅ | Dropdown se všemi stavy |
| Schválená částka | ✅ | Input s max limitem |
| Důvod zamítnutí | ✅ | Zobrazí se při REJECTED |
| Interní poznámky | ✅ | |
| Uložit změny | ✅ | Jen ADMIN/BACKOFFICE |
| Odkaz na detail objednávky | ⚠️ | Link vede na `/admin/orders` (list), ne `/admin/orders/[id]` |
| Stripe refund tlačítko | ❌ CHYBÍ | Zadání říká "Stripe refund", admin jen mění status |

### Navigace (AdminSidebar)

| Prvek | Status |
|-------|--------|
| "Reklamace" pod ESHOP sekcí | ✅ |
| Ikona 🔄 | ✅ |
| Viditelné pro ADMIN/BACKOFFICE/MANAGER | ✅ |

### Loading/error boundaries

| Prvek | Status |
|-------|--------|
| `loading.tsx` — skeleton | ✅ |
| `error.tsx` — error boundary s retry | ✅ |

### API

| Endpoint | Status | Poznámka |
|----------|--------|----------|
| GET `/api/admin/returns` | ✅ | Filtr, search, paginace, Zod-free ale OK |
| GET `/api/admin/returns/[id]` | ✅ | Detail s order + items |
| PUT `/api/admin/returns/[id]` | ✅ | Zod validace, role check ADMIN/BACKOFFICE |
| POST `/api/orders/[id]/returns` | ✅ | Zákaznický endpoint — NE součástí P0-1 ale existuje |

---

## 4. CELKOVÝ VÝSLEDEK

### ✅ CO JE SPRÁVNĚ (odpovídá zadání nebo je LEPŠÍ)
- Oba typy reklamací (WITHDRAWAL + WARRANTY)
- Zákaznický flow existuje (formulář pro vrácení + reklamaci)
- Admin list s filtry + paginací + overdue warning
- Admin detail se všemi potřebnými údaji
- Status management s granulárními stavy
- Oddělení requestedAmount / approvedAmount (lepší než zadání)
- 30denní lhůta s varováním (zákon §19/3 ZOS)
- Fotky závady + upload na Cloudinary
- Rejection reason + admin notes (navíc, praktické)
- PARTIALLY_REFUNDED + CANCELLED stavy (navíc, praktické)
- Zod validace na PUT
- Role checks (read: ADMIN/BACKOFFICE/MANAGER, write: ADMIN/BACKOFFICE)

### ❌ CO CHYBÍ (gapy oproti zadání)

| # | Gap | Závažnost | Doporučení |
|---|-----|-----------|------------|
| G1 | **RMA číslo** — zadání explicitně říká `rmaNumber: String @unique`, chybí v modelu i UI | **STŘEDNÍ** | Přidat pole do Prisma modelu, generovat při vytvoření (např. `RMA-2026-00001`), zobrazit zákazníkovi |
| G2 | **Status SHIPPED_BACK** — zadání definuje krok "zákazník odešle zpět", v implementaci chybí | **STŘEDNÍ** | Přidat stav do flow, zákazník zadá tracking zpětné zásilky |
| G3 | **Stripe refund** — zadání říká "Stripe refund", implementace jen mění status | **STŘEDNÍ** | Volat Stripe Refund API při statusu REFUNDED (pokud paymentMethod=CARD) |
| G4 | **Dodavatel nemá přístup** — zadání říká "dodavatel zkontroluje + dodavatel + Carmakler BackOffice řeší" | **STŘEDNÍ** | Partner portál nemá route pro reklamace svých dílů |
| G5 | **Osobní odběr check** — zadání říká "platí jen pro díly s doručením (ne osobní odběr)" | **NÍZKÁ** | API nekontroluje delivery method při WITHDRAWAL |
| G6 | **Záruční doba validace** — zadání říká "nové 24m, použité 12m" | **NÍZKÁ** | API nekontroluje jestli je reklamace v záruční době |
| G7 | **Date range filtr** v admin | **NÍZKÁ** | Existuje task #14 |
| G8 | **resolution + resolvedAt** pole — ze zadaného modelu | **NÍZKÁ** | `rejectionReason` + `refundedAt` částečně pokrývají |

### ⚠️ ODCHYLKY OD ZADÁNÍ (záměrné/přijatelné)

| # | Odchylka | Hodnocení |
|---|----------|-----------|
| O1 | `orderId→Order` místo `subOrderId→SubOrder` | ✅ OK — SubOrder neexistuje v projektu |
| O2 | `WARRANTY` místo `COMPLAINT` | ✅ OK — lepší název |
| O3 | `requestedAmount` + `approvedAmount` místo `refundAmount` | ✅ OK — granulárnější |
| O4 | Přidáno: `items`, `contactInfo`, `bankAccount`, `adminNotes`, `deadlineAt` | ✅ OK — praktická vylepšení |
| O5 | Přidáno: stavy IN_REVIEW, PARTIALLY_REFUNDED, CANCELLED | ✅ OK — reálné potřeby |

---

## 5. VERDIKT

### ⚠️ SCHVÁLENO S VÝHRADAMI — 4 STŘEDNÍ gapy vyžadují follow-up

**V rámci P0-1 scope** (admin UI pro správu reklamací) je implementace **funkční a použitelná**. Admin vidí reklamace, může filtrovat, měnit status, schvalovat/zamítat, přidávat poznámky.

**ALE** oproti DOSLOVNÉMU zadání TASK-020 sekce D chybí:
1. **RMA číslo** (zákazník nemá referenci) — G1
2. **SHIPPED_BACK krok** (chybí tracking zpětné zásilky) — G2
3. **Stripe refund integrace** (jen manuální status change) — G3
4. **Dodavatel přístup** k reklamacím svých dílů — G4

Tyto 4 gapy jsou follow-up tasky, neblokují nasazení admin UI.

---

*Kontroloval: Evžen THE KING | 2026-04-13 | Revize 2 — důkladná kontrola oproti doslovnému zadání*
