# Plán: TASK-048 — PWA Onboarding průvodce — audit a vylepšení

**Datum:** 2026-04-25
**Autor:** Plánovač
**Priorita:** STŘEDNÍ
**Typ:** Audit + plán vylepšení

---

## Stávající onboarding — kompletní přehled

### Architektura

```
app/(pwa)/makler/onboarding/
├── layout.tsx          ← Client layout s OnboardingProgress komponentou
├── page.tsx            ← Router — redirectuje na aktuální krok dle session.user.onboardingStep
├── profile/page.tsx    ← Krok 1: deleguje na ProfileForm
├── documents/page.tsx  ← Krok 2: deleguje na DocumentUpload
├── training/page.tsx   ← Krok 3: TrainingSlides → QuizForm (dvě fáze)
├── contract/page.tsx   ← Krok 4: deleguje na ContractSign
└── approval/page.tsx   ← Krok 5: statická čekací stránka

components/pwa/onboarding/
├── OnboardingProgress.tsx  ← 5-step progress bar (desktop + mobile)
├── ProfileForm.tsx         ← Formulář: foto, bio, specializace, města, IBAN
├── DocumentUpload.tsx      ← Upload: živnostenský list, OP přední + zadní
├── TrainingSlides.tsx      ← 4 slidů o fungování Carmakler
├── QuizForm.tsx            ← 10 otázek, 80% pass rate
└── ContractSign.tsx        ← Zobrazení smlouvy + SignatureCanvas + souhlas

app/api/onboarding/
├── profile/route.ts    ← PUT: uloží profil, posune na step 2
├── documents/route.ts  ← POST: upload 3 dokumentů, posune na step 3
├── quiz/route.ts       ← POST: vyhodnocení kvízu server-side, posune na step 4
└── contract/route.ts   ← GET: načte smlouvu, POST: podepíše, posune na step 5
```

### DB model (User)

```
onboardingStep    Int     @default(1)    // 1-5
onboardingCompleted Boolean @default(false)
status            String  @default("ONBOARDING")  // při registraci makléře
quizScore         Int?    // výsledek kvízu v %
documents         String? // JSON: { tradeLicense, idFront, idBack }
brokerSignature   String? // base64 PNG podpisu
brokerContractUrl String? // JSON obsah podepsané smlouvy
```

---

## Detailní popis každého kroku

### Krok 1: Profil (`/makler/onboarding/profile`)

**Komponenta:** `ProfileForm.tsx` (169 řádků)

**Pole:**
| Pole | Typ | Povinné | Validace |
|------|-----|---------|----------|
| Profilová fotka | File (JPG/PNG, max 5 MB) | Ne | Server: upload, ale pokračuje i bez |
| O mně (bio) | Textarea | Ne | — |
| Specializace | Checkbox grid | Ne | Z `BROKER_SPECIALIZATIONS.vehicleTypes` |
| Města působnosti | Input (čárkou) | Ano | Server: `citiesArray.length > 0` |
| IBAN | Input | Ano | Server: `iban?.trim()` (jen non-empty check) |

**API:** `PUT /api/onboarding/profile` → uloží do User, `onboardingStep = 2`

**Poznámky:**
- Fotka je volitelná a pokud upload selže, pokračuje se dál (resilientní)
- Specializace používá sdílený `BROKER_SPECIALIZATIONS` katalog
- IBAN validace je jen non-empty — **chybí formátová validace** (viz P3)

### Krok 2: Dokumenty (`/makler/onboarding/documents`)

**Komponenta:** `DocumentUpload.tsx` (182 řádků)

**Dokumenty:**
| Slot | Label | Formáty | Max velikost |
|------|-------|---------|-------------|
| `trade_license` | Živnostenský list | PDF, JPG, PNG | 10 MB |
| `id_front` | OP — přední strana | JPG, PNG | 10 MB |
| `id_back` | OP — zadní strana | JPG, PNG | 10 MB |

**API:** `POST /api/onboarding/documents` → upload do Cloudinary, `onboardingStep = 3`

**Poznámky:**
- Drag & drop + click-to-browse
- Všechny 3 dokumenty jsou povinné
- Server validuje typ souboru (`ALLOWED_TYPES`) a velikost (`MAX_FILE_SIZE`)
- Dokumenty se ukládají jako JSON string do `User.documents`

### Krok 3: Školení + Kvíz (`/makler/onboarding/training`)

**Fáze A — Training Slides** (`TrainingSlides.tsx`, 142 řádků)

