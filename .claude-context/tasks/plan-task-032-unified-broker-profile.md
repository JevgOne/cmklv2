# Plán — TASK-032 Unifikovaný profil makléře

**Datum:** 2026-04-16
**Autor:** PLANOVAČ
**Mandát:** ANALÝZA + PLÁN, žádná implementace
**Cíl:** JEDEN moderní profil makléře, JEDNOTNÁ URL, klikatelné hashtag pilulky → TASK-054 landing
**Effort:** M (~3-4 h pro zkušeného developera)
**Východisko:** `c391a34` v `main`
**Výstup tohoto dokumentu:** rozhodnutí + konkrétní diffy pro IMPLEMENTÁTORA, ne otevřené otázky

---

## §1 AUDIT SOUČASNÉHO STAVU — CO EXISTUJE

### §1.1 Dvě duplikátní stránky

V kódu existují **dvě samostatné stránky** pro veřejný profil makléře:

| # | Cesta | Typ | Layout | SEO |
|---|-------|-----|--------|-----|
| **A** | `app/(web)/makler/[slug]/page.tsx` (324 ř.) | **Server component** | Legacy: tmavý gradient hero `from-gray-900 to-gray-950`, avatar 80/120 px `rounded-2xl` orange, H1 bílý, 3 statistiky, bio, grid 8 vozidel, kontaktní formulář | `pageCanonical("/makler/${slug}")` + `generateMetadata` |
| **B** | `app/(web)/profil/[slug]/page.tsx` (~680 ř.) | **Client component** (`"use client"`) | Instagram-style: orange gradient cover `h-48→h-80`, kulatý avatar 112/144 px s bílým borderem, side-by-side info kolona, TagPill hashtagy, tabs Vozidla/Oblíbené, badge sekce, CommentSection | Bez SSR metadata — `useSession` + `useParams` + fetch `/api/profile/[slug]` |

**Verdikt:** **A** je legacy „MVP" profil (starý dark hero, jednoduchý), **B** je novější pokus o Instagram-style z TASK-053 (bohatší obsah, ale rozbitý layout — viz §1.3).

### §1.2 Rozbitá konzistence linkování — KDE se LINKUJE kam

Sesbíral jsem všechny odkazy v codebase:

**→ `/makler/[slug]` (legacy):**
| Soubor | Řádek | Kontext |
|---|---|---|
| `app/sitemap.ts` | 238 | **Kanonická URL v sitemapě pro Google** |
| `lib/email-templates/signature.ts` | 13, 40 | E-mailový podpis makléře |
| `components/web/BrokerBox.tsx` | 121 | „Zobrazit profil makléře →" — **používá se na homepage a `/makleri` list** |
| `app/(web)/makleri/page.tsx` | 114 | Landing `/makleri` list brokerů |
| `app/(web)/page.tsx` | 537 | Homepage sekce „Makléři" |
| `app/(web)/makler/[slug]/page.tsx` | 33, 44 | Self-canonical metadata |

**→ `/profil/[slug]` (Instagram):**
| Soubor | Řádek | Kontext |
|---|---|---|
| `app/(web)/makleri/[slug]/page.tsx` | 309 | **JSON-LD Person.url (TASK-054 už zvolilo `/profil` jako kanonickou!)** |
| `app/(web)/makleri/[slug]/page.tsx` | 394 | Autor dealu v tag-landing |
| `components/web/BrokerCard.tsx` | 134 | „Zobrazit profil" — **použito na `/makleri/[slug]` tag landing** |
| `app/(web)/muj-ucet/profil/page.tsx` | 231 | Preview vlastního profilu pro makléře |
| `components/web/CommentSection.tsx` | 152 | Autor komentáře |
| `app/(web)/makler/[slug]/page.tsx` | 220 | „Zobrazit celý profil →" — **legacy samo odkazuje na `/profil`** (což naznačuje že autor TASK-053 chtěl `/profil` jako **kanonickou**, ale nedokončil to) |

**Závěr:** Codebase je **v polovině migrace**. Starší místa (sitemap, homepage, email, BrokerBox) linkují na legacy `/makler`. Novější místa (tag landing, comment, self-preview, BrokerCard) linkují na `/profil`. Legacy page sama obsahuje „odkaz na celý profil" na `/profil/[slug]`. **Google indexuje `/makler` (sitemap + canonical), uživatelé klikají na mix obou.**

