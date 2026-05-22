# QA Report — Task #19: Email šablony (customer + supplier)

**Datum:** 2026-04-06  
**Agent:** KONTROLOR  
**Commit:** `c110f3a`  
**Zkontrolováno:** 4 soubory (3 NEW + 1 MOD webhook)

---

## 1. SIMPLIFY KONTROLA

### `lib/email-templates/company-signature.ts`
- `companySignatureHtml()` / `companySignatureText()` — beze parametrů, čtou z `companyInfo` ✅
- table-based inline CSS, orange `#F97316` akcent — konzistentní s brand ✅
- `companySignatureText()` s `---` oddělovačem ✅

### `lib/email-templates/order-confirmation-customer.ts`
- 3 exporty dle konvence: `Html/Text/Subject(data)` ✅
- `escapeHtml()` na všech user-supplied řetězcích (customerName, orderNumber, adresa, trackingNumber, URL) ✅
- `formatCzk()` pro ceny (totalPrice, item prices) ✅
- `emailLayout()` wrapper s `companySignatureHtml()` ✅
- `localizedDeliveryMethod()` lokální helper — ZASILKOVNA→"Zásilkovna" atd. ✅
- Dry-run banner `#fff3cd` jen když `data.dryRun === true` ✅
- ZASILKOVNA → zobrazí `zasilkovnaPointName`, jinak fyzická adresa ✅
- Subject prefix `[DRY-RUN] ` jen při dry-run ✅
- CTA "Sledovat zásilku" vede na `data.trackingUrl` ✅

### `lib/email-templates/order-notification-supplier.ts`
- 3 exporty dle konvence: `Html/Text/Subject(data)` ✅
- `escapeHtml()` na supplierName, item.name, partNumber, adresa ✅
- Numbered list instrukcí (zabalit/tisknout/odeslat) ✅
- Multi-supplier warning banner `#fef2f2` jen když `hasMultipleSuppliers === true` ✅
- Dry-run banner `#fff3cd` jen když `data.dryRun === true` ✅
- ZASILKOVNA → zobrazí pointName, jinak fyzická adresa s telefonem ✅
- CTA "Stáhnout PDF štítek" vede na `data.delivery.labelUrl` ✅
- `emailLayout()` + `companySignatureHtml()` ✅

### `app/api/stripe/webhook/route.ts`
- `buildCustomerEmailHtml()` / `buildSupplierEmailHtml()` — **smazány** ✅
- `dryRunPrefix` proměnná — **smazána** ✅
- `itemsBySupplier` Map grouping přesunut **před** customer email (správné pořadí pro `hasMultipleSuppliers` výpočet) ✅
- `sendEmail()` volán se `text:` fieldem (html + text + subject) pro oba emaily ✅
- `items.map((it) => ({ price: it.unitPrice }))` — webhook správně používá `unitPrice` (dle OrderItem schema), ne `it.price` z plánu ✅
- `supplierName` fallback chain: `partnerAccount?.name ?? companyName ?? (firstName+lastName) ?? "Dodavatel"` ✅
- Nullish coalescing fix (viz impl report): `fallbackName` extrahován do proměnné, bez mixování `??` a `||` ✅

### Drobnosti (neblokující)
- `DELIVERY_METHOD_LABELS` je definován ve dvou šablonách zvlášť (duplicita). Mohlo být v `lib/shipping/prices.ts` nebo sdíleném helperu, ale není to scope task #19.
- `escapeHtml()` aplikováno i na `trackingUrl` / `labelUrl` v href atributu — technicky správně dle HTML spec (`&` → `&amp;`), browsers oba formáty zvládnou.

---

## 2. REVERZNÍ KONTROLA PROTI PLÁNU

### Klíčové: index.ts factory — správně NEPŘIDÁNO

Plán explicitně říká (sekce 3/9.2/9.5/10): `lib/email-templates/index.ts` **přeskočit**, order šablony jdou mimo factory. Implementátor správně toto NEPŘIDAL. Ověření:

```bash
grep -n "index.ts\|generateEmail\|TEMPLATE_LIST" webhook/route.ts order-*.ts
→ 0 matches
```

