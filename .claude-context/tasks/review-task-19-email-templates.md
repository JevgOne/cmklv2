# Review task #19 — Email templates (customer + supplier)

**Datum:** 2026-04-06
**Reviewer:** Evžen THE KING
**Task:** #36 — review task #19 proti doslovnému zadání
**Commit:** `c110f3a`

---

## 1. ZADÁNÍ OD UŽIVATELE (literal)

Task #19 je součást shipping+email pipeline #15-#20 pod zadáním:

> "nainstaluj tam do toho **stripe pay**, zasilkovnu, DPD a všechny tyhle dopravce **konkretne jenom do ESHOPU**"

a

> "**stripe + dopraci musí být jenom u shopu**"

Email notifikace jsou součást shop checkout flow — spouštěné Stripe webhookem po `checkout.session.completed`.

**Konkrétně pro #19 se jednalo o REÁLNÉ šablony (ne placeholdery) pro:**
1. **Customer** — potvrzení objednávky po úspěšné platbě + tracking link
2. **Supplier (vrakoviště)** — notifikace s číslem objednávky, seznamem dílů a pokynem "vytiskni štítek + pošli"

---

## 2. OVĚŘENÍ 4 POŽADAVKŮ OD TEAM-LEADA

### Bod 1 — Implementace odpovídá záměru (customer + supplier po Stripe platbě) → ✅ SPLNĚNO

**Důkaz 1 — trigger flow:** `app/api/stripe/webhook/route.ts:47-48` handler `checkout.session.completed` volá `sendOrderNotificationEmails(orderId, shipment)`. Šablony běží **výhradně** jako důsledek úspěšné Stripe platby.

**Důkaz 2 — oba emaily v jediné funkci:** `webhook/route.ts:196-323` — `sendOrderNotificationEmails()` posílá:
- **(A) Customer mail** (ř. 238-269) — `order.deliveryEmail` → `orderConfirmationCustomerHtml/Text/Subject`
- **(B) Supplier mail(y)** (ř. 272-322) — loop `for (const [supplierId, supplierItems] of itemsBySupplier)` → `supplier.partnerAccount?.email ?? supplier.email` → `orderNotificationSupplierHtml/Text/Subject`

**Důkaz 3 — obsah customer emailu:**
- Pozdrav `Dobrý den ${customerName}`
- Číslo objednávky, celková cena, způsob dopravy, tracking číslo
- Sekce položek (tabulka s unit price)
- Doručovací sekce — ZASILKOVNA → `zasilkovnaPointName`, jinak fyzická adresa
- CTA "Sledovat zásilku" → `shipment.trackingUrl`

**Důkaz 4 — obsah supplier emailu:**
- Pozdrav `Dobrý den ${supplierName}` (fallback chain `partnerAccount.name → companyName → firstName+lastName → "Dodavatel"`)
- Numbered list instrukcí: 1) zabalit, 2) vytisknout štítek, 3) předat dopravci
- Tabulka dílů (název / part number / ks)
- Doručovací adresa zákazníka nebo Zásilkovna point
- CTA **"Stáhnout PDF štítek"** → `shipment.labelUrl` ← přesně to co uživatel chtěl ("pokyn co poslat")
- Multi-supplier warning banner (červený `#fef2f2`) pokud `hasMultipleSuppliers === true`

**Literal match s uživatelským záměrem:** ✅ Customer dostane tracking + shrnutí, supplier dostane pokyn "vytiskni štítek, zabal, odešli" s číslem objednávky a doručovací adresou. Přesně jak uživatel popsal.

### Bod 2 — Design dodržuje Carmakler brand (orange #F97316 + Outfit) → ✅ SPLNĚNO

**Důkaz 1 — orange jako primary CTA + akcenty:**
- Customer CTA "Sledovat zásilku": `background: #F97316; color: #ffffff` (`order-confirmation-customer.ts:147`)
- Supplier CTA "Stáhnout PDF štítek": `background: #F97316; color: #ffffff` (`order-notification-supplier.ts:164`)
- Zvýrazněná `totalPrice` v customer emailu: `color: #F97316; font-weight: 700` (`order-confirmation-customer.ts:114`)
- Contact email link: `color: #F97316` (`order-confirmation-customer.ts:154`, `order-notification-supplier.ts:171`)
- Company signature odkazy: `color: #F97316` (`company-signature.ts:24, 29`)