### §1.3 Proč uživatel říká že i `/profil/[slug]` je „starý" — VIZUÁLNÍ HYPOTÉZY

Přečetl jsem celý soubor `profil/[slug]/page.tsx` (~680 ř.). Zde jsou konkrétní designové defekty, které dělají stránku „starou":

| # | Defekt | Lokalizace | Proč je to špatně |
|---|---|---|---|
| D1 | **Úzký container `max-w-4xl`** | `profil/[slug]/page.tsx` header/body | Instagram profil = střední zobrazení, ale makléřský profil musí hostit grid vozidel (3-4 karet v řadě) + info sloupec. `max-w-4xl` znamená grid 2 sloupce max → působí prázdně na desktopu. Srovnání: `/makler/[slug]` má `max-w-7xl`. |
| D2 | **Rozbitá side-by-side kolona** | Header `flex flex-col sm:flex-row sm:items-start` s 10-12 itemy v info sloupci (name, role+level+city, bio, **tags**, favBrands, motto, specs, services, langs/exp/website, socials, warehouse, memberSince, actions) | Info kolona je 400-600 px vysoká → avatar straddluje cover, ale info se táhne HODNĚ pod něj → **vizuální nerovnováha**. Čtenář nemá kde zastavit oko. |
| D3 | **Žádná karta, vše ploché** | Celý header + body | Moderní UI (2025) používá karty pro strukturu (hero card, about card, contact card, stats card). Současný layout = ploché `<p>`, `<div>`, `<span>` vedle sebe, bez vizuálního groupingu. |
| D4 | **Cover = orange gradient (žádná fotka)** | `profil/[slug]/page.tsx` cover section `bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600` | **Hero moment chybí**. Cover bez cover fotky = barevné plátno, nikoli „dům makléře". Profesionální LinkedIn/Agent profil má cover fotku (auta, showroom, města). |
| D5 | **Client component, žádné SSR metadata** | `"use client"` + `fetch('/api/profile/${slug}')` uvnitř komponenty | Stránka nemá `generateMetadata`, OG image, JSON-LD Person. **Google tohle v SEO trestá.** Loading flash (CLS). |
| D6 | **Badge sekce až úplně dole** | Na konci po tabs + items grid | Úroveň („TOP Makléř", „Rychlá reakce") a oficiální badges musí být vedle jména v HERO, aby vizuálně legitimizovaly makléře okamžitě. |
| D7 | **Stats bar pod headerem, ne v headeru** | `flex flex-wrap gap-8 sm:gap-12 py-4 border-y` | Statistiky („Prodejů 3 / Lajky 1 / Vozidel …") = **sociální proof**. Musí být v hero, ne pod ním. |
| D8 | **Text-heavy info kolona** | Motto + bio + fav brands + services + specs + langs + exp + website + socials + warehouse + member since | **Přetížení informacemi**. Vše vyslovně textové, žádné ikony, žádné kategorizace. Výsledek: čtenář scrolluje bez orientace. |
| D9 | **Tabs bez hero grafického akcentu** | `<div className="flex gap-0 border-b">` | Nyní jsou tabs úzké, levostranně zarovnané na `max-w-4xl`. Ztrácí se. |
| D10 | **Owner mode „Upravit profil" smíchaný s public actions** | Actions row `{isOwner ? "Upravit profil" : "Kontaktovat"}` + „Sdílet" | Owner má mít **samostatnou action bar** (edit avatar, edit cover, edit bio quick) — ne podstrčené ne-owner tlačítko. |

**Souhrn:** Instagram-style design byl dobrý záměr TASK-053, ale **implementace se utopila v textové koloně** a **neposlala obsah do kartové struktury**. Výsledek působí starobylejší než čistý dark hero z `/makler` — proto „starý".

---

## §2 ROZHODNUTÍ — JEDNOTNÝ PROFIL MAKLÉŘE

> **Žádné „mohli bychom". Rozhodnutí následují.**

### §2.1 Kanonická URL = `/profil/[slug]`

**Důvody:**
1. TASK-054 JSON-LD už používá `/profil/${slug}` (migrace už začala)
2. Legacy `/makler/[slug]` sám **linkuje na `/profil/[slug]`** („Zobrazit celý profil →") — což potvrzuje záměr
3. `/profil/[slug]` není jen pro BROKER, ale i pro jiné role (INVESTOR, VERIFIED_DEALER, BUYER) — `/profil` je **role-agnostický a rozšiřitelný**
4. `/makler/` je **doménově úzký** (jen pro BROKER), škáluje se špatně (INVESTOR by se na `/makler/[slug]` dostal být nesmyslné)
5. `/profil` má už CommentSection + TagPill + Like flow + role-specific tabs — je **více komplexní**

### §2.2 `/makler/[slug]` → **301 permanentRedirect** na `/profil/[slug]`

Stejný vzor jako TASK-054 alias routes (`/h/[slug]`, `/tag/[slug]` → `/makleri/[slug]`). Žádná duplicita obsahu, Google sjednocuje PageRank.

### §2.3 `/profil/[slug]` → **PŘESTAVĚT** do moderního kartového layoutu

Nedodáváme UI fix na existující stránku — **přestavíme tělo stránky** do 6 čistých sekcí (viz §3). Current `page.tsx` se zachová jen na úrovni:
- route + `"use client"` (ponecháme client pro `useSession`, LikeButton, CommentSection)
- data fetch
- session detection
- tab logic

Všechno vizuální přepsat.

### §2.4 Hashtag pilulky = klikatelné → `/makleri/[slug]` (TASK-054)

Už v kódu (TagPill v `/profil/[slug]/page.tsx`). **Verifikace:** plán kontroluje, že po přestavbě TagPill zůstává, je viditelný v HERO sekci (ne schovaný v textu), a linkuje na `/makleri/[slug]`.

### §2.5 Kanonická URL v sitemapě = `/profil/[slug]`

`app/sitemap.ts:238` přepsat z `/makler/${b.slug}` na `/profil/${b.slug}`.

### §2.6 E-mailové podpisy = `/profil/[slug]`

`lib/email-templates/signature.ts:13,40` přepsat.

### §2.7 Homepage + `/makleri` list + BrokerBox = `/profil/[slug]`

Všechny interní linky jednotně na `/profil`. 301 v `/makler/[slug]` zachytí zbytek (staré emaily, externí linky).

---

## §3 NOVÝ LAYOUT `/profil/[slug]` — KARTOVÁ STRUKTURA

### §3.1 Wireframe (mobile ← 640px, desktop →)

```
╔══════════════════════════════════════════════════════════════════╗
║  (1) COVER                h-56 sm:h-72 bg orange gradient (nebo uploadovaná fotka) ║
║                                                                      ║
║  ┌─────────────┐                                                    ║
║  │  AVATAR     │  straddle -mt-16, border-4 border-white           ║
║  └─────────────┘                                                    ║
╠══════════════════════════════════════════════════════════════════╣
║  (2) HERO CARD   bg-white rounded-2xl shadow-card -mt-8 p-6      ║
║                                                                   ║
║   H1  Jan Novák                         [TOP Makléř] [Rychlá reakce]  ║
║   Certifikovaný makléř · Praha · Člen od duben 2025                  ║
║                                                                      ║
║   ─── hashtagy (TagPill × N, TASK-054) ───                          ║
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────┐     ║
║   │  STATS ROW                                                │     ║
║   │  12 Prodejů  │  3 Aktivní  │  25 Lajků  │  4.9 ★         │     ║
║   └──────────────────────────────────────────────────────────┘     ║
║                                                                      ║
║   [ Kontaktovat ]  [ Sdílet profil ]        (pokud owner)          ║
║                                              [ Upravit profil ]    ║
╠══════════════════════════════════════════════════════════════════╣
║  (3) O MNĚ CARD   bg-white rounded-2xl shadow-card p-6           ║
║    H2 O makléři                                                      ║
║    — Bio (max 4 řádky)                                              ║
║    — Motto (italic, -mt-2)                                          ║
║    — Oblíbené značky (pills)                                        ║
╠══════════════════════════════════════════════════════════════════╣
║  (4) SPECIALIZACE CARD   bg-white rounded-2xl shadow-card p-6    ║
║    2-col grid (sm+)                                                 ║
║    Služby │ Značky │ Jazyky │ Zkušenosti                             ║
║    (ikona + nadpis + pill list)                                     ║
╠══════════════════════════════════════════════════════════════════╣
║  (5) KONTAKT CARD   bg-white rounded-2xl shadow-card p-6         ║
║    📞 Telefon (pokud showPhone)                                     ║
║    🌐 Web                                                            ║
║    📍 Výdejní místo                                                 ║
║    🔗 Social icons                                                   ║
╠══════════════════════════════════════════════════════════════════╣
║  (6) VOZIDLA SEKCE                                                 ║
║    Tabs:  Vozidla (12)  │  Oblíbené (8)  │  Komentáře (4)           ║
║    ▼                                                                 ║
║    Grid 1/2/3/4 cols (mobile/sm/md/lg) VehicleCard                  ║
║    [Načíst další]                                                   ║
╠══════════════════════════════════════════════════════════════════╣
║  (7) BADGES CARD (pokud existují)                                  ║
║    H2 Ocenění a odznaky                                            ║
║    Grid badge pills                                                 ║
╠══════════════════════════════════════════════════════════════════╣
║  (8) KOMENTÁŘE                                                      ║
║    CommentSection (bez změny)                                       ║
╚══════════════════════════════════════════════════════════════════╝
```

**Poznámky k wireframe:**
- Container: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` (změna z 4xl → 6xl pro vozidla grid 3-cols na lg+)
- Všechny karty: `bg-white rounded-2xl shadow-card` (konzistentní s TASK-054 landing)
- Mezery mezi kartami: `space-y-4 sm:space-y-6`
- Hero card overlap s coverem: `-mt-8` na wrapperu hero karty (avatar straddluje cover a hero card najednou)

### §3.2 Konkrétní změny v `profil/[slug]/page.tsx`

> Implementátor nedělá nic jiného, než níže uvedené. Žádné „improvements".

**F1. Container šířka:**
- Hledat: `max-w-4xl` → nahradit: `max-w-6xl` (všechna výskyt v této stránce; wrapper body + tabs + items grid)

**F2. Cover:**
- Ponechat orange gradient AS-IS, ale zvýšit výšku: `h-48 sm:h-64 md:h-80` → `h-56 sm:h-72 md:h-96`
- Přidat do pravého dolního rohu sovu/ikonu tlačítka „Upravit cover" **jen pro owner** (bez funkce, TODO placeholder `disabled:true title="Přijde brzy"`)

**F3. Hero card (body -mt-16):**
- Vyrvat z aktuálního headeru **strukturu flex-col items-center text-center … flex-col sm:flex-row sm:items-start…** a napsat znovu čistě:
  ```jsx
  <section className="-mt-20 relative z-10">
    <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <Avatar />                       {/* -mt-16 sm:-mt-20, border-4 border-white */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <H1 />
              <RoleLine />                {/* Certifikovaný makléř · Praha · Člen od … */}
            </div>
            <BadgeStack />                {/* Level + Rychlá reakce */}
          </div>
          <TagPills />                     {/* TASK-054 */}
          <StatsRow />
          <ActionsRow />
        </div>
      </div>
    </div>
  </section>
  ```

**F4. Extrahovat "O mně" do karty:**
- Bio + motto + oblíbené značky → samostatný `<Card>` komponent (components/ui/Card.tsx už existuje)
- H2 „O makléři" (text-xl font-bold)
- Podmíněně renderovat jen pokud má obsah (`{(user.bio || user.motto || user.favBrands?.length) && <Card>…}`)

**F5. Extrahovat „Specializace" do karty:**
- Služby (services), značky specializace (specs), jazyky (languages), roky zkušeností (experience)
- 2-col grid na sm+: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Každý blok: ikona (emoji nebo `<svg>`) + H3 (text-sm font-semibold uppercase tracking-wide text-gray-500) + pill list / text
- Podmíněně (nezobrazovat prázdné)

**F6. Extrahovat „Kontakt" do karty:**
- Telefon (jen pokud showPhone), web, výdejní místo, social ikony
- Každý řádek: ikona + text (pro phone/web = `<a>` link, pro address = text)
- Podmíněně

**F7. Tabs + items grid (sekce 6):**
- Zachovat ROLE_TABS logiku a state `activeTab`
- Přepracovat styling: tabs buttons `px-6 py-3 font-semibold border-b-2 -mb-px` s `border-orange-500 text-orange-700` pro aktivní, `border-transparent text-gray-500 hover:text-gray-700` pro inactive
- Grid vozidel: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` (3-col na lg, nepřidávat 4 — širší VehicleCard je čitelnější)

**F8. Badges sekce (7):**
- Samostatná karta, H2 „Ocenění a odznaky"
- Grid: `flex flex-wrap gap-2`
- Podmíněně (nezobrazovat pokud prázdné)

**F9. CommentSection (8):**
- Ponechat **beze změny**. Karta wrapper volitelný (podle toho, jak CommentSection vypadá — pokud vlastní rámec, ne obalovat).

**F10. Owner action bar:**
- Pokud `isOwner`, přidat nad cover (sticky top) **owner toolbar** s 3 tlačítky:
  - `[ Upravit profil ]` (Link `/muj-ucet/profil`)
  - `[ Upravit cover ]` (TODO placeholder)
  - `[ Upravit avatar ]` (TODO placeholder)
- Stylizace: `bg-orange-50 border-b border-orange-200 px-4 py-2 flex gap-2 justify-end`
- **Nebo** jednodušší alternativa (doporučuji pro IMPL): ponechat „Upravit profil" jen v action rowu hero karty (v §3.2 F3 ActionsRow). TODO edit cover/avatar ponechat na TASK-0XX pozdější.

### §3.3 SSR / metadata / SEO — **MUST FIX**

> `/profil/[slug]` je aktuálně client component bez metadata → Google nevidí titulek, popis, OG, JSON-LD. **Toto je vážný SEO regres.**

**F11. Konvertovat na hybrid server + client:**
- Přesunout `page.tsx` → `Page.client.tsx` (přejmenování s `"use client"`)
- Nový `page.tsx` = **server component**:
  - `export async function generateMetadata({ params })` → fetch user from `prisma.user.findFirst({ where: { slug }, select: {…}})`, vrátit title + description + alternates + OG image
  - Server komponenta načte data server-side, vyrenderuje JSON-LD `<script type="application/ld+json">` inline (Person schema), pak předá do `<Page.client initialData={…} />`
  - Client komponent zachová `useSession`, tab state, LikeButton, CommentSection
  - ISR: `export const revalidate = 300` (5 minut)

**F12. JSON-LD Person schema (server-rendered):**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Jan Novák",
  "url": "https://carmakler.cz/profil/jan-novak-praha",
  "jobTitle": "Certifikovaný makléř",
  "worksFor": {"@type": "Organization", "name": "CarMakléř"},
  "address": {"@type": "PostalAddress", "addressLocality": "Praha", "addressCountry": "CZ"},
  "image": "<avatar URL or OG image>",
  "sameAs": [<social URLs>]
}
```

**F13. generateMetadata:**
```tsx
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const user = await prisma.user.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { firstName: true, lastName: true, bio: true, city: true, avatar: true, role: true }
  });
  if (!user) return { title: "Profil nenalezen — CarMakléř" };
  const roleLabel = user.role === "BROKER" ? "Certifikovaný makléř" : user.role === "INVESTOR" ? "Ověřený investor" : "Profil";
  return {
    title: `${user.firstName} ${user.lastName} — ${roleLabel} CarMakléř`,
    description: user.bio?.slice(0, 155) || `Profil ${roleLabel.toLowerCase()} ${user.firstName} ${user.lastName}${user.city ? " z " + user.city : ""}. Aktivní vozidla, recenze a kontakt.`,
    alternates: pageCanonical(`/profil/${slug}`),
    openGraph: {
      title: `${user.firstName} ${user.lastName} — CarMakléř`,
      description: user.bio?.slice(0, 155) || undefined,
      url: `https://carmakler.cz/profil/${slug}`,
      images: user.avatar ? [{ url: user.avatar }] : undefined,
      type: "profile",
    },
  };
}
```

### §3.4 Hashtag pilulky — ověření (TASK-054)

Aktuální `profil/[slug]/page.tsx` už má TagPill integrovány (`import { TagPill } from "@/components/web/TagPill"`). **Verifikace kroku:**
- TagPill musí být **v hero kartě** (sekce 2), ne schovaný mezi socials / warehouse
- Linkuje na `/makleri/[slug]` (= TAG landing z TASK-054)
- Velikost: `size="default"` (ne `sm` v BrokerCard)
- Layout: `flex flex-wrap gap-1.5 mt-3`
- Maximum viditelných: zobrazit všechny (bez truncate)

---

## §4 SEZNAM SOUBORŮ + ODKAZŮ K ÚPRAVĚ

### §4.1 Hlavní přestavba

| # | Soubor | Změna |
|---|---|---|
| 1 | `app/(web)/profil/[slug]/page.tsx` | **Rozdělit** na `page.tsx` (server, metadata + JSON-LD + initial data fetch) + `ProfileClient.tsx` (client, interactivity) |
| 2 | `app/(web)/profil/[slug]/ProfileClient.tsx` | **NOVÝ**. Přestavěné tělo dle §3.1 wireframe, 8 sekcí |
| 3 | `app/(web)/profil/[slug]/loading.tsx` | **NOVÝ**. Skeleton (cover + hero card + 3 content karty) |

### §4.2 301 redirect

| # | Soubor | Změna |
|---|---|---|
| 4 | `app/(web)/makler/[slug]/page.tsx` | **Zjednodušit na permanentRedirect**. Ponechat jen: `export default async function({ params }) { const { slug } = await params; permanentRedirect(`/profil/${slug}`); }` + zbytek smazat (324 ř. → ~10 ř.) |
| 4b | `app/(web)/makler/[slug]/MaklerContactForm.tsx` | **Smazat** (je použit jen v /makler, po redirectu nepotřebný) |

### §4.3 Přepsat interní odkazy `/makler/[slug]` → `/profil/[slug]`

| # | Soubor | Řádek | Aktuální | Nový |
|---|---|---|---|---|
| 5 | `app/sitemap.ts` | 238 | ``url: `${BASE_URL}/makler/${b.slug}` `` | ``url: `${BASE_URL}/profil/${b.slug}` `` |
| 6 | `lib/email-templates/signature.ts` | 13 | ``https://carmakler.cz/makler/${broker.slug}`` | ``https://carmakler.cz/profil/${broker.slug}`` |
| 7 | `lib/email-templates/signature.ts` | 40 | ``https://carmakler.cz/makler/${broker.slug}`` | ``https://carmakler.cz/profil/${broker.slug}`` |
| 8 | `components/web/BrokerBox.tsx` | 121 | ``href={`/makler/${slug}`}`` | ``href={`/profil/${slug}`}`` |
| 9 | `app/(web)/makleri/page.tsx` | 114 | ``href={`/makler/${broker.slug}`}`` | ``href={`/profil/${broker.slug}`}`` |
| 10 | `app/(web)/page.tsx` | 537 | ``href={`/makler/${broker.slug}`}`` | ``href={`/profil/${broker.slug}`}`` |

### §4.4 Pilotní ověření (nic neměnit, jen kontrola)

| # | Soubor | Co ověřit |
|---|---|---|
| 11 | `components/web/BrokerCard.tsx:134` | Už linkuje na `/profil/${slug}` ✅ |
| 12 | `app/(web)/makleri/[slug]/page.tsx:309, 394` | Už linkuje na `/profil/${slug}` ✅ (TASK-054) |
| 13 | `components/web/CommentSection.tsx:152` | Už linkuje na `/profil/${slug}` ✅ |
| 14 | `app/(web)/muj-ucet/profil/page.tsx:231` | Už linkuje na `/profil/${slug}` ✅ |
| 15 | `components/web/TagPill.tsx` | Linkuje na `/makleri/${slug}` (tag landing) ✅ — zachovat |

### §4.5 API — bez změny

- `/api/profile/[slug]` — endpoint pro client fetch, zůstává. ProfileClient.tsx přepne na prop `initialData` (server-předaný) + volitelný client refetch pro items tab pagination.

---

## §5 OČEKÁVANÝ VÝSLEDEK (AC)

Po dokončení IMPL musí platit **všechno**:

| AC | Test |
|---|---|
| AC1 | `/profil/jan-novak-praha` načte se jako **server-rendered HTML** (View Source → vidím H1, bio, JSON-LD Person) |
| AC2 | `<title>` = `"Jan Novák — Certifikovaný makléř CarMakléř"` |
| AC3 | OG image = avatar (pokud existuje) |
| AC4 | JSON-LD `<script type="application/ld+json">` obsahuje `@type: Person`, `url: .../profil/jan-novak-praha`, `jobTitle: "Certifikovaný makléř"` |
| AC5 | Cover má výšku `h-56 sm:h-72 md:h-96` orange gradient |
| AC6 | Avatar straddluje cover (kulatý, border-4 border-white, -mt-20) |
| AC7 | Hero karta obsahuje: H1 jméno, role+město+member since, level badges, TagPills, stats row, actions |
| AC8 | **TagPill viditelné v hero kartě** (ne schované), klik na TagPill → `/makleri/[tagslug]` |
| AC9 | Karta „O makléři" obsahuje bio + motto + oblíbené značky (pokud alespoň jedno existuje) |
| AC10 | Karta „Specializace" (2-col grid) — jen pokud existuje obsah |
| AC11 | Karta „Kontakt" (phone, web, socials, address) — jen pokud existuje obsah |
| AC12 | Tabs (Vozidla / Oblíbené / Komentáře) dle ROLE_TABS |
| AC13 | Grid vozidel `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| AC14 | Owner (přihlášený Jan Novák) vidí „Upravit profil" v hero action row |
| AC15 | Anonymous vidí „Kontaktovat" (pokud showPhone) + „Sdílet profil" |
| AC16 | Container `max-w-6xl` (ne 4xl) |
| AC17 | Karty: `bg-white rounded-2xl shadow-card` konzistentní |
| AC18 | Na mobilu (< 640 px): avatar centrovaný, hero karta plná šířky, info stack vertikálně, tabs horizontálně scrollable pokud nutné |
| AC19 | `/makler/jan-novak-praha` → **301** na `/profil/jan-novak-praha` (test: `curl -I http://localhost:3000/makler/jan-novak-praha` → 308 Permanent Redirect z permanentRedirect) |
| AC20 | Sitemap XML (`/sitemap.xml`) obsahuje URL `/profil/jan-novak-praha`, NE `/makler/...` |
| AC21 | Homepage + `/makleri` list + BrokerBox linkují na `/profil/[slug]` |
| AC22 | E-mailový podpis makléře odkazuje na `/profil/[slug]` |
| AC23 | Žádný build error, `npm run build` prochází |
| AC24 | `npm run lint` prochází |
| AC25 | Playwright `npx playwright test e2e/TASK-053-*.spec.ts` prochází (nebo upravit selektory pokud hero se změnil) |

