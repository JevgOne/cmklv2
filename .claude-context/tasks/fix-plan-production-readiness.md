# Plan oprav pro Production Readiness — CarMakler v2

**Datum:** 2026-04-04
**Zdroje:** production-readiness-assessment.md, QA-TASK-019-020.md, Evzenovy pripominky, TASK-QUEUE.md DOPLNENO sekce
**Format:** P0 (bloker) > P1 (dulezite) > P2 (nice to have). Kazda polozka: co, kde, slozitost (S/M/L)

---

## OPRAVY ASSESSMENTU (faktické chyby)

Assessment chybne tvrdil ze chybi sitemap, robots a canonical. Oprava:
- `app/sitemap.ts` — EXISTUJE, plne dynamicka sitemap s 200+ URL (staticke + DB vehicles + brokers + SEO landing pages)
- `app/robots.ts` — EXISTUJE, spravne blokuje /api/, /admin/, /login
- `app/layout.tsx:61-63` — EXISTUJE globalni canonical pres `alternates.canonical`
- TODO v API routes EXISTUJI: `lib/listing-sla.ts:213` (watchdog email), `app/api/onboarding/profile/route.ts:51` (cloudinary upload), `app/api/vehicles/[id]/handover/route.ts:185` (follow-up email)

---

## P0 — BLOKERY PRO LAUNCH

Bez techto oprav web NESMI byt zverejnen. Nekdo z nich je pravni povinnost, nekdo technicky predpoklad.

---

### P0-01: Pravni stranky — Obchodni podminky
**Co:** Vytvorit stranku `/obchodni-podminky` s plnymi obchodnimi podminkami pro eshop autodilu a inzertni sluzby. Zahrnout: definice pojmu, objednavkovy proces, ceny a platba, dodani, odstoupeni od smlouvy (14 dni), reklamace, ochrana prav, zaverecna ustanoveni.
**Kde:** `app/(web)/obchodni-podminky/page.tsx` (novy soubor)
**Slozitost:** M (pravni text musi byt korektni, idealne od pravnika)
**Paralelizace:** NEZAVISLY — muze bezet soucasne se vsim ostatnim

### P0-02: Pravni stranky — Ochrana osobnich udaju (GDPR)
**Co:** Vytvorit stranku `/ochrana-osobnich-udaju` s kompletni informaci o zpracovani osobnich udaju dle GDPR a zakona 110/2019 Sb. Zahrnout: spravce udaju, ucely zpracovani, pravni zaklady, kategorie udaju, doba uchovani, prava subjektu, cookies, predavani treti strane, kontakt na DPO.
**Kde:** `app/(web)/ochrana-osobnich-udaju/page.tsx` (novy soubor)
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P0-03: Pravni stranky — Reklamacni rad
**Co:** Vytvorit stranku `/reklamacni-rad` se zakonnym reklamacnim radem pro eshop. Zahrnout: uplatneni reklamace, lhuty (14 dni odstoupeni, 24 mesicu zaruka nove dily, 12 mesicu pouzite), postup, kontaktni udaje, formulare.
**Kde:** `app/(web)/reklamacni-rad/page.tsx` (novy soubor)
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P0-04: Cookie consent banner
**Co:** Implementovat cookie consent banner dle GDPR a smernice ePrivacy. Musi obsahovat: tlacitko "Prijmout vse", "Pouze nutne", moznost detailni konfigurace (analyticke, marketingove cookies). Ulozit consent do cookie, blokovat nenecessary scripty pred souhlasem.
**Kde:** `components/web/CookieConsent.tsx` (novy), `app/(web)/layout.tsx` (pridat), `app/(web)/zasady-cookies/page.tsx` (novy — volitelna detailni stranka)
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P0-05: Odkazy na pravni stranky v paticce
**Co:** Pridat do footeru vsech layoutu odkazy na: Obchodni podminky, Ochrana osobnich udaju, Reklamacni rad. Tyto odkazy MUSI byt viditelne v paticce (zakonna povinnost pro e-shop).
**Kde:** `components/main/Footer.tsx`, `components/inzerce/Footer.tsx`, `components/shop/Footer.tsx`, `components/marketplace/Footer.tsx`
**Slozitost:** S
**Paralelizace:** ZAVISI na P0-01, P0-02, P0-03 (stranky musi existovat)