**Důkaz 2 — Outfit font:**
Šablony volají `emailLayout()` → `emailLayoutHTML()` z `lib/brand-styles.ts:223` který obsahuje:
- `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap')` (ř. 38)
- `font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` (ř. 23)

Šablony tedy automaticky dědí brand wrapper (orange header, Outfit font, 600px responsive container).

**Důkaz 3 — konzistence s design systémem:**
- Border-radius `6-8px` na všech card/CTA elementech
- Padding `12-24px`
- Heading hierarchie: `<h1>` 24px, `<h2>` 16px
- Gray palette pro text: `#111827` (text-gray-900), `#374151` (text-gray-700), `#6b7280` (text-gray-500)
- Card background: `#f9fafb` (bg-gray-50) — matchuje Tailwind design systém z webu

**Dry-run banner** (`#fff3cd` / `#78350f`) a **multi-supplier warning** (`#fef2f2` / `#7f1d1d`) — standardní alert barvy, neporušují brand.

### Bod 3 — Žádné placeholdery, žádné TODO → ✅ SPLNĚNO

**Grep verifikace:**
```
grep -n "TODO|FIXME|placeholder|PLACEHOLDER|XXX" lib/email-templates/order-*.ts lib/email-templates/company-signature.ts
→ 0 matches
```

**Pozitivní důkaz kompletnosti:**
- Všechna data jsou dynamicky mapována z `order` + `shipment` structure
- `escapeHtml()` aplikován na všechny user-supplied stringy (customerName, supplierName, partName, adresa, trackingNumber, labelUrl)
- `formatCzk()` pro všechny ceny
- Text verze (multipart) implementována plně paralelně k HTML — ne zkrácený placeholder
- Company signature s reálnými daty z `@/lib/company-info` (legalName, adresa, kontakt, web)
- Žádný hardcoded "Lorem ipsum" nebo fake data

**Odstranění inline placeholderů z #17:**
Webhook před task #19 obsahoval inline `buildCustomerEmailHtml()` / `buildSupplierEmailHtml()` (~160 řádků placeholder HTML). Ty byly **kompletně odstraněny** z `webhook/route.ts` v rámci #19. Grep potvrdil `0` výskytů v codebase.

### Bod 4 — Deviation od team-lead pokynu (SKIP `index.ts` factory) → ✅ OPODSTATNĚNÁ

**Team-lead ve feedbacku k #19 požadoval:** přidat order šablony do `generateEmail()` factory + `TEMPLATE_LIST` v `lib/email-templates/index.ts`.

**Implementátor to NEUDĚLAL.** Ověřil jsem v kódu:
- `lib/email-templates/index.ts` **nemá** importy order-confirmation-customer ani order-notification-supplier (grep `orderConfirmationCustomer` → 0 matches v index.ts, match jen v webhook + template soubory samotné)
- `TEMPLATE_LIST` obsahuje pouze 7 broker šablon (PRESENTATION, CONTRACT_OFFER, FOLLOWUP, INSURANCE, FINANCING, PRICE_CHANGE, VEHICLE_SOLD) — order šablony tam NEJSOU
- `generateEmail()` signature stále `(templateType, broker: BrokerSignatureData, params)` — `broker` je **non-nullable**, switch case neobsahuje order cases

**Proč je to opodstatněné — technická analýza:**

1. **`generateEmail()` API je navržené pro broker flow.** Druhý argument `broker: BrokerSignatureData` je povinný a šablony uvnitř používají `generateSignatureHtml(data.broker)`. Order emails **nemají přiděleného brokera** — customer objednává díly, vrakoviště je dodává. Broker je v této flow úplně cizí koncept.

2. **Rozšíření factory na nullable broker by vyžadovalo refactor 11+ existujících broker šablon.** Plán sekce 12.5-12.7 popisuje co by bylo potřeba: změnit signature na `broker: BrokerSignatureData | null`, přidat `requireBroker()` guard na začátek každého broker case, auditovat všechna volací místa, riziko regrese v broker email flow. Pro task #19 (scope: 2 order šablony) je to **out of scope rizikový refactor**.

3. **Plán explicitně říká SKIP** na 4 místech (sekce 3 bod 5, sekce 9.2, sekce 9.5, sekce 10 "Co NEDĚLAT"). Sekce 12 byla pozdější team-lead update, která toto rozhodnutí reverzovala. Implementátor musel vybrat jednu variantu a zvolil původní plán.

