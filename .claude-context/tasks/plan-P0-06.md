# Plan P0-06: Odstranit hardcoded site password

**Priorita:** P0 (bloker pro launch)
**Slozitost:** S
**Zavislosti:** ZADNE
**Batch:** 1

---

## Cil

Presunout hardcoded heslo `SITE_PASSWORD = "Admin2026"` z `middleware.ts` do env promenne. Pro produkci umoznit kompletni vypnuti password ochrany (verejny web).

---

## Kroky implementace

### Krok 1: Upravit middleware.ts

**Soubor:** `middleware.ts`

**Aktualni stav (radky 86-87):**
```ts
const SITE_PASSWORD = "Admin2026";
const SITE_AUTH_COOKIE = "site_access";
```

**Zmena:**
```ts
const SITE_PASSWORD = process.env.SITE_PASSWORD || null;
const SITE_AUTH_COOKIE = "site_access";
```

### Krok 2: Upravit logiku site auth v middleware

**Aktualni stav (radky 108-115):**
```ts
if (!shouldSkipSiteAuth(pathname)) {
  const siteAuth = request.cookies.get(SITE_AUTH_COOKIE);
  if (!siteAuth || siteAuth.value !== SITE_PASSWORD) {
    const gateUrl = new URL("/gate", request.url);
    gateUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(gateUrl);
  }
}
```

**Zmena:**
```ts
// Site-wide password ochrana — jen pokud je SITE_PASSWORD nastaveno v env
if (SITE_PASSWORD && !shouldSkipSiteAuth(pathname)) {
  const siteAuth = request.cookies.get(SITE_AUTH_COOKIE);
  if (!siteAuth || siteAuth.value !== SITE_PASSWORD) {
    const gateUrl = new URL("/gate", request.url);
    gateUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(gateUrl);
  }
}
```

**Klicovy detail:** Pridani `SITE_PASSWORD &&` na zacatek podminky. Pokud env promenna neni nastavena (produkce), cely blok se preskoci a web je verejny.

### Krok 3: Upravit gate stranku

**Soubor:** Najit `app/(web)/gate/` nebo `app/gate/` — overit ze gate stranka cte heslo z env.

Gate stranka pravdepodobne porovnava heslo ze vstupu s cookie hodnotu. Musi se upravit tak, aby:
- Pokud `SITE_PASSWORD` neni nastaveno, presmerovat na `/`
- Pokud je nastaveno, fungovat jako dosud

```tsx
// V API route nebo server action pro gate:
const expectedPassword = process.env.SITE_PASSWORD;
if (!expectedPassword) {
  redirect("/");
}
if (inputPassword === expectedPassword) {
  // nastavit cookie
}
```

### Krok 4: Pridat do .env.example

```
# Site password pro staging/dev (prazdne = verejny web)
SITE_PASSWORD=
```

---

## Presny diff

```diff
// middleware.ts radek 86-87:
-const SITE_PASSWORD = "Admin2026";
+const SITE_PASSWORD = process.env.SITE_PASSWORD || null;

// middleware.ts radek 108:
-  if (!shouldSkipSiteAuth(pathname)) {
+  if (SITE_PASSWORD && !shouldSkipSiteAuth(pathname)) {
```

---

## Soubory k uprave

| Soubor | Radky | Zmena |
|--------|-------|-------|
| `middleware.ts` | 86 | `"Admin2026"` -> `process.env.SITE_PASSWORD \|\| null` |
| `middleware.ts` | 109 | Pridat `SITE_PASSWORD &&` do podminky |
| `app/**/gate/*` | * | Overit/upravit gate logiku |

## Bezpecnostni poznamky

- Heslo se NESMI objevit v zdrojovem kodu (git history uz obsahuje "Admin2026" — po launchi zvazit git filter-branch nebo force push s vycistenim)
- Pro staging pouzit silnejsi heslo nez "Admin2026"
- Cookie `site_access` by mela byt httpOnly a secure v produkci

## Overeni

- [ ] Bez SITE_PASSWORD v env: web je verejne pristupny, zadny redirect na /gate
- [ ] S SITE_PASSWORD v env: web je chraneny, redirect na /gate funguje
- [ ] Gate stranka prijima heslo a nastavuje cookie
- [ ] Zadny hardcoded retezec "Admin2026" v kodu (krome git history)