4 slidů:
1. "Jak funguje Carmakler" — 4 body o platformě
2. "Jak nabrat auto" — 5 bodů o procesu nabírání
3. "Jednání s prodejcem" — 5 bodů o profesionalitě
4. "Právní minimum" — 5 bodů o smlouvách a GDPR

Navigace: Zpět / Další / "Přejít na kvíz" (po posledním slidu)

**Fáze B — Quiz** (`QuizForm.tsx`, 216 řádků)

10 otázek (multiple-choice, 4 možnosti):
1. Minimální provize makléře → 25 000 Kč
2. První krok před inzercí → Podpis makléřské smlouvy
3. Procento provize → 5%
4. Nástroj pro načtení údajů → VIN dekodér
5. Minimální počet fotek → 15
6. Kdy se vyplácí provize → Po úspěšném prodeji a úhradě
7. Garantovaný prodej → Ne, nikdy
8. Co se stane po zadání → BackOffice schválí
9. Jak často informovat prodejce → Pravidelně
10. Funguje PWA offline → Ano, plně

**Pass threshold:** 80% (8/10)

**API:** `POST /api/onboarding/quiz` → server-side vyhodnocení (správné odpovědi jsou na serveru, klient nemůže podvrhnout skóre), `onboardingStep = 4`

**Při neúspěchu:** Zobrazí výsledek + umožní retry (neomezený počet pokusů)

### Krok 4: Smlouva (`/makler/onboarding/contract`)

**Komponenta:** `ContractSign.tsx` (151 řádků)

**Flow:**
1. GET `/api/onboarding/contract` — načte HTML smlouvy (generováno z `generateBrokerAgreement()`)
2. Zobrazení smlouvy ve scrollable kontejneru (max 400px výška)
3. `SignatureCanvas` — kreslení podpisu prstem/myší
4. Checkbox: "Souhlasím s podmínkami spolupráce"
5. POST `/api/onboarding/contract` — uloží podpis + obsah smlouvy

**API:** POST uloží `brokerSignature` (base64), `brokerContractUrl` (JSON obsah), `onboardingStep = 5`, `onboardingCompleted = true`

**HTML sanitizace:** Používá `DOMPurify.sanitize()` na obsah smlouvy — bezpečné.

### Krok 5: Čekání na schválení (`/makler/onboarding/approval`)

**Stránka:** Statická informační stránka (žádná komponenta)

**Obsah:** "Čekáme na schválení vašeho účtu" + "Obvykle do 24 hodin"

**Po schválení:** Admin/Manager změní `status: ONBOARDING → ACTIVE`, makléř se přihlásí a je přesměrován na dashboard.

---

## Nalezené problémy

### P1. Texty bez diakritiky (NÍZKÁ)

**Soubory:** Několik onboarding stránek a komponent má texty bez diakritiky.

**Příklady:**
- `profile/page.tsx:6` — "Vas profil" → "Váš profil"
- `profile/page.tsx:8` — "Vyplnte zakladni informace o sobe" → "Vyplňte základní informace o sobě"
- `documents/page.tsx` — (deleguje na komponentu, texty v komponentě OK)

**Fix:** Projít všechny stránky v `onboarding/` a opravit diakritiku v UI textech.

### P2. Chybí zpětná navigace v onboarding krocích (NÍZKÁ)

**Problém:** Makléř nemůže se vrátit na předchozí krok (např. z dokumentů zpět na profil). Progress bar je vizuální, ne klikatelný. Pokud udělá chybu v profilu, nemá jak se vrátit.

**Stav:** Technicky se může vrátit přes URL, protože kontrola `onboardingStep` je jen na API úrovni (posun vpřed), ne na stránce. Ale UI to nepodporuje.

**Fix:** Přidat "Zpět" tlačítko na kroky 2-4 (ne na krok 1 — první krok, ne na krok 5 — čekání). Alternativně: udělat čísla v progress baru klikatelná pro již dokončené kroky.

### P3. IBAN validace je nedostatečná (NÍZKÁ)

**Soubor:** `app/api/onboarding/profile/route.ts:45-49`

**Problém:** Server validuje IBAN jen jako `iban?.trim()` (non-empty). Neprovádí formátovou validaci (CZ IBAN = "CZ" + 22 číslic). Makléř může zadat cokoliv.

**Fix:** Přidat IBAN formátovou validaci:
```typescript
const ibanRegex = /^CZ\d{22}$/;
if (!ibanRegex.test(iban.replace(/\s/g, ""))) {
  return NextResponse.json({ error: "Neplatný formát IBAN" }, { status: 400 });
}
```