4. **Order emails jsou plně automatizované (webhook-driven), ne broker UI-driven.** Admin/broker je neodesílá ručně přes `/admin/emails/*` UI. Jejich umístění v `TEMPLATE_LIST` by znamenalo že budou **viditelné v admin UI** pro ruční odesílání, což nedává smysl (chybí by `orderData`, order by neexistoval).

5. **Kontrolor to potvrdil jako správný postup.** QA report (`qa-task-19-email-templates.md:55-64`) explicitně: *"index.ts factory — správně NEPŘIDÁNO... Plán explicitně říká sekce 3/9.2/9.5/10: lib/email-templates/index.ts **přeskočit**... `index.ts` nebyl modifikován. Order templates se importují přímo do webhooku. **✅ SPRÁVNĚ.**"*

**Dopad deviation:** Žádný pro uživatele. Emails fungují identicky. Factory integrace by byla čistě architektonickou konzistencí — pokud ji team-lead chce, měl by existovat **samostatný task** na factory refactor (které by správně audit 11 broker call sitů + týmová diskuse o API změně).

---

## 3. SCOPE AUDIT — "stripe+dopravci JEN u shopu"

**Grep použití order šablon napříč codebase:**

| Template | Volací místo | Scope |
|----------|--------------|-------|
| `orderConfirmationCustomer*` | `app/api/stripe/webhook/route.ts` (eshop Stripe webhook) | ✅ eshop |
| `orderNotificationSupplier*` | `app/api/stripe/webhook/route.ts` (eshop Stripe webhook) | ✅ eshop |
| `companySignatureHtml/Text` | `order-confirmation-customer.ts` + `order-notification-supplier.ts` (interní) | ✅ lib-internal |

**Ověření zero leak do jiných produktů:**

| Produkt | Grep výsledek | Stav |
|---------|---------------|------|
| `app/(web)/marketplace/**` | 0 matches | ✅ |
| `app/(web)/inzerat/**` | 0 matches | ✅ |
| `app/(pwa)/makler/**` | 0 matches | ✅ |
| `app/(pwa-parts)/**` | 0 matches | ✅ |
| `app/(admin)/**` | 0 matches | ✅ |
| `app/(partner)/**` | 0 matches | ✅ |
| CEBIA / inzerce Stripe flow | 0 matches | ✅ |

Order šablony jsou volané **výhradně** z eshop Stripe webhooku. Scope dodržen.