---

## §6 RIZIKA

| # | Riziko | Mitigace |
|---|---|---|
| R1 | SSR konverze rozbije `useSession` v některé subkomponentě (LikeButton potřebuje session) | Client komponenta ProfileClient.tsx pokrývá všechnu interaktivitu; server jen předá initial data + JSON-LD |
| R2 | `generateMetadata` sdílí Prisma call s `Page` → dvojí fetch | Cacheovat přes `React.cache(() => prisma.user.findFirst(...))` + sdílet mezi metadata a page |
| R3 | E2E testy TASK-053 selektory najdou hero elementy podle starých tříd | Implementátor aktualizuje Playwright selektory v rámci TASK-032 |
| R4 | CommentSection expect routes nezměněné | Zachovány — CommentSection už odkazuje na `/profil`, beze změny |
| R5 | `/makler/[slug]` cache v CDN/CloudFlare může několik minut servírovat starou stránku | Po deploy provést cache purge |
| R6 | Google Search Console vidí pokles `/makler/` — standardní při 301 migraci | Monitorovat, 301 konsoliduje do několika týdnů |

---

## §7 OUT OF SCOPE (NE v TASK-032)

- Edit cover fotka / avatar upload (placeholder button jen, funkce v budoucím TASK)
- Moderation controls pro ADMIN na cizím profilu
- REGIONAL_DIRECTOR/MANAGER tabs rozšíření (jen Liked) — samostatný minor task
- Redesign `/muj-ucet/profil` (= edit mode, je to jiná stránka)
- A/B test layout variant

