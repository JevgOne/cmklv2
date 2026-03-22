# Carmakler — Automobilová platforma

## Přehled
Carmakler je ekosystém 4 propojených produktů pod jednou značkou:

1. **Carmakler (makléřská síť)** — Zprostředkování prodeje vozidel přes síť certifikovaných makléřů. Makléř nabere auto v terénu, zadá do systému, BackOffice schválí, auto se prodá. Provize: 5% z prodejní ceny, min. 25 000 Kč.
2. **Inzertní platforma** — Digitální inzerce aut pro soukromé prodejce, autobazary a dealery. Obdoba Sauto/Bazoš s vyšší kvalitou. Propojení s makléřskou sítí.
3. **Eshop autodíly** — E-shop s použitými díly z vrakovišť + nové aftermarket díly. Vrakoviště přidávají díly přes jednoduchou PWA. Zákazník hledá díly podle VIN/vozu.
4. **Marketplace (VIP)** — Uzavřená investiční platforma pro flipping aut. Ověření dealeři nabízí příležitosti (nákup + oprava + prodej), ověření investoři financují. Dělení zisku: 40% investor, 40% dealer, 20% Carmakler. Auto se kupuje na firmu Carmakler.

## Tech Stack
- **Framework:** Next.js 15 (App Router, Server Components)
- **Jazyk:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 + Outfit font
- **ORM:** Prisma + PostgreSQL
- **Auth:** NextAuth.js (role: ADMIN, BACKOFFICE, REGIONAL_DIRECTOR, MANAGER, BROKER, ADVERTISER, BUYER, PARTS_SUPPLIER, INVESTOR, VERIFIED_DEALER)
- **PWA:** Serwist (offline-first pro makléře + dodavatele dílů)
- **Offline:** Service Worker + IndexedDB (idb) + Background Sync
- **AI:** Claude API (@anthropic-ai/sdk) — AI asistent pro makléře, generování popisů
- **VIN:** vindecoder.eu API + NHTSA fallback
- **Real-time:** Pusher
- **Email:** Resend
- **Obrázky:** Cloudinary
- **Platby:** Stripe (fáze 2, v MVP bankovní převod + dobírka)
- **Validace:** Zod
- **Formuláře:** React Hook Form
- **Animace:** Framer Motion

## Architektura
```
app/
  (web)/           → veřejný web (katalog, makléři, landing pages)
  (web)/inzerat/   → inzertní platforma (podání inzerátu, správa)
  (web)/dily/      → eshop autodíly (katalog, košík, objednávky)
  (web)/marketplace/ → marketplace landing + dealer/investor dashboardy
  (pwa)/           → PWA pro makléře (dashboard, nabírání aut, smlouvy, AI asistent)
  (pwa-parts)/     → PWA pro dodavatele dílů (přidávání dílů, objednávky)
  (admin)/         → BackOffice admin panel
  api/             → API routes
```

## Pravidla pro vývoj

### Kód
- Vše v češtině (UI texty, komentáře) kromě kódu samotného (anglické názvy proměnných/funkcí)
- Server Components jako default, "use client" jen když nutné
- Každá stránka má svůj loading.tsx a error.tsx
- API routes používají Zod validaci na vstupu
- Prisma queries vždy přes lib/prisma.ts singleton

### Design systém
- Primary: Orange (#F97316)
- Font: Outfit (Google Fonts)
- Mobile-first přístup
- Komponenty v components/ui/ (sdílené), components/web/, components/pwa/, components/admin/

### Git
- Conventional commits (feat:, fix:, chore:, docs:)
- Branch naming: feature/*, fix/*, chore/*

### Testování
- E2E: Playwright
- Unit: Vitest

## Agenti
Projekt využívá 5 specializovaných Claude agentů:
- **product-owner** - Prioritizace, user stories, acceptance criteria
- **developer** - Implementace kódu, architektura, code review
- **designer** - UI/UX, design systém, komponenty, responzivita
- **qa** - Testování, quality assurance, bug reporty
- **marketolog** - SEO, copywriting, conversion optimalizace, analytics

Agenti jsou definováni v `.claude/agents/` a mohou být spuštěni pomocí Agent toolu.

## Příkazy
```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx prisma studio    # Prisma GUI
npx prisma migrate dev  # DB migrace
```
