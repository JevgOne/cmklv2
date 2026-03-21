# Carmakler - Auto portál se sítí makléřů

## Přehled
Auto portál inspirovaný Autorro.sk. Zprostředkování prodeje vozidel přes síť certifikovaných makléřů.

## Tech Stack
- **Framework:** Next.js 15 (App Router, Server Components)
- **Jazyk:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 + Outfit font
- **ORM:** Prisma + PostgreSQL
- **Auth:** NextAuth.js (role: ADMIN, BACKOFFICE, REGIONAL_DIRECTOR, MANAGER, BROKER)
- **PWA:** Serwist (offline-first pro makléře)
- **Real-time:** Pusher
- **Email:** Resend
- **Obrázky:** Cloudinary
- **Validace:** Zod
- **Formuláře:** React Hook Form
- **Animace:** Framer Motion

## Architektura
```
app/
  (web)/     → veřejný web (katalog, makléři, landing pages)
  (pwa)/     → PWA pro makléře (dashboard, správa vozů, provize)
  (admin)/   → BackOffice admin panel
  api/       → API routes
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