### P4. Onboarding step enforcement na stránkách (INFO)

**Problém:** Stránky onboardingu nekontrolují, zda makléř je na správném kroku. Např. makléř na kroku 1 může ručně navštívit `/makler/onboarding/contract` — stránka se zobrazí, ale API POST selže (protože step se kontroluje v API).

**Hodnocení:** Funkčně OK — API je zabezpečené. Ale UX by mohlo být lepší — redirect na správný krok. Hlavní router (`page.tsx`) to řeší jen při prvním vstupu.

**Fix (volitelný):** V layout.tsx načíst aktuální `onboardingStep` ze session a redirectovat na správný krok pokud pathname neodpovídá.

### P5. Quiz odpovědi viditelné v klientském kódu (INFO)

**Soubor:** `components/pwa/onboarding/QuizForm.tsx`, řádky 15-66

**Problém:** `correctIndex` je v klientském kódu. Technicky motivovaný makléř může najít správné odpovědi v JS bundle.

**Hodnocení:** Server-side vyhodnocení (`CORRECT_ANSWERS` v `api/onboarding/quiz/route.ts`) zajišťuje, že podvržené odpovědi neprojdou. `correctIndex` v klientu se používá jen pro vizuální feedback (zelená/červená) po odeslání. **Není to bezpečnostní problém** — kvíz je vzdělávací, ne certifikační.

**Fix (volitelný):** Odebrat `correctIndex` z klientu a po odeslání na server vrátit `correctAnswers` v response pro vizuální feedback. Ale je to over-engineering pro vzdělávací kvíz.

### P6. Chybí notifikace pro managera po dokončení onboardingu (STŘEDNÍ)

**Problém:** Po kroku 5 (podpis smlouvy + `onboardingCompleted = true`) se neposílá žádná notifikace managerovi/adminovi, že nový makléř čeká na aktivaci. Manager musí sám kontrolovat admin panel.

**Fix:** Po úspěšném POST na `/api/onboarding/contract`:
```typescript
// Notifikovat managera
const broker = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { managerId: true, firstName: true, lastName: true },
});

if (broker?.managerId) {
  await prisma.notification.create({
    data: {
      userId: broker.managerId,
      type: "BROKER_ONBOARDING_COMPLETE",
      title: "Nový makléř čeká na aktivaci",
      body: `${broker.firstName} ${broker.lastName} dokončil/a onboarding a čeká na schválení.`,
    },
  });
}
```

---

## Shrnutí problémů

| # | Problém | Priorita | Typ | Soubor |
|---|---------|----------|-----|--------|
| P6 | Chybí notifikace managerovi po dokončení | STŘEDNÍ | FUNKCE | `api/onboarding/contract/route.ts` |
| P1 | Texty bez diakritiky | NÍZKÁ | UX | Onboarding stránky |
| P2 | Chybí zpětná navigace | NÍZKÁ | UX | Layout/stránky |
| P3 | IBAN validace nedostatečná | NÍZKÁ | VALIDACE | `api/onboarding/profile/route.ts` |
| P4 | Step enforcement na stránkách | INFO | UX | Layout |
| P5 | Quiz odpovědi v klientu | INFO | DESIGN | `QuizForm.tsx` |

---

## Celkové hodnocení

Onboarding flow je **dobře implementovaný a kompletní**:

**Silné stránky:**
- 5 jasných kroků s vizuálním progress barem (desktop + mobile responsive)
- Server-side vyhodnocení kvízu (odpovědi nelze podvrhnout)
- DOMPurify sanitizace obsahu smlouvy
- Upload dokumentů s validací typu a velikosti
- Resilientní design — fotka je volitelná, email verifikace neblokuje
- SignatureCanvas pro elektronický podpis
- Atomické DB updaty (step + data v jednom update)
- Každý krok má vlastní loading.tsx a error.tsx

**Doporučené opravy (3):**
1. **P6** — Přidat notifikaci managerovi po dokončení onboardingu (~10 řádků)
2. **P1** — Opravit diakritiku v textech (~5 míst)
3. **P3** — Přidat IBAN formátovou validaci (~5 řádků)

**Volitelná vylepšení (2):**
4. **P2** — Zpětná navigace v onboarding krocích
5. **P4** — Step enforcement na stránkách (redirect na správný krok)

**Žádné kritické problémy nenalezeny.**