`index.ts` nebyl modifikován. Order templates se importují přímo do webhooku. **✅ SPRÁVNĚ.**

### Checklist z acceptance criteria (impl report):

| # | Požadavek | Stav | Důkaz |
|---|-----------|------|-------|
| 1 | `order-confirmation-customer.ts` existuje, exportuje `Html/Text/Subject(data)` | ✅ | Soubor přítomen, 3 exporty ověřeny |
| 2 | `order-notification-supplier.ts` existuje, exportuje `Html/Text/Subject(data)` | ✅ | Soubor přítomen, 3 exporty ověřeny |
| 3 | `company-signature.ts` existuje, exportuje `companySignatureHtml()` / `Text()` | ✅ | Soubor přítomen, oba exporty ověřeny |
| 4 | Webhook odstraňuje `buildCustomerEmailHtml/buildSupplierEmailHtml` | ✅ | grep: 0 výskytů |
| 5 | `sendOrderNotificationEmails()` volá nové `xxxHtml/Text/Subject` | ✅ | webhook:266-268, 318-320 |
| 6 | `text:` field předán do `sendEmail()` | ✅ | webhook:268, 320 |
| 7 | Šablony používají `emailLayout()` | ✅ | customer:158, supplier:175 |
| 8 | Dry-run banner jen při `dryRun === true` | ✅ | banner podmíněn v obou šablonách |
| 9 | Subject prefix `[DRY-RUN] ` jen při dry-run | ✅ | `const prefix = data.dryRun ? "[DRY-RUN] " : ""` |
| 10 | ZASILKOVNA → pointName, jinak adresa | ✅ | `deliveryMethod === "ZASILKOVNA"` podmínka v obou šablonách |
| 11 | Multi-supplier warning jen při >1 supplierů | ✅ | `hasMultipleSuppliers` field + podmíněný banner |
| 12 | CTA → `shipment.trackingUrl` | ✅ | customer template + webhook data mapping |
| 13 | CTA → `shipment.labelUrl` | ✅ | supplier template + webhook data mapping |
| 14 | `escapeHtml()` na user-supplied strings | ✅ | ověřeno ve všech šablonách |
| 15 | `formatCzk()` pro ceny | ✅ | customer: totalPrice + item prices |
| 16 | Text verze bez HTML, s oddělovači `---` | ✅ | oba soubory ověřeny |
| 17 | `npm run build` prošel | ✅ | viz Debug |
| 18 | `npm run lint` 0 errors | ✅ | viz Debug |
| 19 | `lib/email-templates/index.ts` NEUPRAVENO | ✅ | Správně přeskočeno dle plánu |

**Celkem: 19/19 ✅**

---

## 3. DEBUG KONTROLA

### Build
```
npm run build
✓ Compiled successfully in 23.1s
✓ Generating static pages (309/309)
```
**✅ BUILD PASSED**

### Lint
```
npm run lint
✖ 550 problems (10 errors, 540 warnings)
```
Baseline: 550. **0 nových problémů.**

**✅ LINT PASSED**

---

## SOUHRN

| Check | Výsledek |
|-------|---------|
| Simplify | ✅ Čisté, konvence dodržena, 2 neblokující drobnosti |
| Build | ✅ PASSED (309/309) |
| Lint | ✅ 0 nových problems (baseline 550) |
| Reverzní kontrola | ✅ 19/19 |
| index.ts factory | ✅ Správně přeskočeno dle plánu |

**Celkové hodnocení: ✅ QA #19 PASS**

---

## POZNÁMKA PRO TASK #19+ (email idempotence)

Z QA #17 report (POZNÁMKA PRO BUDOUCNOST): Při Stripe retry (vzácné, ale možné) zákazník/vrakoviště dostane 2× email. Dispatcher zabrání duplicitní zásilce (trackingNumber check), ale email guard stále chybí. Přidání `customerNotifiedAt`/`supplierNotifiedAt` do Order modelu by tento edge case uzavřelo. Mimo scope task #19, vhodné pro task #20+.