---

## §8 DEPENDENCIES

- **TASK-054** (hashtagy) — MUSÍ být v `main` před začátkem TASK-032 (TagPill + `/makleri/[slug]` landing), jinak AC8 neprojde
- **TASK-053** (Instagram profil baseline) — už v `main` ✅
- **TASK-042** (related) — žádný přímý

---

## §9 COMMIT STRATEGIE

**3 samostatné commity** (reviewable):

**C1 — Restructure `/profil/[slug]` to server + client hybrid with new card layout**
- `app/(web)/profil/[slug]/page.tsx` (server rewrite)
- `app/(web)/profil/[slug]/ProfileClient.tsx` (new)
- `app/(web)/profil/[slug]/loading.tsx` (new)

**C2 — 301 redirect `/makler/[slug]` → `/profil/[slug]`**
- `app/(web)/makler/[slug]/page.tsx` (reduce to permanentRedirect)
- Delete `app/(web)/makler/[slug]/MaklerContactForm.tsx`

**C3 — Update internal links to `/profil/[slug]`**
- `app/sitemap.ts`
- `lib/email-templates/signature.ts`
- `components/web/BrokerBox.tsx`
- `app/(web)/makleri/page.tsx`
- `app/(web)/page.tsx`

---

## §10 TEST PLAN (po IMPL)

