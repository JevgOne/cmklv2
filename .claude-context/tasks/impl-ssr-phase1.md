# IMPL: SSR migrace Fáze 1 — Login + Auth (8 stránek)

**Datum:** 2026-05-07
**Commit:** `2b81c9d`
**Status:** HOTOVO

## Změny

### Nové client component soubory (components/web/)
| Soubor | Export |
|--------|--------|
| `LoginForm.tsx` | `LoginForm` |
| `RegistrationForm.tsx` | `RegistrationForm` |
| `BrokerRegistrationForm.tsx` | `BrokerRegistrationForm` |
| `PartnerRegistrationForm.tsx` | `PartnerRegistrationForm` |
| `SupplierRegistrationForm.tsx` | `SupplierRegistrationForm` |
| `ForgotPasswordForm.tsx` | `ForgotPasswordForm` |
| `ResetPasswordForm.tsx` | `ResetPasswordForm` (props: `{ token: string }`) |
| `VerifyEmailErrorContent.tsx` | `VerifyEmailErrorContent` |

### Migrované page.tsx soubory (všechny nyní Server Components)
| Stránka | Metadata | Suspense | Skeleton |
|---------|----------|----------|----------|
| `(web)/login/page.tsx` | title + description | ano | 2x input + 1x button pulse |
| `(web)/registrace/page.tsx` | title + description | ano | card + 5x input pulse |
| `(web)/registrace/makler/page.tsx` | title + description | ano | spinner + text |
| `(web)/registrace/partner/page.tsx` | title + description | ano | card + 6x input pulse |
| `(web)/registrace/dodavatel/page.tsx` | title + description | ano | card + 6x input pulse |
| `(web)/zapomenute-heslo/page.tsx` | title + description | ano | 1x input + 1x button pulse |
| `(web)/reset-hesla/[token]/page.tsx` | title + description | ano | 2x input + 1x button pulse |
| `(web)/overeni-emailu/chyba/page.tsx` | title + description | ano (již existovalo) | min-h div |

### Vzor pro každou stránku
1. `"use client"` odstraněn z page.tsx
2. `export const metadata: Metadata` přidáno
3. SSR shell (layout, nadpisy, statický obsah) renderováno na serveru
4. Formulář vložen jako `<Suspense><ClientForm /></Suspense>`
5. Skeleton fallback odpovídá struktuře finálního obsahu

## Ověření
- **Build:** OK (0 errors)
- **Lint:** OK (0 errors, 684 pre-existing warnings)
- **TypeScript:** OK (0 errors)

## Poznámky
- `reset-hesla/[token]/page.tsx`: token se čte přes `await params` v async Server Component a předává se jako prop do `ResetPasswordForm`
- `overeni-emailu/chyba/page.tsx`: `ErrorContent` přejmenován na `VerifyEmailErrorContent` a přesunut do components/web/ pro konzistenci
- `registrace/makler/page.tsx`: skeleton používá spinner (jako original loading state) protože stránka validuje invitation token
