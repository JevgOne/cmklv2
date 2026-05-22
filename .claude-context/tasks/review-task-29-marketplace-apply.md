# Review Task #29 — Marketplace public apply form proti zadání

**Reviewer:** Evžen THE KING (evzen-the-king)
**Datum:** 2026-04-06
**Commit:** `a720f03`
**Task:** #55 (review of impl #45 / plan #29)
**Verdict:** ✅ **APPROVED**

---

## 1. Původní zadání uživatele (doslovné)

> "a tam na marketplaxw bude landing a taky možnoat poslat žadost na to bejt investor nebo realizator"

**Překlad do scope:**
1. Marketplace má veřejnou landing page (už existuje od #29 předchozí fáze)
2. Možnost poslat žádost o přístup jako **investor** NEBO **realizator**
3. Neauthenticated user musí moct žádost poslat

---

## 2. Literal verifikace 6 kritických bodů

### ✅ Bod 1: Žádná skrytá stránka — `/marketplace/apply` dostupná z landing page

**Ověřeno:** `app/(web)/marketplace/page.tsx` obsahuje **5 linků** na `/marketplace/apply`:

| Místo | Řádek | Link | Label |
|-------|-------|------|-------|
| not_authorized Alert | :150 | `/marketplace/apply` | "žádost o rozšíření role" |
| Hero hero CTA #1 | :174 | `/marketplace/apply?role=investor` | "Chci investovat" |
| Hero hero CTA #2 | :179 | `/marketplace/apply?role=dealer` | "Jsem realizátor" |
| Bottom CTA #1 | :365 | `/marketplace/apply?role=investor` | "💰 Chci investovat" |
| Bottom CTA #2 | :370 | `/marketplace/apply?role=dealer` | "🚗 Jsem realizátor" |

Plus: middleware.ts:236,258 přesměrovává neauth user na `/marketplace/apply?reason=auth_required&role=...` — uživatel se k apply formu dostane automaticky při pokusu o /marketplace/dealer nebo /marketplace/investor.

**Stránka NENÍ skrytá.** ✅

### ✅ Bod 2: Žádné zkratky v UI — plné české labely

**Ověřeno:** `components/web/marketplace/ApplyForm.tsx` + `app/(web)/marketplace/apply/page.tsx`:

**Stránka:**
- H1 "Žádost o přístup" (:67)
- Subtitle "Vyberte svou roli a vyplňte kontaktní údaje. Náš tým váš profil ověří a ozve se vám do 48 hodin." (:69-72)
- Breadcrumb "Domů / Marketplace / Žádost o přístup" (:38-42)

**Alerts:**
- auth_required: "Pro přístup musíte být ověřený uživatel" + "Marketplace je VIP platforma pro ověřené dealery a investory. Vyplňte žádost níže a my vás do 48 hodin prověříme." (:50-53)
- not_authorized: "Vaše role nemá přístup k této sekci" + "Pokud máte zájem o investování nebo nabízení flip příležitostí, vyplňte žádost o rozšíření role." (:59-62)

**Role selection (2 buttons):**
- "🚗 Jsem realizátor" + popis "Chci nabízet auta k flipování" (:126-128)
- "💰 Chci investovat" + popis "Chci financovat flipy aut" (:137-139)

**Form fields:**
- "Jméno" (:181)
- "Příjmení" (:187)
- "E-mail" (:194)
- "Telefon" + placeholder "+420 777 123 456" (:201-205)
- "Název firmy" (:212) — jen dealer
- "IČO" + placeholder "12345678" (:218-221) — jen dealer
- "Rozsah plánované investice" (:230) — jen investor
- "— Vyberte rozsah —" default option (:237)
- Ranges: "10 000 – 50 000 Kč", "50 000 – 200 000 Kč", "200 000 – 1 000 000 Kč", "1 000 000+ Kč" (:16-20)
- "Zpráva" + placeholder "Popište své zkušenosti, motivaci a proč chcete přístup k marketplace..." (:248-251)

**GDPR consent (full Czech):**
- "Souhlasím se zpracováním osobních údajů za účelem vyřízení žádosti o přístup k marketplace. Více v zásadách ochrany osobních údajů." (:266-277)

**CTA + states:**
- Submit button: "Odeslat žádost" (:293)
- Loading: "Odesílám..." (:293)
- Link: "Již máte účet? Přihlaste se" (:297-300)
- Back button: "← Změnit roli" (:152)

**Thank-you card:**
- "Žádost odeslána!" (:90)
- "Děkujeme za zájem o CarMakléř marketplace. Váš profil prověříme a ozveme se vám do 48 hodin." (:91-94)
- "Na váš email jsme odeslali potvrzení. Pokud jej nevidíte, zkontrolujte spam." (:95-97)

**Žádné zkratky ani anglicismy v uživatelsky-viditelném textu.** ✅

### ✅ Bod 3: Apply form funguje bez přihlášení (core zadání)

**Ověřeno:** `app/api/marketplace/apply/route.ts`:

```
grep "getServerSession|auth|Session" → 0 matches
```

Imports (řádky 1-16): `NextRequest`, `NextResponse`, `z`, `prisma`, `applySchema`, `rateLimit`, `sendEmail`, 2× email templates. **Žádný auth import.**

Endpoint komentář (řádky 18-21):
```
/*  POST /api/marketplace/apply — Veřejná žádost o přístup              */
/*  (NEautentizované — kdokoli může podat žádost)                       */
```

Page `apply/page.tsx` — server component **bez `auth()` check**, přijímá jen `searchParams`. Kdokoliv může navštívit `/marketplace/apply` a podat žádost.

**Apply form je plně veřejný, žádná session není vyžadována.** ✅

### ✅ Bod 4: Dvě role — INVESTOR + VERIFIED_DEALER

**Ověřeno:** `lib/validators/marketplace.ts:96`:

```typescript
role: z.enum(["VERIFIED_DEALER", "INVESTOR"]),
```

**Role mapping z query parametru** (`apply/page.tsx:28-33`):
- `?role=investor` → `INVESTOR`
- `?role=dealer` → `VERIFIED_DEALER`
- jinak → `null` (user si zvolí sám)

**Conditional fields:**
- VERIFIED_DEALER → `companyName` (povinný) + `ico` (regex `/^\d{8}$/`, povinný) — ApplyForm.tsx:209-225 + validator refine:118
- INVESTOR → `investmentRange` (optional select) — ApplyForm.tsx:227-244

**Role labels v UI:**
- "Jsem realizátor" = VERIFIED_DEALER (konzistentní s product ownership "realizátor" v #29 plan)
- "Chci investovat" = INVESTOR

**FAQ objasnění** (marketplace landing :96-99): "Co je realizátor? — Realizátor je ověřený odborník, který najde vhodné auto, zajistí jeho nákup, opravu a přípravu k prodeji." ✅ Uživatelsky jasné, ne zkratka.

**Dvě role správně implementovány + legal separace fields.** ✅

### ✅ Bod 5: Confirmation email žadateli

**Ověřeno:** `route.ts:149-163`:

```typescript
// 8. Confirmation email žadateli
sendEmail({
  to: data.email,
  subject: marketplaceApplicationConfirmationSubject(),
  html: marketplaceApplicationConfirmationHtml({ firstName, role }),
  text: marketplaceApplicationConfirmationText({ firstName, role }),
}).catch((err) => {
  console.error("[Marketplace Apply] Confirmation email failed:", err);
});
```

Template soubor existuje: `lib/email-templates/marketplace-application-confirmation.ts` — subject + html + text helpery. Direct import pattern (NE factory), konzistentní s #19 pattern.

Fire-and-forget: `.catch(...)` nebloqkuje response — žádost se uloží i když email selže.

**Confirmation email implementován.** ✅

### ✅ Bod 6: Admin dostane notifikaci

**Ověřeno:** `route.ts:102-146` — **dvojitá notifikace**:

**(a) Admin email fire-and-forget** (:128-135):
```typescript
sendEmail({
  to: admins.map((a) => a.email),
  subject: marketplaceApplicationAdminSubject(adminEmailData),
  html: marketplaceApplicationAdminHtml(adminEmailData),
  text: marketplaceApplicationAdminText(adminEmailData),
}).catch((err) => {
  console.error("[Marketplace Apply] Admin email failed:", err);
});
```

Query na řádku 103-106: `findMany({ where: { role: "ADMIN", status: "ACTIVE" } })` — posílá se všem aktivním adminům.

**(b) Admin DB notification** (:138-146):
```typescript
await prisma.notification.createMany({
  data: admins.map((admin) => ({
    userId: admin.id,
    type: "SYSTEM",
    title: `Nová marketplace žádost — ${role === "VERIFIED_DEALER" ? "Realizátor" : "Investor"}`,
    body: `${firstName} ${lastName} (${email}): ${message.slice(0, 120)}...`,
    link: `/admin/marketplace/applications/${applicationId}`,
  })),
});
```

**Dvojitá vrstva:** i když email selže, admin uvidí notifikaci v admin dashboardu. ✅

Admin email template (`marketplace-application-admin.ts`) obsahuje `escapeHtml` na všech user datech (verifikace QA 3.E), subject + html + text + CTA "Otevřít v admin panelu".

**Admin notifikace dvojitě zajištěna.** ✅

---

## 3. Verifikace 6 schválených odchylek

| # | Odchylka | Stav | Důkaz / Opodstatnění |
|---|----------|------|----------------------|
| 1 | Migration drift workaround (Prisma reset blokován searchVector) | ✅ | `migration.sql` obsahuje JEN `CREATE TABLE MarketplaceApplication` + 3 indexy + 2 FK constraints. Žádný drift fix. Follow-up task **#54** vytvořen. Pro DevOps připravený workaround dokumentován v impl reportu. |
| 2 | `MarketplaceRedirectNotice` jako server-side Alert místo client toast | ✅ | `apply/page.tsx:47,56` — 2× `<Alert variant="info|warning">`. Jednodušší než toast, žádná client hydration, plně SSR. Schváleno team-leadem explicitně. |
| 3 | Honeypot field `website` | ✅ | `ApplyForm.tsx:155-177` — `position: absolute; left: -9999px`, `aria-hidden`, `tabIndex={-1}`, `autoComplete="off"`. Server kontrola `route.ts:52-59` vrací **HTTP 200 silent success** (bez DB insertu) — anti-bot pattern. |
| 4 | Rate limit 5 req / 15 min per IP | ✅ | `route.ts:23-24` — `RATE_LIMIT_MAX = 5`, `RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000`. Per-IP přes `x-forwarded-for`. 429 response při překročení. |
| 5 | Investment range enum (`10k-50k | 50k-200k | 200k-1M | 1M+`) | ✅ | Validator `:107-109`. UI labely v češtině: "10 000 – 50 000 Kč", "50 000 – 200 000 Kč", "200 000 – 1 000 000 Kč", "1 000 000+ Kč" (`ApplyForm.tsx:15-20`). |
| 6 | Admin DB notification navíc k emailu | ✅ | `route.ts:138-146` — `prisma.notification.createMany` pro všechny ACTIVE admin. Fallback layer, pokud email selže. Konzistentní s ostatními flows (např. #19). |

**Všech 6 odchylek správně implementováno + justifikováno.** ✅

---

## 4. Cross-check proti QA reportu (31/31 PASS)

QA (`qa-task-29-marketplace-apply.md`) potvrzuje:
- Build: ✅ 310/310 (+1 nová route `/marketplace/apply`)
- Lint: 10 errors = pre-existing, **0 nových** problémů v dotčených souborech
- Prisma model: 19 polí + 3 indexy + 2 relace na User
- Migration SQL: čistá, jen MarketplaceApplication tabulka
- Email templates: `escapeHtml` na všech user datech (anti-XSS)
- Middleware: 4 redirect pravidla (2 unauth + 2 wrong role)

**QA report konzistentní s mojí literal verifikací.** ✅

---

## 5. Dodatečné checky

### 5.1 Žádné hidden pages check
```
Glob: app/(web)/marketplace/apply/**/*.tsx
→ page.tsx, loading.tsx, error.tsx
```
3 soubory, všechny standardní Next.js pattern. **Žádné skryté routes.** ✅

### 5.2 GDPR check
- `gdprConsent: z.literal(true)` v validatoru — musí být `true`
- Zpráva: "Souhlasím se zpracováním osobních údajů..."
- Link na `/ochrana-osobnich-udaju` (target="_blank")
- Form nelze odeslat bez checku (`canSubmit && gdprConsent`)

**GDPR konform.** ✅

### 5.3 Duplicate submission check
`route.ts:65-81` — 24h okno, stejný email + status=NEW → 409 se zprávou "Již jste podali žádost v posledních 24 hodinách. Kontaktujeme vás co nejdříve." ✅ Clear UX.

### 5.4 IČO validace (dealer)
Validator: `z.string().regex(/^\d{8}$/, "IČO musí mít 8 číslic")`
Client canSubmit: `/^\d{8}$/.test(ico)` (:110)
**Dvojitá validace (client + server).** ✅

### 5.5 Text "žádosti" check
- "Žádost o přístup" — page H1, breadcrumb, card title
- "Žádost odeslána!" — thank-you
- "Odeslat žádost" — submit CTA
- Alert: "vyplňte žádost níže"

**Konzistentní terminologie, uživatel vždy ví, že vyplňuje "žádost o přístup".** ✅

---

## 6. Flagy / poznámky (non-blocking)

1. **Prisma drift (task #54)** — migration.sql je čistý, ale deploy na prod vyžaduje buď vyřešit searchVector drift nebo aplikovat stejný psql workaround. DevOps musí být informován. Tracked v separate task.

2. **Admin panel pro review aplikací** — NEimplementován (out of scope #29). Admini dostanou email + DB notification + link `/admin/marketplace/applications/${id}`, ale cílová stránka neexistuje. Doporučuji **follow-up task** pro admin UI (list / detail / approve+convert to User / reject).

3. **E2E test chybí** — happy path + honeypot + rate limit + duplicate scenario. Doporučuji samostatný task pro test-chrome.

---

## 7. Souhrn

| Check | Výsledek |
|-------|----------|
| Bod 1: Žádná skrytá stránka | ✅ 5 linků z landing + 4 middleware redirects |
| Bod 2: Žádné zkratky v UI | ✅ Plné české labely napříč celou flow |
| Bod 3: Apply form bez přihlášení | ✅ 0 výskytů `getServerSession` v endpointu |
| Bod 4: Dvě role (INVESTOR + VERIFIED_DEALER) | ✅ Validator enum + conditional fields + FAQ glossary |
| Bod 5: Confirmation email žadateli | ✅ Fire-and-forget + template s subject/html/text |
| Bod 6: Admin notifikace | ✅ Dvojitá vrstva (email + DB notification) |
| 6 schválených odchylek | ✅ Všechny správně implementovány |
| QA consistency | ✅ 31/31 PASS potvrzeno |
| Build + Lint | ✅ 310 routes, 0 nových problémů |

**Celkové hodnocení: ✅ REVIEW #29 APPROVED**

Uživatelské zadání *"bude landing a taky možnoat poslat žadost na to bejt investor nebo realizator"* je **plně pokryto**:
- Landing page existuje a má 5 CTA na apply form
- `/marketplace/apply` je veřejná stránka
- Apply form podporuje obě role (investor + realizator) s role-specific poli
- Neauthenticated user může podat žádost bez vytvoření účtu
- Dostane potvrzovací email
- Admin dostane email + DB notifikaci

---

## 8. Doporučené follow-up tasky

1. **#29a — Admin panel pro MarketplaceApplication review** (list / detail / approve+convert / reject)
2. **#29b — E2E test suite pro apply form** (happy path + honeypot + rate limit + anti-duplicate)
3. **#54 — Prisma drift resolution** (už existuje, tracked)