1. **Dev server** — otevřít `/profil/jan-novak-praha` anonymous → view source kontrola SSR HTML
2. **Metadata** — `curl http://localhost:3000/profil/jan-novak-praha | grep -E "title|og:|ld\+json"` → vše OK
3. **301 redirect** — `curl -I http://localhost:3000/makler/jan-novak-praha` → `308 Permanent Redirect`, `Location: /profil/jan-novak-praha`
4. **Owner mode** — login jan.novak@carmakler.cz, otevřít `/profil/jan-novak-praha` → vidět „Upravit profil"
5. **TagPill klik** — klik na #praha → navigace na `/makleri/praha`
6. **Sitemap** — `curl http://localhost:3000/sitemap.xml | grep profil` → broker URLy v `/profil/` formátu
7. **Homepage** — otevřít `/`, scroll na „Makléři" sekci, kliknout na makléřův BrokerBox → `/profil/[slug]` (ne `/makler/`)
8. **Email signature** — odesláno emailem, link ukáže `/profil/[slug]`
9. **Playwright** — `npx playwright test e2e/TASK-053-*.spec.ts --project=chromium` → pokud selhává, selektory hero zaktualizovat
10. **Mobile** — Chrome DevTools iPhone 14 Pro, 360 px × 800 px, scroll → karty se šoupají plynule, žádný horizontální scroll, tabs scrollable

