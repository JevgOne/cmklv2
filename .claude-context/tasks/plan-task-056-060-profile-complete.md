# Master Plan — TASK-056/057/058/059/060 · Unified Broker Profile Complete

**Scope:** 5 navazujících úkolů na `/profil/[slug]` (unified broker profile) + editor v `/muj-ucet/profil` + onboarding propojení.
**Žádné nové DB migrace nejsou nutné.** Všechna pole (`services`, `languageSkills`, `specializations`, `coverPhoto`, `avatar`, …) jsou v `schema.prisma` (User model, řádky 38–55).

---

## Master overview — pořadí implementace

Pořadí optimalizováno dle **rizika / závislostí / hodnoty**:

| # | Task | Typ | Velikost | Závislost |
|---|------|------|----------|-----------|
| 1 | **TASK-057** — Jazyky (styl tagů) | kosmetika | 15 min | — |
| 2 | **TASK-058** — Prodaná auta (hero metric) | UI + DB count | 20 min | — |
| 3 | **TASK-059** — Rozšíření specializací (služby) | shared lib + UI | 60 min | sdílený `lib/broker-specializations.ts` |
| 4 | **TASK-056** — Sjednotit vehicle karty | API expand + shared card | 60–90 min | sdílený `lib/vehicle-labels.ts` |
| 5 | **TASK-060** — Onboarding propojení + completeness | wizard + upload | 120–180 min | **057, 059 hotové** (kroky wizardu) |

**Rationale:** 057/058 jsou self-contained low-risk warm-up. 059 vytváří centrální taxonomii používanou v 060. 056 je isolovaný (VehicleCard integrace). 060 je orchestrátor, potřebuje mít stabilní pole z 059.

