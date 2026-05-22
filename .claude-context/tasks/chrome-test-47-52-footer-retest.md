# Chrome Browser Test — Footer Fix Retest (#47 + #52)
**Datum:** 2026-04-06  
**Tester:** TEST-CHROME agent  
**Commits:** `7f910ea` (#47 remap broken footer links) + `8671215` (#52 stub pages + inzerce cleanup)  
**Playwright:** headed Chromium, viewporty: 1280×900

---

## Výsledek: ✅ PASS — všechny footer linky fungují, žádné 404

---

## Scenario A — Main footer (#47 fix)

| Test | Status | Detail |
|------|--------|--------|
| "Staň se makléřem" → `/kariera` | ✅ | href="/kariera", HTTP 200, stránka se načte |
| "Blog" link NENÍ v footer | ✅ | `blogLink.count() === 0` — správně odstraněn |
| "FAQ" → `/jak-to-funguje` | ✅ | href="http://localhost:3000/jak-to-funguje", HTTP 200 |
| "Cookies" → `/zasady-cookies` | ✅ | href="http://localhost:3000/zasady-cookies", HTTP 200 |
| Žádné `[DOPLNIT*]` v footer | ✅ | Prázdné |

**Všechny 3 původně broken linky jsou opraveny:**
- ~~`/stan-se-maklerem` → 404~~ → nyní `/kariera` ✅
- ~~`/blog` → 404~~ → odstraněn z footer ✅
- ~~`/faq` → 404~~ → nyní `/jak-to-funguje` ✅

---

## Scenario B — Shop footer stub pages (#52)

### `/shop/vraceni-zbozi`

| Test | Status | Detail |
|------|--------|--------|
| "Vrácení zboží" link v footer | ✅ | href="/vraceni-zbozi" |
| HTTP 200 | ✅ | Stránka se načte |
| H1 "Vrácení zboží" | ✅ | Viditelný |
| 14-denní info box | ✅ | Text o 14 dnech přítomen |
| CTA link na `/shop/moje-objednavky` | ✅ | Přítomen |
| Link na `/reklamacni-rad` | ✅ | Přítomen |
| Žádné `[DOPLNIT*]` | ✅ | Prázdné |

### `/shop/reklamace`

| Test | Status | Detail |
|------|--------|--------|
| "Reklamace" link v footer | ✅ | Přítomen |
| HTTP 200 | ✅ | Stránka se načte |
| H1 "Reklamace" | ✅ | Viditelný |
| Záruka 24/12 měs info | ✅ | Text o záruce přítomen |
| Link na `/reklamacni-rad` | ✅ | Přítomen |
| Žádné `[DOPLNIT*]` | ✅ | Prázdné |

### Shop Cookies link

| Test | Status | Detail |
|------|--------|--------|
| "Cookies" → main web `/zasady-cookies` | ✅ | href="http://localhost:3000/zasady-cookies" (cross-subdomain správně) |

---

## Scenario C — Inzerce footer (#52 cleanup)

| Test | Status | Detail |
|------|--------|--------|
| "Ceník" link NENÍ v footer | ✅ | `footerText.match(/Ceník/) === null` |
| "Tipy" link NENÍ v footer | ✅ | `footerText.match(/Tipy/) === null` |
| "Katalog vozidel" přítomen | ✅ | Viditelný |
| "Přidat inzerát" přítomen | ✅ | Viditelný |
| "Moje inzeráty" přítomen | ✅ | Viditelný |
| Žádné `[DOPLNIT*]` | ✅ | Prázdné |

---

## Scenario D — Regression batch #26 + #28

| Test | Status | Detail |
|------|--------|--------|
| Main navbar PlatformSwitcher: Inzerce | ✅ | Link přítomen |
| Main navbar PlatformSwitcher: Shop | ✅ | Link přítomen |
| Main navbar PlatformSwitcher: Marketplace | ✅ | Link přítomen |
| Footer PLATFORMY sekce | ✅ | Viditelná |
| Žádné `[DOPLNIT*]` na main | ✅ | Prázdné |
| ShopTrustBar — Visa | ✅ | Viditelný |
| ShopTrustBar — Mastercard | ✅ | Viditelný |
| ShopTrustBar — Apple Pay | ✅ | Viditelný |
| ShopTrustBar — Google Pay | ✅ | Viditelný |
| ShopTrustBar — Zásilkovna | ✅ | Viditelný |
| ShopTrustBar — DPD | ✅ | Viditelný |
| ShopTrustBar — PPL | ✅ | Viditelný |
| ShopTrustBar — GLS | ✅ | Viditelný |
| ShopTrustBar — Česká pošta | ✅ | Viditelný |
| Žádné `[DOPLNIT*]` v shop footer | ✅ | Prázdné |
| Inzerce PlatformSwitcher funkční | ✅ | Shop link viditelný |

---

## HTTP status check (všechny testované URL)

| URL | HTTP | Status |
|-----|------|--------|
| `localhost:3000/kariera` | 200 | ✅ |
| `localhost:3000/jak-to-funguje` | 200 | ✅ |
| `localhost:3000/zasady-cookies` | 200 | ✅ |
| `localhost:3000/blog` | 404 | ✅ (správně — odkaz odstraněn) |
| `localhost:3000/stan-se-maklerem` | 404 | ✅ (správně — odkaz remapován na /kariera) |
| `shop.localhost:3000/vraceni-zbozi` | 200 | ✅ |
| `shop.localhost:3000/reklamace` | 200 | ✅ |

---

## Console errors — poznámka

Na main webu je 9 pre-existing console errors (8× `500 Internal Server Error` + 1× `404`) per page navigation — jedná se o chyby z API volání (stats, externe servisy) v dev prostředí bez přihlášení. **Nesouvisejí s footer opravami** a jsou přítomné i v předchozích testech. Nezablokují ship.

---

## Celkové skóre

| Scenario | Pass | Fail |
|----------|------|------|
| SA — Main footer broken links | 5 | 0 |
| SB — Shop stub pages (vraceni + reklamace + cookies) | 11 | 0 |
| SC — Inzerce footer cleanup | 6 | 0 |
| SD — Regression #26+#28 | 16 | 0 |
| **CELKEM** | **38** | **0** |

---

## Závěr

**✅ BATCH #26 + #28 + #47 + #52 READY TO SHIP**

Všechny původně broken footer linky jsou opraveny:
- Main: "Staň se makléřem" → `/kariera`, "FAQ" → `/jak-to-funguje`, "Blog" odstraněn
- Shop: `/vraceni-zbozi` ✅, `/reklamace` ✅, Cookies → main web (cross-subdomain)
- Inzerce: "Ceník" + "Tipy" odstraněny, ostatní linky OK
- Regression: PlatformSwitcher, FooterBase 4-col, ShopTrustBar — vše funkční, žádné placeholders