---

## §11 ESKALACE

**STOP & ESCALATE triggery pro IMPLEMENTÁTORA:**

- TypeScript build fail → STOP, eskaluj bez commit
- `prisma.user.findFirst` v `generateMetadata` selhává na dev DB (tsvector/trgm drift) → STOP, eskaluj — standardní fix je `migrate reset --force` dle `project_recurring_tsvector_drift.md` memory, ale **nedělat bez souhlasu team-leada**
- Jakákoli změna v CommentSection / LikeButton / TagPill → STOP, eskaluj (mimo scope TASK-032)
- 301 redirect loopuje (self-referenc) → STOP, eskaluj

**Ne-STOP, jen info:**
- Playwright E2E selektory nutno aktualizovat v rámci TASK-032 — OK, součást IMPL
- `npm run lint` varování o `<img>` bez Next/Image → OK, ponechat jako TODO v budoucím taskovi (refactor obrazů)

---

## §12 MEMORY CHECK

- ✅ `feedback_git_reset_approval.md` — 3 commity, žádný reset/amend
- ✅ `feedback_stop_escalate_literal.md` — §11 triggery jasně pojmenované
- ✅ `feedback_no_parallel_impl_test.md` — po IMPL HOTOVO, test-chrome SEKVENČNĚ
- ✅ `project_recurring_tsvector_drift.md` — zmíněno v §11 (fix dev DB standardní, ale potřebuje souhlas)
- ✅ `reference_deploy_checklist.md` — pro production deploy po schválení použít full 7-step flow

---

## §13 OTEVŘENÉ OTÁZKY (pro team-lead)

**Q1:** Cover fotka — ponechat orange gradient nebo přidat možnost uploadu (user stories)?
- **Doporučení:** teď gradient, upload jako samostatný TASK po TASK-032

**Q2:** Tab „Komentáře" — aktuálně ROLE_TABS nemá „comments", jen Vozidla + Oblíbené. Přidat třetí tab?
- **Doporučení:** OUT OF SCOPE, jen Vozidla + Oblíbené (současný stav zachovat)

**Q3:** Badge sekce (Ocenění a odznaky) — jako karta v §3.1 sekce 7 nebo zrušit?
- **Doporučení:** ponechat jako kartu, condition `{badges.length > 0 && <Card>…}`, jinak skrýt

**Q4:** Owner toolbar (edit cover/avatar) — ponechat placeholders nebo vypustit z §3.2 F10?
- **Doporučení:** VYPUSTIT z TASK-032, jen „Upravit profil" link do `/muj-ucet/profil`. Edit cover/avatar = samostatný future TASK (upload flow, S3/Cloudinary, cropper).

---

**END OF PLAN TASK-032**
