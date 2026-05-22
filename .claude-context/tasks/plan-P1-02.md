# Plan P1-02: Sjednotit wantBrokerHelp / wantsBrokerHelp

**Priorita:** P1
**Slozitost:** S
**Zavislosti:** ZADNE
**Batch:** 1

---

## Cil

Sjednotit nazev pole na `wantsBrokerHelp` v celem kodu. Odstranit fallback logiku v API route a duplicitni pole v Zod schema. Prisma schema a DB jiz pouzivaji `wantsBrokerHelp` — problem je jen na klientu.

---

## Analyza

Grep vysledky ukazuji:

| Soubor | Stav | Pouziva |
|--------|------|---------|
| `prisma/schema.prisma:648` | ✓ OK | `wantsBrokerHelp` |
| `lib/validators/listing.ts:53` | ✓ OK | `wantsBrokerHelp` |
| `app/api/listings/route.ts:58` | ✓ OK | `wantsBrokerHelp` (ale radek 59 ma navic `wantBrokerHelp`) |
| `app/api/listings/route.ts:77-78` | ✗ WORKAROUND | fallback `data.wantsBrokerHelp \|\| data.wantBrokerHelp` |
| `components/web/listing-form/ListingFormWizard.tsx:59` | ✗ SPATNE | `wantBrokerHelp: boolean` (v type) |
| `components/web/listing-form/ListingFormWizard.tsx:109` | ✗ SPATNE | `wantBrokerHelp: false` (default) |
| `components/web/listing-form/ListingFormWizard.tsx:176` | ✓ OK | `wantsBrokerHelp: data.wantBrokerHelp` (preklad, ale neprehledny) |
| `components/web/listing-form/Step5PriceContact.tsx:180-181` | ✗ SPATNE | `data.wantBrokerHelp` |
| `components/web/listing-form/Step6Preview.tsx:195` | ✗ SPATNE | `data.wantBrokerHelp` |

---

## Kroky implementace

### Krok 1: Opravit ListingFormWizard.tsx — typ a default

**Soubor:** `components/web/listing-form/ListingFormWizard.tsx`

**Radek 59:** Zmenit typ
```diff
-  wantBrokerHelp: boolean;
+  wantsBrokerHelp: boolean;
```

**Radek 109:** Zmenit default
```diff
-  wantBrokerHelp: false,
+  wantsBrokerHelp: false,
```

**Radek 176:** Zjednodusit (uz nepotrebujeme preklad)
```diff
-  wantsBrokerHelp: data.wantBrokerHelp,
+  wantsBrokerHelp: data.wantsBrokerHelp,
```

### Krok 2: Opravit Step5PriceContact.tsx

**Soubor:** `components/web/listing-form/Step5PriceContact.tsx`

**Radky 180-181:**
```diff
-  checked={data.wantBrokerHelp}
-  onChange={(e) => update("wantBrokerHelp", e.target.checked)}
+  checked={data.wantsBrokerHelp}
+  onChange={(e) => update("wantsBrokerHelp", e.target.checked)}
```

### Krok 3: Opravit Step6Preview.tsx

**Soubor:** `components/web/listing-form/Step6Preview.tsx`

**Radek 195:**
```diff
-  {data.wantBrokerHelp && (
+  {data.wantsBrokerHelp && (
```

### Krok 4: Odstranit duplicitni pole z API route Zod schema

**Soubor:** `app/api/listings/route.ts`

**Radek 59:** Odstranit
```diff
   wantsBrokerHelp: z.boolean().default(false),
-  wantBrokerHelp: z.boolean().optional(),
```

**Radky 77-78:** Zjednodusit
```diff
-  // Resolve wantBrokerHelp vs wantsBrokerHelp mismatch
-  const wantsBrokerHelp = data.wantsBrokerHelp || data.wantBrokerHelp || false;
+  const wantsBrokerHelp = data.wantsBrokerHelp;
```

---

## Soubory k uprave

| Soubor | Radky | Zmena |
|--------|-------|-------|
| `components/web/listing-form/ListingFormWizard.tsx` | 59, 109, 176 | `wantBrokerHelp` -> `wantsBrokerHelp` |
| `components/web/listing-form/Step5PriceContact.tsx` | 180-181 | `wantBrokerHelp` -> `wantsBrokerHelp` |
| `components/web/listing-form/Step6Preview.tsx` | 195 | `wantBrokerHelp` -> `wantsBrokerHelp` |
| `app/api/listings/route.ts` | 59, 77-78 | Odstranit duplicitni pole + fallback |

## Overeni

- [ ] Grep `wantBrokerHelp` (bez "s") vraci 0 vysledku v src kodu (jen v .claude-context/)
- [ ] Formular pro podani inzeratu funguje — checkbox "Chci pomoc maklere" funguje
- [ ] API POST /api/listings prijima `wantsBrokerHelp` a uklada do DB
- [ ] Preview (Step6) zobrazuje spravne pokud je zatrznuto
- [ ] Build prochazi bez TypeScript chyb