**Důležité:** před kódováním 056/060 **extract** sdílených utilit (viz sekce „Sdílené utility"). Sníží duplicity a umožní testovat isolated.

---

## TASK-057 — Jazyky (styl tagů)

Beze změn oproti původnímu plánu — viz `plan-task-056-058-profile-improvements.md` sekce TASK-057. Shrnutí:

### Stav
- `User.languageSkills` (Json?) existuje; editor v `/muj-ucet/profil` (řádky 413–434) funguje; profil ho renderuje jako plain text (`ProfileClient.tsx:471–480` — `{languages.join(", ")}`).

### Strategie
**(B) Sladit styl** — kosmetická změna, ne feature.

### Soubory
- `app/(web)/profil/[slug]/ProfileClient.tsx` — blok 471–480.

### Code skeleton
```tsx
{languages.length > 0 && (
  <div>
    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Jazyky</h3>
    <div className="flex flex-wrap gap-1.5">
      {languages.map((lang) => (
        <span key={lang} className="text-xs font-medium bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
          {lang}
        </span>
      ))}
    </div>
  </div>
)}
```

### Akceptace
1. Sekce „Jazyky" renderuje pill tagy (orange-50/orange-700) místo plain text.
2. Při `languageSkills = []` / null se sekce neobjeví (guard `hasSpecCard` už existuje).
3. Editor v `/muj-ucet/profil` beze změny — změny se propagují.

---

## TASK-058 — Prodaná auta (hero metric)

Beze změn oproti původnímu plánu — shrnutí:

### Stav
- `User.totalSales` existuje + `stats.totalSales` se už renderuje v hero (ProfileClient.tsx:330) ale jen když `> 0`, s labelem „Prodeje".

### Strategie
**(A) Hero metric + label „Prodáno" + authoritative count z DB** — gamifikace může zaostat, `count()` z DB je real-time.

### Soubory
- `app/(web)/profil/[slug]/ProfileClient.tsx` (block 330 — label + role gate).
- `app/(web)/profil/[slug]/page.tsx` (přidat `prisma.vehicle.count` + `prisma.listing.count` do `Promise.all`).

### Code skeleton
```tsx
// page.tsx — v Promise.all
prisma.vehicle.count({ where: { brokerId: user.id, status: "SOLD" } }),
prisma.listing.count({ where: { userId: user.id, status: "SOLD" } }),
// → stats.totalSales = vehicleSold + listingSold (fallback na user.totalSales pokud 0/null)

// ProfileClient.tsx — hero row
{["BROKER", "MANAGER", "REGIONAL_DIRECTOR"].includes(user.role) && (
  <Stat value={stats.totalSales} label="Prodáno" />
)}
```

### Akceptace
1. Pro BROKER/MANAGER/REGIONAL_DIRECTOR je „X Prodáno" vždy v hero (i když 0).
2. Hodnota = `Vehicle.count(SOLD) + Listing.count(SOLD)`.
3. Pro ostatní role se metrika neukazuje.
4. Zero state („0 Prodáno") se zobrazí místo skrytí.

---

## TASK-059 — Rozšířit specializace o služby (NOVÉ)

### Stav
- `User.specializations` (String? — JSON array) — dnes drží typy vozidel: `["SUV", "Luxury", ...]`.
- `User.services` (Json?) — dnes drží služby: `["Dovoz", "Prověrka", "Financování", "Pojištění", "STK"]`.
- `User.favoriteBrands` (String? — JSON array) — dnes drží značky.
- **Editor** v `/muj-ucet/profil/page.tsx`:
  - `SPECIALIZATION_OPTIONS` (ř. 43–45): `["SUV", "Veterány", "Elektro", "Užitkové", "Luxusní", "Sportovní"]`
  - `SERVICE_OPTIONS` (ř. 47–49): `["Dovoz", "Prověrka", "Financování", "Pojištění", "STK"]`
  - `BRAND_OPTIONS` (ř. 36–41): 20 značek hardcoded
- **Profil renderer** `ProfileClient.tsx:431–494` — už má 3 sekce (`services`, `specs`, `languages`) → jen chybí **pokrytí Carmakler ekosystému** (VIP, inzerce, prodej dílů, přeprava, CEBIA, …).
- **Onboarding** (`components/pwa/onboarding/ProfileForm.tsx`) má `SPECIALIZATIONS = ["personal", "suv", "van", "luxury", "electric"]` — **drift** vůči editoru (jiné hodnoty i jazyk!).

### Klíčové rozhodnutí: rozšířit options, **NE schema**
- Stávající 2 pole (`specializations`, `services`) pokrývají use case. **Nepřidávat třetí pole** (např. `ecosystemSpecs`) — uživatel nevidí rozdíl, string array stačí.
- Vyřeší se **rozšířením option listů** + **centrálním zdrojem pravdy** (`lib/broker-specializations.ts`) sdíleným mezi editor / onboarding / profil.
- **Žádná DB migrace.** Pole už v schematu jsou (String? / Json?).

### Strategie — jediný shared catalog
Vytvořit `lib/broker-specializations.ts`:

```ts
/** Typy vozidel — ukládá se do User.specializations (JSON array) */
export const VEHICLE_TYPE_OPTIONS = [
  "Osobní", "SUV", "Dodávky", "Kamiony", "Motocykly",
  "Elektromobily", "Veterány", "Luxusní", "Sportovní", "Užitkové",
] as const;

/** Služby napříč Carmakler ekosystémem — ukládá se do User.services (Json) */
export const SERVICE_OPTIONS = [
  // Makléřská síť
  "Výkup vozů",
  "Prodej vozů",
  "Zprostředkování",
  // Finance & pojištění
  "Financování vozu",
  "Pojištění vozu",
  "Leasing",
  // Inzerce & marketplace
  "Inzerce vozu",
  "Marketplace VIP",
  // Eshop díly
  "Prodej dílů",
  "Dovoz dílů",
  // Služby kolem
  "Dovoz ze zahraničí",
  "Přepis vozu",
  "Prověření auta / VIN (CEBIA)",
  "Přeprava vozu",
  "STK / emise",
  "Servis / opravy",
] as const;

/** Značky — zatím lokální, v budoucnu lze napojit na BADGE_CATALOG */
export const BRAND_OPTIONS = [
  "Škoda", "Volkswagen", "BMW", "Audi", "Mercedes-Benz",
  "Hyundai", "Toyota", "Ford", "Opel", "Peugeot",
  "Citroën", "Renault", "Seat", "Kia", "Mazda",
  "Volvo", "Honda", "Nissan", "Suzuki", "Dacia",
] as const;

/** Service groupings pro UI — zobrazit jako subheadery v editoru */
export const SERVICE_GROUPS: Record<string, readonly string[]> = {
  "Prodej & výkup": ["Výkup vozů", "Prodej vozů", "Zprostředkování"],
  "Finance": ["Financování vozu", "Pojištění vozu", "Leasing"],
  "Inzerce & investice": ["Inzerce vozu", "Marketplace VIP"],
  "Díly": ["Prodej dílů", "Dovoz dílů"],
  "Doplňkové služby": ["Dovoz ze zahraničí", "Přepis vozu", "Prověření auta / VIN (CEBIA)", "Přeprava vozu", "STK / emise", "Servis / opravy"],
};

export type VehicleType = typeof VEHICLE_TYPE_OPTIONS[number];
export type Service = typeof SERVICE_OPTIONS[number];
export type Brand = typeof BRAND_OPTIONS[number];
```

### Soubory k úpravě
1. **nový** `lib/broker-specializations.ts` (viz skeleton výše)
2. `app/(web)/muj-ucet/profil/page.tsx` — smazat lokální `SPECIALIZATION_OPTIONS`, `SERVICE_OPTIONS`, `BRAND_OPTIONS` + importovat ze sdíleného souboru + Služby sekce rozdělit do podsekcí dle `SERVICE_GROUPS`.
3. `components/pwa/onboarding/ProfileForm.tsx` — smazat lokální `SPECIALIZATIONS` + sjednotit hodnoty (CZ label, ne `value/label` dvojice) s `VEHICLE_TYPE_OPTIONS`. Přidat Služby sekci (aby se i v onboardingu nastavovaly).
4. `app/api/profile/edit/route.ts` — Zod schema už má `services`, `specializations` jako `z.array(z.string())` — **nechat** (nepřidávat enum, aby migrace starých dat neuvázly).
5. `app/api/onboarding/profile/route.ts` — rozšířit formData o `services` + uložit do `user.services`.
6. `app/(web)/profil/[slug]/ProfileClient.tsx` — **beze změn** (už renderuje všechny 3 sekce).

### UI návrh editoru (`/muj-ucet/profil`)

**Služby karta** místo flat listu rozdělit do skupin:
```tsx
{Object.entries(SERVICE_GROUPS).map(([group, items]) => (
  <div key={group} className="mb-4">
    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">{group}</h4>
    <div className="flex flex-wrap gap-2">
      {items.map((s) => <TogglePill key={s} label={s} active={services.includes(s)} onToggle={...} color="blue" />)}
    </div>
  </div>
))}
```

Extrahovat `<TogglePill>` (komponentu) — dnes 3x duplikovaná v `muj-ucet/profil/page.tsx` (specializace/služby/jazyky).

### DB změny — **ŽÁDNÉ**
- `services: Json?` a `specializations: String?` jsou polymorfní (string array), rozšíření option listů = pouze UI/validace. Stará data (např. user s service=„Dovoz") zůstanou platná, jen se přeloží na novou label variantu (pokud se změní naming).
- **Pozor:** pokud změníme label `"Dovoz"` → `"Dovoz ze zahraničí"`, stará data zůstanou „Dovoz" a nebudou match v UI (ukážou se na profilu, nebudou zaškrtnutá v editoru). **Řešení:** buď v Zod schematu povolit i staré hodnoty (což už umožňuje `z.string().max(50)`) + v editoru udělat `includes()` match „Dovoz" → mapper na novou label, NEBO zachovat původní hodnoty a přidávat jen nové. **Doporučení: zachovat původní hodnoty, jen přidat nové služby.** (Varianta low-risk, žádný cleanup starých uživatelů nutný.)

### Akceptace
1. `lib/broker-specializations.ts` je single source of truth — editor i onboarding i kdekoliv jinde importují odsud.
2. V `/muj-ucet/profil` má sekce „Služby" 5 podskupin (Prodej, Finance, Inzerce & VIP, Díly, Doplňky) — celkem 16 služeb z Carmakler ekosystému.
3. V profilu (`/profil/[slug]`) se nové služby (Marketplace VIP, Financování vozu, Prodej dílů, …) renderují jako pill tagy (beze změn renderer kódu — jsou to stále strings).
4. Starí uživatelé (services=["Dovoz", "STK"]) vidí svá data normálně — stará hodnota „Dovoz" je zpětně kompatibilní. (STK je v nové variantě „STK / emise", tj. drift — viz poznámka níže.)
5. `npm run build` + `npm run lint` projdou.

**Poznámka o driftu:** pokud lead povolí přesné přejmenování (např. `"STK"` → `"STK / emise"`), udělat SQL migration v post-deploy skriptu (`UPDATE users SET services = ... WHERE ...`). Mimo rozsah tohoto plánu — první iterace je aditivní.

---

## TASK-056 — Sjednotit vehicle karty

Beze změn oproti původnímu plánu — shrnutí + drobná aktualizace:

### Stav
- `ProfileItemCard` v `ProfileClient.tsx:830–889` — custom aspect-square overlay s LikeButton + CommentSection.
- `/nabidka/page.tsx:294` — `VehicleCard` standardní karta (aspect 4/3, badge, TrustScore, favorite, „Detail →").
- **API `/api/profile/[slug]/items`** vrací okleštěný set polí (chybí `transmission`, `enginePower`, `trustScore`, `variant`, `sellerType`, `broker`).

### Strategie
**(A) Sdílet `VehicleCard`** — sjednocená UX + odstraní 150 řádků duplicit.

### Soubory
1. **nový** `lib/vehicle-labels.ts` — extract fuel/transmission CZ label mapů z `nabidka/page.tsx`.
2. `app/api/profile/[slug]/items/route.ts` — rozšířit `select` pro `vehicles` i `listings` tab.
3. `app/(web)/profil/[slug]/ProfileClient.tsx` — v `ProfileItemCard` pro `type === "vehicle" | "listing"` renderovat `<VehicleCard>` + LikeButton + CommentSection pod kartou.

### Code skeleton
```tsx
// ProfileItemCard — přidáno v type="vehicle"|"listing"
if (type === "vehicle" || type === "listing") {
  const car: VehicleData = mapItemToVehicleData(item, type);
  return (
    <div>
      <VehicleCard car={car} />
      <div className="flex items-center gap-3 mt-2 px-0.5">
        <LikeButton {...entityProps} initialCount={likeCount} size="sm" />
        {commentCount > 0 && <span className="text-xs text-gray-400">💬 {commentCount}</span>}
      </div>
      <CommentSection {...entityProps} initialCount={commentCount} />
    </div>
  );
}
```

### Akceptace
1. Vehicle karta na `/profil/[slug]` má stejný vizuál jako `/nabidka` (aspect 4/3, badge, TrustScore, favorite+compare, price, „Detail →").
2. Klik vede na `/nabidka/[slug]`.
3. LikeButton + CommentSection zůstávají funkční pod kartou.
4. API vrací `transmission`, `enginePower`, `trustScore`, `variant`, `sellerType`, `broker` pro profil items.
5. `npm run lint` + `npm run build` projdou.

---

## TASK-060 — Onboarding propojení + completeness indikátor (NOVÉ)

### Stav
- **Existují 3 onboarding flow:**
  - `app/(pwa)/makler/onboarding/*` — 5 kroků (profile → documents → training → contract → approval). Router read z `session.user.onboardingStep`. Profil form v `components/pwa/onboarding/ProfileForm.tsx` — pouze **5 polí** (photo, bio, specializations, cities, iban). Chybí: motto, jazyky, služby, social, yearsExperience, website.
  - `app/(pwa-parts)/parts/onboarding/*` — onboarding pro PARTS_SUPPLIER (paralelní).
  - `app/(partner)/partner/onboarding/*` — onboarding pro PARTNER_VRAKOVISTE/BAZAR.
- **Editor** `/muj-ucet/profil/page.tsx` — má **všechna** pole (single-page, 10 karet) ale uživatel se do něj musí sám prokliknout po onboardingu.
- **Upload**: `/api/upload/route.ts` existuje s presets `vehicles, listings, parts, invoices, contracts, damages` — **chybí preset `avatar` + `cover`** (dnes používá inline `uploadToServer(file, 'carmakler/avatars/${userId}')` v `api/onboarding/profile`).
- **Cover foto** se dnes ukládá **jen jako Cloudinary URL string** do `user.coverPhoto` přes editor (uživatel ručně vkládá URL — ne upload widget!). Viz `/muj-ucet/profil/page.tsx:242–253`.
- **Žádný ProfileCompleteness** komponent neexistuje (ověřeno grepem).

### Uživatelský záměr (overcloaking)
„dodelej to: aby se to propojilo a všechny tyhle otazky to davalo při zakladaní profilu, fotku vybrat aby šla uložit do DB atd"
→ 3 subproblémy:
1. **Onboarding = editor field parity.** Rozšířit onboarding `ProfileForm` o všechna pole z editoru (nebo udělat multi-step wizard). Makléř po onboardingu má kompletní profil.
2. **Cover + avatar upload flow.** Dnes je avatar upload jen v onboardingu (FormData → `uploadToServer`). V editoru je to **plain URL input** — UX fail. Potřeba widget s fájl picker + Cloudinary save.
3. **Completeness UX.** Jasný signál „dokonči profil" pro uživatele co onboarding přeskočili/dělali ve starší verzi (existující brokeri).

### Strategie — doporučená **varianta A+B hybrid**

**Varianta A (single-page editor)** — low risk, MVP, zachová existující stránku `/muj-ucet/profil` — jen upgrade cover/avatar na upload widget.
**Varianta B (multi-step wizard)** — flashy, pro nové uživatele, na URL `/muj-ucet/profil/setup`.
**Hybrid: udělat obojí.**
- Editor v `/muj-ucet/profil` zůstane (pro pokročilou editaci po onboardingu). **Upgrade:** plain URL inputs → upload widget (`<ImageUpload>`).
- Nový **wizard** na `/muj-ucet/profil/setup` — 5 kroků, každý krok ukládá inkrementálně, „Přeskočit" skip.
- **Dashboard hero banner** (pokud `getCompleteness() < 80`) → CTA „Dokončit profil" → redirect na wizard.

**Rationale:** wizard je motivační pro incomplete profily (gated onboarding completion), single-page editor je pragmatický pro rychlé úpravy. Oba sdílejí stejné API (`/api/profile/edit`).

### Soubory — CREATE

#### 1. `components/ui/ImageUpload.tsx`
Sdílený upload widget — použije `/api/upload` s presetem `avatar` nebo `cover`.
```tsx
interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  preset: "avatar" | "cover";
  shape?: "circle" | "rect";
  aspectRatio?: string; // "16/5" pro cover, "1/1" pro avatar
  maxSize?: number; // bytes, default 5MB
}

export function ImageUpload({ value, onChange, preset, shape = "circle", aspectRatio }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const { url } = await res.json();
    onChange(url);
    setUploading(false);
  };

  return (
    <div className={cn("relative bg-gray-100 overflow-hidden cursor-pointer", shape === "circle" ? "rounded-full" : "rounded-lg")} style={{ aspectRatio }}>
      {value && <Image src={value} alt="" fill className="object-cover" />}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <button type="button" onClick={() => fileRef.current?.click()} className="...">
        {uploading ? "Nahrávám..." : value ? "Změnit" : "Nahrát"}
      </button>
      {value && <button onClick={() => onChange(null)}>×</button>}
    </div>
  );
}
```

#### 2. `lib/profile-completeness.ts`
Utility pro výpočet % kompletnosti — sdílené mezi backend (dashboard banner) + frontend (progress bar).
```ts
export interface ProfileCompletenessInput {
  avatar: string | null;
  coverPhoto: string | null;
  bio: string | null;
  city: string | null;
  motto: string | null;
  yearsExperience: number | null;
  website: string | null;
  specializations: string | null; // JSON array
  services: string[] | null;
  languageSkills: string[] | null;
  favoriteBrands: string | null; // JSON array
  socialLinks: { instagram?: string; facebook?: string; youtube?: string } | null;
  phone: string | null;
  showPhone: boolean;
  showEmail: boolean;
}

export function calculateProfileCompleteness(u: ProfileCompletenessInput): {
  percent: number;
  missing: Array<{ key: string; label: string; weight: number }>;
} {
  const checks = [
    { key: "avatar", label: "Profilová fotka", weight: 15, pass: !!u.avatar },
    { key: "coverPhoto", label: "Cover fotka", weight: 10, pass: !!u.coverPhoto },
    { key: "bio", label: "Bio (min 50 znaků)", weight: 15, pass: (u.bio?.length ?? 0) >= 50 },
    { key: "city", label: "Město", weight: 5, pass: !!u.city },
    { key: "specializations", label: "Typy vozidel", weight: 10, pass: (JSON.parse(u.specializations || "[]") as string[]).length > 0 },
    { key: "services", label: "Služby", weight: 10, pass: (u.services?.length ?? 0) > 0 },
    { key: "languageSkills", label: "Jazyky", weight: 5, pass: (u.languageSkills?.length ?? 0) > 0 },
    { key: "favoriteBrands", label: "Oblíbené značky", weight: 5, pass: (JSON.parse(u.favoriteBrands || "[]") as string[]).length > 0 },
    { key: "motto", label: "Motto", weight: 5, pass: !!u.motto },
    { key: "yearsExperience", label: "Roky zkušeností", weight: 5, pass: u.yearsExperience !== null },
    { key: "contactVisible", label: "Zobrazit telefon/email", weight: 10, pass: u.showPhone || u.showEmail },
    { key: "socialLinks", label: "Sociální sítě", weight: 5, pass: !!(u.socialLinks?.instagram || u.socialLinks?.facebook || u.socialLinks?.youtube) },
  ];
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.pass).reduce((s, c) => s + c.weight, 0);
  return {
    percent: Math.round((earned / total) * 100),
    missing: checks.filter((c) => !c.pass).map(({ key, label, weight }) => ({ key, label, weight })),
  };
}
```

#### 3. `components/web/ProfileCompletenessBar.tsx`
Banner na dashboardu (`/muj-ucet`).
```tsx
export function ProfileCompletenessBar({ percent, missing }: { percent: number; missing: Array<{ label: string }> }) {
  if (percent >= 100) return null;
  return (
    <Card className="p-5 bg-gradient-to-r from-orange-50 to-white border-l-4 border-orange-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Profil vyplněn z {percent}%</h3>
        <Link href="/muj-ucet/profil/setup" className="text-sm text-orange-600 font-semibold">Dokončit →</Link>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
      {missing.length > 0 && (
        <p className="text-xs text-gray-500">Chybí: {missing.slice(0, 3).map((m) => m.label).join(", ")}{missing.length > 3 && ` a ${missing.length - 3} dalších`}</p>
      )}
    </Card>
  );
}
```

#### 4. `app/(web)/muj-ucet/profil/setup/page.tsx` — wizard
Multi-step wizard (5 kroků), každý krok autosave přes `/api/profile/edit`.
```tsx
"use client";
const STEPS = [
  { id: "photos", label: "Fotky", component: PhotosStep },
  { id: "basics", label: "Základní", component: BasicsStep },      // jméno, město, motto, zkušenosti
  { id: "specializations", label: "Specializace", component: SpecStep }, // typy, služby, značky, jazyky
  { id: "contact", label: "Kontakt", component: ContactStep },     // website, social, showPhone/Email
  { id: "review", label: "Přehled", component: ReviewStep },
];

export default function ProfileSetupPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProfileData>(initialData);

  const saveAndNext = async () => {
    await fetch("/api/profile/edit", { method: "PUT", body: JSON.stringify(getCurrentStepData(step, data)) });
    setStep(step + 1);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepProgress steps={STEPS} current={step} />
      {STEPS[step].component({ data, onChange: setData, onNext: saveAndNext, onSkip: () => setStep(step + 1) })}
    </div>
  );
}
```

#### 5. `app/api/upload/route.ts` — rozšíření presets

**F6 ověřeno** (čtení `app/api/upload/route.ts:11`): skutečný tvar PRESETS je:
```ts
const PRESETS: Record<string, { folder: string; allowedTypes: string[]; watermark?: boolean; skipProcessing?: boolean }>
```
Oba flagy (`watermark`, `skipProcessing`) jsou **optional** — plánovaný tvar z dřívější verze (`watermark: false`) je syntakticky validní, ale idiomatičtější je flag vynechat. Finální diff:
```ts
const PRESETS = {
  // existing entries — beze změny
  vehicles: { folder: "carmakler/vehicles", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  listings: { folder: "carmakler/listings", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  parts: { folder: "carmakler/parts", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  invoices: { folder: "carmakler/invoices", allowedTypes: ALLOWED_DOC_TYPES, skipProcessing: true },
  contracts: { folder: "carmakler/contracts", allowedTypes: ALLOWED_DOC_TYPES, skipProcessing: true },
  damages: { folder: "carmakler/damages", allowedTypes: ALLOWED_IMAGE_TYPES, watermark: true },
  // NEW — watermark omitted (default undefined = no watermark over profile photos)
  avatar: { folder: "carmakler/avatars", allowedTypes: ALLOWED_IMAGE_TYPES },
  cover: { folder: "carmakler/covers", allowedTypes: ALLOWED_IMAGE_TYPES },
};
```
Pozn. `subfolder` parametr (existuje v POST handleru, `route.ts:38, 67`) zajistí per-user folder — `<ImageUpload>` pošle `subfolder = session.user.id` → výsledná cesta `carmakler/avatars/${userId}`.

### Soubory — EDIT

- `app/(web)/muj-ucet/layout.tsx` — **(F1)** přidat do `navItems` (ř. 7–15) novou položku `{ href: "/muj-ucet/profil/setup", label: "Nastavit profil" }` nebo sub-položku pod „Můj profil". Wizard musí být dosažitelný z nav, jinak uživatel po zavření bannerem k němu nemá cestu.
- `app/(web)/muj-ucet/profil/page.tsx` — plain URL input pro cover/avatar (řádky 242–253) **nahradit** `<ImageUpload>`. **(F1)** Přidat do horního rowu (vedle „Zobrazit veřejný profil →", ř. 227–234) sekundární CTA `<Link href="/muj-ucet/profil/setup">Spustit průvodce profilem →</Link>` — duplicitní entry point pro uživatele co přijdou do editoru a nevidí banner.
- `app/(web)/muj-ucet/page.tsx` (dashboard landing) — přidat `<ProfileCompletenessBar>` nahoru (server-side načíst `calculateProfileCompleteness` z DB data).
- `components/pwa/onboarding/ProfileForm.tsx` — rozšířit o **všechna** pole (stejný set jak wizard step „specializations" + „contact"). **Sdílet** step komponenty z `profil/setup` pokud jde — nebo aspoň spol. const `VEHICLE_TYPE_OPTIONS` + `SERVICE_OPTIONS` z `lib/broker-specializations.ts` (z TASK-059).
- `app/api/onboarding/profile/route.ts` — rozšířit formData schemu o `services`, `languageSkills`, `motto`, `yearsExperience`, `website`, `socialLinks`.

### DB změny — **ŽÁDNÉ**
- Všechna pole (`avatar`, `coverPhoto`, `motto`, `yearsExperience`, `website`, `socialLinks`, `services`, `languageSkills`, `specializations`, `showPhone`, `showEmail`, `warehouseAddress`, `openingHours`) **už existují** (viz schema.prisma:42–55).
- `onboardingStep` + `onboardingCompleted` už existují — wizard (na `/muj-ucet/profil/setup`) je **nezávislý** na broker onboardingu (`(pwa)/makler/onboarding/*`) — nepletení `onboardingStep`. Wizard sleduje completeness percent přes `calculateProfileCompleteness()`, ne přes DB flag.

### Akceptace
1. `/api/upload` akceptuje `upload_preset=avatar` a `upload_preset=cover` → ukládá do Cloudinary pod `carmakler/avatars/{userId}` / `carmakler/covers/{userId}`.
2. Editor `/muj-ucet/profil` má upload widget pro avatar + cover (ne plain URL input).
3. Wizard `/muj-ucet/profil/setup` má 5 kroků, inkrementální save, „Přeskočit" funguje.
4. Dashboard `/muj-ucet` ukazuje `<ProfileCompletenessBar>` pokud percent < 100, s CTA „Dokončit".
5. **(F1)** Wizard je dosažitelný z `/muj-ucet` nav (položka „Nastavit profil" v `navItems`) + z editoru `/muj-ucet/profil` přes CTA „Spustit průvodce profilem →". Po zavření banneru uživatel wizard zpětně najde bez bookmarku.
6. Onboarding `ProfileForm` (pwa makléř) má stejná pole jako wizard step 3 (specializace + služby + jazyky + značky) — sdílený catalog z TASK-059.
7. `calculateProfileCompleteness()` vrací deterministicky % + seznam chybějících polí.
8. Build + lint projdou, žádná migrace.

### STOP triggers
- Pokud `/api/upload` ImageUpload preset vyžaduje jiný flow (např. přímo Cloudinary widget, ne server proxy) — zastavit a konzultovat s lead (dnešní flow je server proxy přes `uploadToServer` → OK).
- Pokud implementátor by musel měnit `session.user.onboardingStep` semantics — STOP (je to pro broker onboarding, ne pro profile completeness).
- Pokud se ukáže že `user.services` v DB už má mix formátů (např. někde boolean array) — STOP a audit dat (`SELECT services FROM users LIMIT 20`).

---

## Sdílené utility (napříč úkoly)

| Soubor | Task | Účel |
|---|---|---|
| `lib/vehicle-labels.ts` | 056 | Fuel/transmission CZ label mapy (extract z `nabidka/page.tsx`). Použije `VehicleCard` + `/nabidka` + `profil`. |
| `lib/broker-specializations.ts` | 059, 060 | `VEHICLE_TYPE_OPTIONS`, `SERVICE_OPTIONS`, `BRAND_OPTIONS`, `SERVICE_GROUPS`. Single source of truth. |
| `lib/profile-completeness.ts` | 060 | `calculateProfileCompleteness()` — deterministická váha polí. |
| `components/ui/ImageUpload.tsx` | 060 | Sdílený upload widget (Cloudinary přes `/api/upload`). |
| `components/web/ProfileCompletenessBar.tsx` | 060 | UI banner pro dashboard. |
| `components/ui/TogglePill.tsx` (volitelné) | 059 | DRY pro 3 toggle sekce v `muj-ucet/profil` editoru. |

---

## DB změny — **ŽÁDNÉ**

Všechna pole již v `schema.prisma` (User model ř. 38–55). Plan je čistě UI + API + shared utility. Žádná migrace → **žádný risk drift z `tsvector`/`trgm`** (viz memory).

---

## Globální STOP triggers (napříč všemi úkoly)

1. **Schema drift.** Pokud `prisma generate` / `tsc` fail kvůli missing fields → STOP a ověřit že migrace byla aplikovaná (`prisma migrate status`).
2. **Data format drift.** Pokud v DB existuje uživatel s `services = "Dovoz,STK"` (string místo Json array) → STOP a auditovat `SELECT services FROM users WHERE services IS NOT NULL LIMIT 50`.
3. **Cloudinary limit.** Pokud `/api/upload` vrací 500 při novém presetu → ověřit `lib/cloudinary.ts` env vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). Memory: deploy checklist.
4. **Onboarding step conflict.** Pokud wizard `setup` začne manipulovat `onboardingStep` → STOP. Ten je vyhrazený pro `/makler/onboarding/*` (broker onboarding 1–5). Wizard používá pouze `calculateProfileCompleteness()`.
5. **BROKER role gate.** `ProfileCompletenessBar` + wizard dávají smysl pro BROKER/MANAGER/REGIONAL_DIRECTOR + ADVERTISER + PARTS_SUPPLIER. Pro BUYER je profil irelevantní → role gate v `app/(web)/muj-ucet/page.tsx`.
6. **Test-chrome race.** Podle memory: ne-spouštět implementator + test-chrome paralelně. Implementovat 057 → test → 058 → test → 059 → test → 056 → test → 060 → test.

---

## Testování

| Task | Manual | Automated |
|---|---|---|
| 057 | `/profil/jan-novak` — jazyky jako oranžové pill tagy | — |
| 058 | `/profil/[broker]` — „X Prodáno" v hero, seed vehicle + listing SOLD | — |
| 059 | `/muj-ucet/profil` — 5 skupin služeb, toggle, save, `/profil/[slug]` renderuje | snapshot `lib/broker-specializations.ts` export |
| 056 | `/profil/[broker]` — vehicle tab má VehicleCard styl stejný jako `/nabidka` | Playwright `profile-vehicle-card.spec.ts` (pokud existuje) |
| 060 | `/muj-ucet/profil/setup` — 5 kroků, save per krok, `/muj-ucet` banner s %, upload avatar+cover reálně uloží do Cloudinary | vitest `calculateProfileCompleteness.test.ts` (unit — pure function) |

## Závislosti mezi úkoly (graph)

```
[057] ─┐
[058] ─┤─→ independent, parallel OK
[059] ─┤─→ creates lib/broker-specializations.ts
       │
       ├─→ [056] uses lib/vehicle-labels.ts (new extract)
       │
       └─→ [060] uses lib/broker-specializations.ts + ImageUpload + completeness
```

`060` je největší, **proto last**. Pokud lead chce shortcut: skip wizard (Varianta B) a udělat jen upgrade editoru + completeness banner (Varianta A) — cca -60 min.