**Poznámka k `lib/email-templates/` jako sdílené knihovně:** Adresář obsahuje broker šablony (pre-existing) i nové order šablony. Sdílená knihovna neporušuje scope — záleží na **volacích místech**, a ta jsou pouze v eshop kontextu. Kontrolor ve své simplify kontrole (řádek 48 QA reportu) upozornil na duplicitu `DELIVERY_METHOD_LABELS` mezi 2 šablonami (pre-existing mimo scope #19), ale neblokuje.

---

## 4. EXTRA NÁLEZY (mimo 4 body team-leada)

### ✅ Kvalita kódu

- **Escape HTML** na všech user-supplied stringech — ověřeno v obou šablonách, defense-in-depth proti XSS.
- **Unit price fix** — plán navrhoval `it.price`, ale OrderItem schema má `unitPrice`. Implementátor to odhalil a fixnul (`webhook/route.ts:259`). Verified proti `app/api/orders/route.ts` kde se OrderItem vytváří.
- **Nullish coalescing parens** — implementátor narazil na TypeScript build chybu (mixování `??` a `||`) a fixnul přes extraction do proměnné. Čistý fix, ne hack.
- **Fallback chain pro supplierName** — robust: `partnerAccount?.name ?? companyName ?? (firstName + lastName ≠ "" ? fallback : "Dodavatel")`. Pokrývá všechny edge cases (partnerAccount chybí, companyName null, jen firstName, nic).

### ✅ Text verze (multipart)

Obě šablony mají **plnou** text verzi (ne jen HTML stripped). Důležité pro doručitelnost:
- Spam filtry preferují multipart emaily (text + HTML)
- Text verze čitelná v textových klientech + accessibility
- `sendEmail()` z `lib/resend.ts` dostává `text:` field (`webhook/route.ts:268, 320`)

### ✅ Dry-run handling

- Banner HTML `#fff3cd` pouze při `data.dryRun === true`
- Subject prefix `[DRY-RUN] ` pouze při dry-run
- Dry-run flag se propaguje z `shipment.dryRun` (z task #16 BaseCarrierClient fallback)
- Produkční emaily bez dry-run banneru (automatically když jsou API klíče nastavené)

### 🟡 Drobnosti od QA kontrolora (neblokující)

1. **`DELIVERY_METHOD_LABELS` duplicita** — definován zvlášť v obou order šablonách (~12 řádků duplicity). Mohl být v `lib/shipping/prices.ts` jako re-export z `SHIPPING_METHOD_INFO`. Minor DRY issue, pre-existing mimo scope #19.
2. **`escapeHtml()` v href atributech** (`trackingUrl`, `labelUrl`) — technicky správně per HTML spec (`&` → `&amp;`), browsers zvládnou. Defense-in-depth.

### 🟢 Architektonická kvalita

- **3 oddělené funkce Html/Text/Subject** — standardní konvence celého `lib/email-templates/`, ne refactor.
- **`companySignatureHtml/Text` jako paralelní helper** — vyhnul se rozbití existujícího `signature.ts` (BrokerSignatureData). DRY pro budoucí order-related šablony (faktury, refund).
- **Grouping `itemsBySupplier` před customer emailem** — správné pořadí, `hasMultipleSuppliers` se počítá jednou a použije v obou emailech.

---

## 5. KŘÍŽOVÁ KONTROLA S QA REPORTEM

QA report (`qa-task-19-email-templates.md`) deklaruje **19/19 checks PASS**:
- Simplify kontrola čistá
- Build ✅ 309/309
- Lint ✅ baseline 550 (0 nových)
- Reverzní kontrola 19/19 ✅
- `index.ts` factory správně přeskočeno ✅

**Evžen potvrzuje QA správně** — všech 19 kontrol je validních. Nenašel jsem rozpor mezi QA reportem a realitou v kódu.

---

## 6. FINÁLNÍ VERDIKT

| Team-lead bod | Stav | Zdůvodnění |
|---------------|------|------------|
| 1. Implementace odpovídá záměru (customer + supplier po Stripe platbě) | ✅ | `sendOrderNotificationEmails()` volá oba, customer dostane tracking + shrnutí, supplier dostane štítek + pokyny |
| 2. Design dodržuje Carmakler brand (orange #F97316 + Outfit) | ✅ | `emailLayout()` → brand-styles wrapper + inline CTA `#F97316`, totalPrice orange accent |
| 3. Žádné placeholdery, žádné TODO | ✅ | Grep 0 matches, inline helpers z #17 smazány (~160 řádků), text verze plná, reálná data z companyInfo |
| 4. Deviation od team-lead pokynu (SKIP factory) | ✅ | Opodstatněná — plán sekce 3/9.2/9.5/10 SKIP, factory API je broker-only, refactor by byl out-of-scope rizikový. QA kontrolor schválil. |

## ✅ TASK #19 APPROVED

Všechny 4 požadavky z team-leadova zadání splněny literal. Order emails fungují přesně podle uživatelského záměru (Stripe payment → customer potvrzení + supplier pokyn s PDF štítkem), brand dodržen, žádné placeholdery, deviation od `index.ts` factory je technicky opodstatněná a kontrolor ji schválil.

### Doporučení pro deploy
- ✅ Task #19 neblokuje deploy
- ✅ Task #30 (marketplace gating fix) už APPROVED — předchozí deploy blocker odstraněn
- ⚠️ Připomínka: `DELIVERY_METHOD_LABELS` duplicita — kosmetické, pre-existing, mimo scope #19
- ℹ️ **Follow-up úvaha pro team-leada:** Pokud skutečně chce order šablony ve `generateEmail()` factory, vytvořit samostatný task pro **factory refactor** (broker signature na nullable, audit 11 broker call sitů, update admin email UI). Není to blocker, je to čistě architektonická konzistence.
- ℹ️ **Future edge case** (z QA #17 poznámky): Email idempotence — při Stripe retry může customer/vrakoviště dostat 2× email. Dispatcher chrání před duplicitní zásilkou (trackingNumber check), ale email guard chybí. Vhodné jako samostatný task — přidat `customerNotifiedAt` / `supplierNotifiedAt` do Order modelu.

---

**Evžen THE KING — review task #19 hotov, APPROVED.**
