# Investigace: inzerce.carmakler.cz nefunguje

**Vytvořeno:** 2026-04-19
**Task:** #15

---

## Stav kódu — VŠE JE PŘIPRAVENÉ

Aplikační kód pro subdomain routing je **plně implementovaný** a vypadá korektně:

### 1. `lib/subdomain.ts` ✅
- Parsuje host header → vrací `"main"`, `"inzerce"`, `"shop"`, `"marketplace"`
- Dev: `inzerce.localhost:3000` → `"inzerce"` ✅
- Prod: `inzerce.carmakler.cz` → `"inzerce"` ✅ (split by `.`, 3+ parts, first = `"inzerce"`)

### 2. `middleware.ts` ✅
- Řádky 93-99: Pokud `subdomain === "inzerce"`, rewrituje `pathname` na `/inzerce${pathname}`
  - `inzerce.carmakler.cz/` → interně `/inzerce`
  - `inzerce.carmakler.cz/katalog` → interně `/inzerce/katalog`
- Řádek 167: `inzerce.carmakler.cz/nabidka` → redirect na `/katalog`
- Skip rewrite pro `/api/`, `/_next/`, `/login`, atd. ✅
- Přidá `x-subdomain` header do response ✅

### 3. `app/(web)/inzerce/` ✅
- 4 stránky existují: `page.tsx`, `katalog/page.tsx`, `registrace/page.tsx`, `pridat/page.tsx`
- Inzerce homepage (`page.tsx`) — plně implementovaná s hero, stats, pricing, recent listings

### 4. `lib/urls.ts` ✅
- Cross-platform URL builder
- Pokud `NEXT_PUBLIC_INZERCE_URL` je nastaveno → generuje absolutní URL na subdoénu
- Pokud prázdné → fallback na path-based `/inzerce/...`

### 5. `next.config.ts` — žádné omezení ✅
- Redirectuje jen `www.carmakler.cz → carmakler.cz`
- Žádné hostové restrikce v `images.remotePatterns`
- Žádné subdomain-specific bloky

---

## Kde je problém — 3 možné příčiny

### PŘÍČINA A (NEJPRAVDĚPODOBNĚJŠÍ): Chybí DNS záznam

Subdomain `inzerce.carmakler.cz` musí mít DNS A/CNAME záznam směřující na stejný server jako `carmakler.cz` (91.98.203.239, alias `server` v SSH config).

**Ověření:**
```bash
# Na lokálním stroji:
dig inzerce.carmakler.cz A
nslookup inzerce.carmakler.cz

# Očekávaný výsledek:
# inzerce.carmakler.cz → 91.98.203.239 (nebo CNAME → carmakler.cz)

# Pokud vrátí NXDOMAIN nebo žádný záznam → DNS chybí
```

**Fix:** V DNS správě (Cloudflare / registrátora domény) přidat:
```
inzerce.carmakler.cz  A     91.98.203.239
shop.carmakler.cz     A     91.98.203.239
marketplace.carmakler.cz A  91.98.203.239
```
Nebo lépe — wildcard:
```
*.carmakler.cz        A     91.98.203.239
```

### PŘÍČINA B: Nginx nenaslouchá na subdoéně

I s DNS záznamem musí Nginx na produkčním serveru přijímat requesty pro `inzerce.carmakler.cz` a proxovat je na Next.js (PM2).

**Ověření:**
```bash
# Na serveru:
ssh server
cat /etc/nginx/sites-enabled/carmakler*
# nebo
cat /etc/nginx/conf.d/carmakler*
```

**Očekávaná konfigurace:**
```nginx
server {
    server_name carmakler.cz inzerce.carmakler.cz shop.carmakler.cz marketplace.carmakler.cz;
    # NEBO
    server_name carmakler.cz *.carmakler.cz;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;  # KRITICKÉ — předá subdomain do Next.js
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Klíčové:**
- `server_name` MUSÍ zahrnovat `inzerce.carmakler.cz` (nebo `*.carmakler.cz`)
- `proxy_set_header Host $host;` MUSÍ předat originální host — jinak middleware vidí `localhost:3000` a vrátí `"main"` místo `"inzerce"`

**Fix pokud chybí:**
```bash
# Na serveru:
sudo nano /etc/nginx/sites-enabled/carmakler.conf
# Přidat subdomain(y) do server_name
# Ověřit proxy_set_header Host $host
sudo nginx -t
sudo systemctl reload nginx
```

### PŘÍČINA C: Chybí SSL certifikát pro subdoénu

Pokud web běží na HTTPS (měl by), subdoéna potřebuje vlastní SSL certifikát nebo wildcard cert.

**Ověření:**
```bash
# Na serveru:
sudo certbot certificates
# Hledat: inzerce.carmakler.cz nebo *.carmakler.cz
```

**Fix:**
```bash
# Přidat subdoénu k existujícímu certifikátu:
sudo certbot --nginx -d carmakler.cz -d inzerce.carmakler.cz -d shop.carmakler.cz -d marketplace.carmakler.cz