### P0-06: Odstranit hardcoded site password
**Co:** Middleware.ts radek 86-87 obsahuje `SITE_PASSWORD = "Admin2026"` — hardcoded heslo, ktere blokuje pristup na celý web. Presunout do env promenne `SITE_PASSWORD`. Pro produkci bud uplne odstranit (verejny web) nebo nastavit pres env.
**Kde:** `middleware.ts:86-99`
**Slozitost:** S
**Paralelizace:** NEZAVISLY

### P0-07: Vytvoreni .env.example a .env.local
**Co:** Vytvorit `.env.example` se vsemi potrebnymi promennymi (bez hodnot) a `.env.local` pro dev. Minimalne: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_COOKIE_DOMAIN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VINDECODER_API_KEY`, `VINDECODER_API_SECRET`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, `SITE_PASSWORD`.
**Kde:** `.env.example` (novy), `.env.local` (novy, v .gitignore)
**Slozitost:** S
**Paralelizace:** NEZAVISLY

### P0-08: Migrace SQLite na PostgreSQL
**Co:** Zmenit Prisma provider ze `sqlite` na `postgresql`. Odstranit SQLite adapter z `lib/prisma.ts`. Aktualizovat `schema.prisma` datasource, nahradit `PrismaBetterSqlite3` za standardni PostgreSQL pripojeni pres `DATABASE_URL`. Odstranit `better-sqlite3` a `@prisma/adapter-better-sqlite3` z dependencies. Vygenerovat novou migraci. Otestovat se vsemi modely.
**Kde:** `prisma/schema.prisma:4-6`, `lib/prisma.ts` (kompletni prepis), `package.json` (odstranit sqlite deps)
**Slozitost:** L
**Paralelizace:** BLOKUJICI — mnoho dalsiho zavisi na funkcni DB

### P0-09: Vraceni a reklamace — Return model + zakladni flow (PRESUNUTO z P2-03)
**Co:** Zakonna povinnost pro e-shop: 14 dni odstoupeni od smlouvy (zakon 634/1992 Sb.) a 12-24 mesicu zaruka. Implementovat Return model v Prisma, zakladni API routes pro vytvoreni a spravu reklamace/vraceni, a UI stranky pro zakaznika (formular "Chci vratit"/"Reklamovat"). Bez tohoto nelze legalne provozovat e-shop s dily.
**Kde:** `prisma/schema.prisma` (novy model Return, ReturnStatus enum, ReturnType enum), `app/api/orders/[id]/returns/route.ts` (novy), `app/(web)/shop/moje-objednavky/[id]/vraceni/page.tsx` (novy), `app/(web)/shop/moje-objednavky/[id]/reklamace/page.tsx` (novy)
**Slozitost:** L
**Paralelizace:** ZAVISI na P0-08 (PostgreSQL migrace)

### P0-10: Guest checkout — objednavka bez registrace (PRESUNUTO z P2-02)
**Co:** Zakaznik musi moci objednat bez vytvoreni uctu. Aktualne Order vyzaduje buyerId. Pridat guestEmail, guestName, guestPhone, guestToken do Order modelu. Vytvorit stranku pro sledovani objednavky pres token (`/shop/objednavky/sledovani/[token]`). Po objednavce nabidnout dobrovolnou registraci.
**Kde:** `prisma/schema.prisma` (Order model rozsireni — buyerId optional, guest* pole), `app/api/orders/route.ts` (upravit validaci), `app/(web)/shop/objednavky/sledovani/[token]/page.tsx` (novy), checkout flow
**Slozitost:** M
**Paralelizace:** ZAVISI na P0-08 (PostgreSQL migrace)

---

## P1 — DULEZITE PRED PUBLIC LAUNCHEM

Bez techto oprav web sice muze technicky fungovat, ale uzivatele budou mit spatnou zkusenost nebo narazí na nefunkcni features.

---

### P1-01: Watchdog email notifikace (QA BUG)
**Co:** Implementovat odeslani emailu pri watchdog match. Aktualne je jen TODO komentare, kupujici nedostane email kdyz se objevi auto odpovidajici jeho kriteriim. Pouzit Resend API + existujici email sablonu `watchdog-match.ts`.
**Kde:** `lib/listing-sla.ts:213-215`
**Slozitost:** S
**Paralelizace:** ZAVISI na P1-06 (Resend konfigurace)

### P1-02: Sjednotit wantBrokerHelp / wantsBrokerHelp (QA BUG)
**Co:** Sjednotit nazev pole na `wantsBrokerHelp` v celem kodu. Odstranit fallback logiku v API route a duplicitni pole v Zod schema.
**Kde:** `components/web/listing-form/ListingFormWizard.tsx:59`, `lib/validators/listing.ts:53`, `app/api/listings/route.ts:59,78`
**Slozitost:** S
**Paralelizace:** NEZAVISLY

### P1-03: Inzerce katalog — redirect misto staticke stranky (QA BUG)
**Co:** Nahradit statickou HTML stranku `/inzerce/katalog` server-side redirectem na `/nabidka`. Aktualni stav je SEO problem — crawlery zaindexuji thin content.
**Kde:** `app/(web)/inzerce/katalog/page.tsx`
**Slozitost:** S
**Paralelizace:** NEZAVISLY

### P1-04: Pridat Part.manufacturer a Part.warranty do schema (QA BUG)
**Co:** Pridat chybejici pole `manufacturer String?` a `warranty String?` do Part modelu v Prisma. Vytvorit migraci. Aktualizovat API routes a formulare pro parts.
**Kde:** `prisma/schema.prisma` (Part model), `app/api/parts/route.ts`, `app/(pwa-parts)/parts/new/page.tsx`
**Slozitost:** S
**Paralelizace:** ZAVISI na P0-08 (PostgreSQL migrace)

### P1-05: Cloudinary upload flow pro vozidla/inzeraty
**Co:** Dokoncit Cloudinary upload flow. Aktualne jen onboarding documents pouzivaji Cloudinary. Implementovat upload pro: VehicleImage (maklerska PWA), ListingImage (inzertni formular), PartImage (dodavatelska PWA). Obrazky se aktualne odkazuji na Unsplash/placeholder URL.
**Kde:** `app/api/vehicles/[id]/images/route.ts` (zkontrolovat/doplnit), `app/api/listings/[id]/images/route.ts`, `app/api/parts/[id]/images/route.ts`, `lib/image-utils.ts`
**Slozitost:** M
**Paralelizace:** ZAVISI na P0-07 (env s Cloudinary klici)

### P1-06: Konfigurace Resend pro odchozi emaily
**Co:** Overit ze vsechny email send cesty pouzivaji Resend API spravne. Aktualne kod existuje (`app/api/emails/send/route.ts`), ale bez API klice se emaily neodesilaji. Nakonfigurovat `RESEND_API_KEY` a `RESEND_FROM_EMAIL`. Otestovat klicove emaily: kontaktni formular, inquiry notifikace, watchdog match, daily summary.
**Kde:** `.env.local` (RESEND_API_KEY), `app/api/emails/send/route.ts` (overit), `app/api/contact/route.ts` (pridat email odeslani), `app/api/listings/[id]/inquiry/route.ts` (overit notifikaci)
**Slozitost:** M
**Paralelizace:** ZAVISI na P0-07 (env)

### P1-07: Nahradit fiktivni kontaktni udaje
**Co:** Nahradit placeholder data realnymi: adresa firmy, telefon, email, IČO. Ovlivnuje: homepage JSON-LD, kontaktni stranka, footer, o-nas.
**Kde:** `app/(web)/page.tsx:217-237` (JSON-LD), `app/(web)/kontakt/page.tsx:18-47` (pobocky + kontakty), `app/(web)/kontakt/page.tsx:53-73` (JSON-LD), `components/main/Footer.tsx`, `app/(web)/o-nas/page.tsx`
**Slozitost:** S (az budou realne udaje k dispozici)
**Paralelizace:** NEZAVISLY — ceka na business decision

### P1-08: Nahradit hardcoded statistiky dynamickymi
**Co:** Statistiky na /chci-prodat (247 prodanych, 4.8 hodnoceni) a /marketplace (127 flipu, 21% ROI, 48 dni) jsou hardcoded. Nahradit DB queries nebo konfigurovatelnym nastavenim.
**Kde:** `app/(web)/chci-prodat/page.tsx:144-155`, `app/(web)/marketplace/page.tsx:163-176`
**Slozitost:** S
**Paralelizace:** NEZAVISLY

### P1-09: Implementovat "zapomenute heslo"
**Co:** Aktualne je odkaz `mailto:info@carmakler.cz`. Implementovat password reset flow: formular na email, Resend odeslani reset tokenu, stranka pro nastaveni noveho hesla. Pridat model ResetToken nebo pouzit existujici mechanismus.
**Kde:** `app/(web)/login/page.tsx:130-134` (odkaz), nova stranka `app/(web)/zapomenute-heslo/page.tsx`, nova stranka `app/(web)/reset-hesla/[token]/page.tsx`, novy API `app/api/auth/forgot-password/route.ts`, novy API `app/api/auth/reset-password/route.ts`
**Slozitost:** M
**Paralelizace:** ZAVISI na P1-06 (Resend pro odeslani emailu)

### P1-10: Error tracking (Sentry)
**Co:** Pridat Sentry pro zachytavani chyb na klientu i serveru. Nakonfigurovat Next.js instrumentation a global error boundary.
**Kde:** `sentry.client.config.ts` (novy), `sentry.server.config.ts` (novy), `next.config.ts` (Sentry webpack plugin), `app/global-error.tsx` (novy)
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P1-11: Analytics (Plausible nebo GA)
**Co:** Pridat privacy-friendly analytics. Doporucen Plausible (self-hosted nebo cloud) — nevyzaduje cookie consent. Alternativa GA4 (vyzaduje cookie consent).
**Kde:** `app/layout.tsx` (script tag), `components/web/CookieConsent.tsx` (pokud GA4)
**Slozitost:** S
**Paralelizace:** NEZAVISLY (pokud Plausible), ZAVISI na P0-04 (pokud GA4)

### P1-12: Onboarding profile — Cloudinary TODO
**Co:** API route `app/api/onboarding/profile/route.ts:51` ma TODO pro upload profilove fotky na Cloudinary. Implementovat.
**Kde:** `app/api/onboarding/profile/route.ts:51`
**Slozitost:** S
**Paralelizace:** ZAVISI na P0-07 (env), P1-05 (Cloudinary flow)

### P1-13: E2E testy — kriticke user flows
**Co:** 0 E2E testu existuje (pouze 15 unit testu). Vytvorit Playwright config a zakladni E2E testy pro kriticke flows: homepage load, navigace, login/logout, podani inzeratu, kontaktni formular, prohlizeni nabidky, kosik eshopu.
**Kde:** `playwright.config.ts` (novy), `e2e/` slozka (nova), min 5-7 test souboru
**Slozitost:** L
**Paralelizace:** NEZAVISLY (ale vyzaduje funkcni build, tedy po P0-08)

### P1-14: CI/CD pipeline
**Co:** Vytvorit GitHub Actions workflow pro: lint, typecheck, unit testy, build, E2E testy. Deployovat na staging pres Vercel/Railway/custom.
**Kde:** `.github/workflows/ci.yml` (novy), `.github/workflows/deploy.yml` (novy)
**Slozitost:** M
**Paralelizace:** ZAVISI na P1-13 (E2E testy existuji)

### P1-15: Accessibility audit a opravy
**Co:** Spustit Lighthouse/axe audit. Opravit kriticke a11y problemy: chybejici alt texty (emojis jako ikony nemaji alt), kontrastni pomery, ARIA labels, focus management, skip-to-content link.
**Kde:** Pruchod vsemi strankami v `app/(web)/`
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P1-16: Performance audit a opravy
**Co:** Spustit Lighthouse performance audit. Optimalizovat: LCP (hero obrazky — aktualne Unsplash bez optimalizace), CLS (loading states), FCP. Pridat `next/image` misto `<img>` tagu vsude kde se pouziva externí URL. Pridat priority hints.
**Kde:** Vsechny stranky s `<img>` tagy — zejmena `app/(web)/page.tsx`, VehicleCard, ProductCard
**Slozitost:** M
**Paralelizace:** NEZAVISLY

---

## P2 — NICE TO HAVE (muze pockat po launchi)

---

### P2-01: TASK-020 DOPLNENO — SubOrder (split objednavek per dodavatel)
**Co:** Implementovat SubOrder model a logiku. Aktualne Order nema split per dodavatel — jeden checkout = jeden Order. Spec pozaduje split na SubOrders s nezavislym fulfillmentem.
**Kde:** `prisma/schema.prisma` (novy model SubOrder), `app/api/orders/route.ts`, objednavkovy flow
**Slozitost:** L
**Paralelizace:** NEZAVISLY

### P2-02: TASK-020 DOPLNENO — (PRESUNUT do P0-10)

### P2-03: TASK-020 DOPLNENO — (PRESUNUT do P0-09)

### P2-04: TASK-020 DOPLNENO — PartRequest (burza dilu / poptavka)
**Co:** Implementovat PartRequest a PartRequestOffer modely. Zakaznik popise co hleda, vrakoviste nabidnou.
**Kde:** `prisma/schema.prisma`, API routes, UI formular + listing
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P2-05: TASK-020 DOPLNENO — Smart Search + Autocomplete
**Co:** Implementovat chytre vyhledavani dilu (parsovani prirozeneho jazyka) a autocomplete dropdown.
**Kde:** `app/api/parts/smart-search/route.ts` (novy), `app/api/parts/autocomplete/route.ts` (novy), `components/web/PartsSearch.tsx` (rozsirit)
**Slozitost:** L
**Paralelizace:** NEZAVISLY

### P2-06: TASK-020 DOPLNENO — Krizove reference OEM cisel
**Co:** Implementovat PartCrossReference model. Vyhledavani pres OEM cisla s nabidkou alternativ.
**Kde:** `prisma/schema.prisma`, API routes, feed import rozsireni
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P2-07: TASK-020 DOPLNENO — Moje garaz (CustomerGarage)
**Co:** Zakaznik ulozi sve auto, vidí jen kompatibilni dily.
**Kde:** `prisma/schema.prisma`, API routes, UI
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P2-08: TASK-020 DOPLNENO — Rezervace unikatnich dilu (30 min)
**Co:** Pouzite dily jsou unikaty. Implementovat 30-minutovou rezervaci pri checkoutu s cron uvolnenim.
**Kde:** Part model rozsireni, Order flow, cron job
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P2-09: Role WHOLESALE_SUPPLIER (QA BUG)
**Co:** Pridat roli WHOLESALE_SUPPLIER (velkoobchodni dodavatel — Auto Kelly, Elit) odlisnou od PARTS_SUPPLIER (vrakoviste). Aktualizovat middleware, auth, admin panel.
**Kde:** `prisma/schema.prisma` (User role komentare), `middleware.ts`, `lib/auth.ts`
**Slozitost:** S
**Paralelizace:** NEZAVISLY

### P2-10: Handover follow-up email TODO
**Co:** `app/api/vehicles/[id]/handover/route.ts:185` — TODO pro automaticky follow-up email kupujicimu po 7 dnech.
**Kde:** `app/api/vehicles/[id]/handover/route.ts:185`, `app/api/cron/` (novy cron job)
**Slozitost:** S
**Paralelizace:** ZAVISI na P1-06 (Resend)

### P2-11: Stripe integrace (faze 2)
**Co:** Aktivovat Stripe pro: rezervace (5000 Kc kauce), TOP inzerat (199 Kc), Cebia proverka (499 Kc), platby za vozidla. Kod uz existuje, chybi jen API klice a testovani.
**Kde:** `.env.local` (STRIPE klice), `lib/stripe.ts` (overit API verzi)
**Slozitost:** M
**Paralelizace:** ZAVISI na P0-07 (env)

### P2-12: Pusher real-time notifikace
**Co:** Implementovat real-time notifikace pro maklere (novy lead, nova inquiry, stav vozidla). CLAUDE.md uvadi Pusher, ale neni v kodu.
**Kde:** `package.json` (pridat pusher), `lib/pusher.ts` (novy), notifikacni routes
**Slozitost:** L
**Paralelizace:** NEZAVISLY

### P2-13: Email verifikace
**Co:** Implementovat verifikaci emailu pri registraci. Pole `emailVerified` v schema existuje ale neni pouzivano.
**Kde:** `app/api/auth/register/route.ts`, novy API `/api/auth/verify-email/[token]`, `lib/auth.ts`
**Slozitost:** M
**Paralelizace:** ZAVISI na P1-06 (Resend)

### P2-14: CSP headers
**Co:** Pridat Content-Security-Policy header. Aktualne jen X-Frame-Options.
**Kde:** `next.config.ts:24` (rozsirit headers)
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P2-15: Cebia mock — UI fallback pro null reportUrl
**Co:** QA nasla ze dev mock vraci `reportUrl: null`. UI musi tento pripad osetrovat zobrazenim fallback textu.
**Kde:** `components/web/CebiaCheck.tsx`
**Slozitost:** S
**Paralelizace:** NEZAVISLY

### P2-16: DOPLNENO — Vizualni vyber dilu (SVG klikaci auto)
**Co:** Na homepage eshopu interaktivni SVG obrazek auta s klikatelnymi zonami (kapota, dvere, svetla, naraznik, kola, motor...). Klik presmeruje na kategorii dilu pro tu cast. 3 pohledy (zepredu, zboku, zezadu).
**Kde:** `components/shop/InteractiveCarSvg.tsx` (novy), `app/(web)/shop/page.tsx` (pridat)
**Slozitost:** L
**Paralelizace:** NEZAVISLY

### P2-17: DOPLNENO — Srovnani alternativ dilu
**Co:** Nad vysledky hledani dilu sekce "Porovnani alternativ" — tabulka: Original | Aftermarket A | Aftermarket B | Pouzity. Radky: Cena, Vyrobce, Zaruka, Stav, Hodnoceni, Dostupnost. Automaticky pres krizove reference (OEM cislo).
**Kde:** `components/shop/PartsComparison.tsx` (novy), `app/api/parts/compare/route.ts` (novy)
**Slozitost:** M
**Paralelizace:** ZAVISI na P2-06 (krizove reference)

### P2-18: DOPLNENO — Historie hledani + "Hledali jste naposledy"
**Co:** Pro prihlasene ulozit poslednich 10 hledani v DB, pro neprihlasene localStorage 5. Na homepage eshopu sekce "Hledali jste naposledy". V searchbaru pri focus zobrazit posledni hledani jako suggestions.
**Kde:** `prisma/schema.prisma` (novy model SearchHistory), `app/api/search-history/route.ts` (novy), `components/shop/RecentSearches.tsx` (novy)
**Slozitost:** S
**Paralelizace:** NEZAVISLY

### P2-19: DOPLNENO — Cross-sell dily na detailu vozu v katalogu
**Co:** Na detailu vozu v katalogu (/nabidka/[slug]) dole sekce "Dily pro tento vuz skladem". Komponenta `RecommendedParts.tsx` JIZ EXISTUJE, ale overit funkcnost a doplnit CTA link na /dily/[znacka]/[model]/[rok].
**Kde:** `components/web/RecommendedParts.tsx` (overit/doplnit), `app/(web)/nabidka/[slug]/page.tsx`
**Slozitost:** S
**Paralelizace:** NEZAVISLY

### P2-20: DOPLNENO — Zasilkovna widget (vyber vydejniho mista)
**Co:** Integrace Zasilkovna widget pro vyber vydejniho mista v checkout flow. Widget zobrazí mapu s body a zakaznik vybere. Ulozit zasilkovnaPointId do SubOrder.
**Kde:** `components/shop/ZasilkovnaWidget.tsx` (novy), checkout flow, `app/api/shipping/zasilkovna-points/route.ts` (novy)
**Slozitost:** M
**Paralelizace:** ZAVISI na P2-01 (SubOrder)

### P2-21: DOPLNENO — Part model rozsireni (weight, dimensions, slug)
**Co:** Pridat do Part modelu: `weight` Int? (gramy), `dimensions` Json? (delka/sirka/vyska v cm), `slug` String @unique. Umozni vypocet dopravy a hezci URL.
**Kde:** `prisma/schema.prisma` (Part model), migrace, `app/api/parts/route.ts`, formular pro pridani dilu
**Slozitost:** S
**Paralelizace:** ZAVISI na P0-08 (PostgreSQL)

### P2-22: DOPLNENO — Hodnoceni dodavatelu (SupplierReview)
**Co:** Po doruceni objednavky zakaznik muze hodnotit dodavatele (1-5 hvezd + text). Jen po nakupu. Zobrazit na profilu dodavatele prumerné hodnoceni.
**Kde:** `prisma/schema.prisma` (novy model SupplierReview), `app/api/suppliers/[id]/review/route.ts` (novy), `components/shop/SupplierRating.tsx` (novy)
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P2-23: DOPLNENO — Notifikace "opet skladem"
**Co:** Zakaznik se prihlasi k odberani notifikace kdyz dil neni skladem. Kdyz se dil doplni, odesle se email. Cron job pro kontrolu.
**Kde:** `prisma/schema.prisma` (novy model StockNotification), `app/api/parts/[id]/notify-stock/route.ts` (novy), `app/api/cron/stock-notifications/route.ts` (novy)
**Slozitost:** M
**Paralelizace:** ZAVISI na P1-06 (Resend)

### P2-24: DOPLNENO — Drop-shipping flow pro aftermarket dily
**Co:** Aftermarket dily (Auto Kelly, Elit) se nedrzi na sklade — objednavka se presmeruje na velkoobchod. Implementovat dropship flag na Part a automaticke presmerovani objednavky.
**Kde:** `prisma/schema.prisma` (Part.isDropship Boolean), `app/api/orders/route.ts` (rozsirit), notifikace velkoobchodu
**Slozitost:** M
**Paralelizace:** NEZAVISLY

### P2-25: DOPLNENO — Podobne dily ("Zakazniky take zajimalo")
**Co:** Na detailu dilu sekce s podobnymi dily — stejna kategorie, stejny vuz, jina cena/vyrobce. Algoritmus: stejny compatibleBrand+compatibleModel+category, serazeno dle popularity.
**Kde:** `app/api/parts/[id]/similar/route.ts` (novy), `components/shop/SimilarParts.tsx` (novy)
**Slozitost:** S
**Paralelizace:** NEZAVISLY

---

## PARALELIZACNI MATICE

Nasledujici tasky mohou bezet **soucasne** (zadne zavislosti):

### Batch 1 (okamzite, bez zavislosti)
| Task | Slozitost | Popis |
|------|-----------|-------|
| P0-01 | M | Obchodni podminky |
| P0-02 | M | Ochrana osobnich udaju |
| P0-03 | M | Reklamacni rad |
| P0-04 | M | Cookie consent banner |
| P0-06 | S | Odstranit hardcoded password |
| P0-07 | S | .env.example + .env.local |
| P1-01 | S | Watchdog email (kod + sablona existuji, staci propojit) |
| P1-02 | S | Sjednotit wantsBrokerHelp |
| P1-03 | S | Inzerce katalog redirect |
| P1-06 | M | Resend konfigurace (env + overeni) |
| P1-07 | S | Nahradit fiktivni kontakty |
| P1-08 | S | Dynamicke statistiky |
| P1-11 | S | Analytics (Plausible) |
| P1-12 | S | Onboarding Cloudinary TODO |

### Batch 2 (po Batch 1, zavisi na env/DB/pravni stranky)
| Task | Zavisi na | Slozitost | Popis |
|------|-----------|-----------|-------|
| P0-05 | P0-01,02,03 | S | Odkazy v paticce |
| P0-08 | P0-07 | L | SQLite -> PostgreSQL |
| P1-05 | P0-07 | M | Cloudinary upload |
| P1-14 (zaklad) | — | S | CI/CD zaklad: lint + typecheck + unit testy |

### Batch 3 (po Batch 2, zavisi na DB + integrace)
| Task | Zavisi na | Slozitost | Popis |
|------|-----------|-----------|-------|
| P0-09 | P0-08 | L | Return/reklamace model + flow |
| P0-10 | P0-08 | M | Guest checkout |
| P1-04 | P0-08 | S | Part manufacturer/warranty |
| P1-09 | P1-06 | M | Zapomenute heslo |
| P1-10 | — | M | Sentry error tracking |
| P1-13 | P0-08 | L | E2E testy |
| P1-15 | — | M | Accessibility audit |
| P1-16 | — | M | Performance audit |

### Batch 4 (po Batch 3, finalizace)
| Task | Zavisi na | Slozitost | Popis |
|------|-----------|-----------|-------|
| P1-14 (rozsireny) | P1-13 | M | CI/CD: E2E + deploy pipeline |

### P2 — libovolne poradi po launchi

---

## ODHAD CELKOVEHO ROZSAHU

| Priorita | Pocet tasku | S | M | L | Odhadovany cas (1 dev) |
|----------|-------------|---|---|---|----------------------|
| P0 | 10 | 3 | 5 | 2 | 5-7 dni |
| P1 | 16 | 7 | 7 | 2 | 7-10 dni |
| P2 | 23 | 5 | 10 | 8 | 18-25 dni |
| **Celkem** | **49** | **15** | **22** | **12** | **30-42 dni** |

**Minimalni cas do launche (P0 + kriticke P1):** ~12 pracovnich dni s 2 paralelnimi implementatory.

**Poznamka k P2:** 10 novych P2 polozek (P2-16 az P2-25) pochazi z TASK-020 DOPLNENO sekce. Jsou "nice to have" pro launch, ale dulezite pro konkurenceschopnost eshopu.