# NEBO wildcard (vyžaduje DNS challenge):
sudo certbot certonly --dns-cloudflare -d carmakler.cz -d "*.carmakler.cz"
```

---

## Ověření na localhost

Kód **by měl fungovat na localhost** s jednou podmínkou — hostname musí být `inzerce.localhost` (ne `localhost`).

**Test:**
```bash
# 1. Spustit dev server
npm run dev

# 2. Otevřít v prohlížeči:
http://inzerce.localhost:3000
# → Měl by zobrazit inzerce landing page (s hero "Prodejte své auto. Zdarma.")

# 3. Ověřit response header:
curl -I http://inzerce.localhost:3000
# → x-subdomain: inzerce
```

`inzerce.localhost` funguje out-of-the-box na macOS/Linux (localhost resolves *.localhost). Na Windows může vyžadovat zápis do `/etc/hosts`.

---

## Ověření na produkci

```bash
# Rychlý test:
curl -I https://inzerce.carmakler.cz

# Pokud DNS resolve → HTTP response:
#   - 200 + x-subdomain: inzerce → VŠE OK
#   - 200 + x-subdomain: main → Nginx nepředává Host header
#   - 301/302 → Redirect (SITE_PASSWORD gate?)
#   - Connection refused → Nginx nenaslouchá
#   - SSL error → Chybí certifikát
#   - DNS resolution failed → Chybí DNS záznam
```

---

## Produkční env variable

Na produkčním serveru MUSÍ být nastaveno:
```env
NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz
NEXT_PUBLIC_SHOP_URL=https://shop.carmakler.cz
NEXT_PUBLIC_MARKETPLACE_URL=https://marketplace.carmakler.cz
```

Tyto proměnné ovlivňují `lib/urls.ts` — bez nich se používá path-based routing (`/inzerce/...` místo `inzerce.carmakler.cz/...`). Middleware routing funguje nezávisle na těchto env vars.

---

## SITE_PASSWORD gate

`middleware.ts` (řádky 142-151) má site-wide password ochranu. Pokud je `SITE_PASSWORD` env var nastaveno, KAŽDÝ request (včetně subdomén) se redirectne na `/gate` pokud nemá správný cookie `site_access`.

To by mohlo vysvětlovat proč "nefunguje" — uživatel vidí gate stránku místo inzerce. **Ověřit:** je `SITE_PASSWORD` nastaveno v produkčním env?

---

## Checklist pro fix

1. [ ] `dig inzerce.carmakler.cz A` → vrací IP serveru?
2. [ ] Nginx `server_name` zahrnuje `inzerce.carmakler.cz` (nebo `*.carmakler.cz`)?
3. [ ] Nginx `proxy_set_header Host $host;` je přítomno?
4. [ ] SSL certifikát pokrývá `inzerce.carmakler.cz`?
5. [ ] Env var `NEXT_PUBLIC_INZERCE_URL=https://inzerce.carmakler.cz` na produkci?
6. [ ] SITE_PASSWORD gate neblokuje subdoénu?
7. [ ] `curl -I https://inzerce.carmakler.cz` → 200 + `x-subdomain: inzerce`?
8. [ ] Lokální test: `http://inzerce.localhost:3000` funguje?

---

## Závěr

**Aplikační kód je 100% připravený.** Problém je téměř jistě infrastrukturní (DNS, Nginx, SSL). Nejpravděpodobnější: **chybí DNS A záznam pro `inzerce.carmakler.cz`** + **Nginx `server_name` nezahrnuje subdoénu**.

Toto vyžaduje přístup na produkční server (`ssh server`) a DNS správu. Implementátor nebo uživatel musí provést checklist výše.
