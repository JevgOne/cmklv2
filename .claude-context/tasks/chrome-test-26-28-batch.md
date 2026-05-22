# Chrome Browser Test — Batch #26 + #28
**Datum:** 2026-04-06  
**Tester:** TEST-CHROME agent  
**Commits:** #26 `7e2c373`, #28 `1a65a0b`  
**Playwright:** headed Chromium, viewporty: 320px / 375px / 768px / 1440px

---

## Výsledek: ⚠️ MOSTLY PASS — 3 broken footer links

---

## Scenario 1 — Main web (localhost:3000)

### Navbar — PlatformSwitcher (#26)

| Test | Status | Detail |
|------|--------|--------|
| "Nabídka vozidel" link | ✅ | href="/nabidka" |
| **Inzerce** cross-subdomain link | ✅ | href="http://inzerce.localhost:3000/" |
| **Shop** cross-subdomain link | ✅ | href="http://shop.localhost:3000/" |
| **Marketplace** cross-subdomain link | ✅ | href="http://marketplace.localhost:3000/" |
| Legal linky v navbaru | ✅ | Ochrana OÚ, Obchodní podmínky, Cookies |
| Console errors | ✅ | žádné |

### Footer — redesign (#28)

| Test | Status | Detail |
|------|--------|--------|
| Žádné `[DOPLNIT*]` placeholders | ✅ | Prázdné ✅ |
| Sekce SLUŽBY | ✅ | Nabídka, Prodat auto, Jak to funguje, Staň se makléřem, Blog |
| Sekce PODPORA | ✅ | info@carmakler.cz, Po-Pa 8:00-18:00, FAQ, Kontaktní formulář, Reklamační řád |
| Sekce FIRMA | ✅ | CarMakler s.r.o., O nás, Kariéra |
| Sekce **PLATFORMY CARMAKLÉŘ** | ✅ | CarMakléř, Inzerce, Shop, **Marketplace** — 4 linky |
| Social FB | ✅ | https://facebook.com/carmakler (carmakler-specific!) |
| Social IG | ✅ | https://instagram.com/carmakler |
| Social YT | ✅ | https://youtube.com/@carmakler |
| © copyright | ✅ | "© 2026 CarMakler s.r.o." |
| Legal bottom bar | ✅ | Ochrana OÚ, Obchodní podmínky, Cookies |

### Responzivita

| Viewport | Status | Detail |
|----------|--------|--------|
| 1440px desktop | ✅ | OK, žádné placeholders |
| 768px tablet | ✅ | OK, žádné placeholders |
| 375px mobile | ✅ | Footer OK, hamburger (jiný selektor) |
| 320px narrow | ✅ | No horizontal overflow ✅ |

---

## Scenario 2 — Shop subdomain (shop.localhost:3000)

| Test | Status | Detail |
|------|--------|--------|
| H1 | ✅ | "Autodíly a příslušenství" |
| Shop navbar: Katalog, Košík, Moje objednávky | ✅ | |
| PlatformSwitcher: CarMakléř, Inzerce, Marketplace | ✅ | Cross-subdomain hrefs |
| Footer sekce SHOP | ✅ | Katalog dílů, Košík, Moje objednávky, Vrácení, Reklamace |
| Footer PODPORA | ✅ | email, hodiny, FAQ |
| Footer PLATFORMY | ✅ | CarMakléř, Inzerce, Shop, Marketplace |
| **ShopTrustBar — BEZPEČNÉ PLATBY** | ✅ | Visa, Mastercard, Apple Pay, Google Pay |
| **ShopTrustBar — DOPRAVCI (5 ks)** | ✅ | Zásilkovna, DPD, PPL, GLS, Česká pošta |
| © + legal | ✅ | "© 2026 CarMakler s.r.o." |
| Žádné placeholders | ✅ | |
| Console errors | ✅ | žádné |

---

## Scenario 3 — Marketplace subdomain (marketplace.localhost:3000)

| Test | Status | Detail |
|------|--------|--------|
| H1 | ✅ | "Investujte do aut, vydělejte 15-25 % ročně" |
| Veřejně přístupná (bez auth) | ✅ | Nevyžaduje přihlášení |
| Navbar: Pro dealery, Pro investory | ✅ | |
| PlatformSwitcher v navbar | ✅ | CarMakléř, Inzerce, Shop |
| Footer sekce MARKETPLACE | ✅ | Jak to funguje, **Pro investory**, **Pro dealery**, **Žádost o přístup**, FAQ |
| Footer PLATFORMY | ✅ | 4 linky |
| Žádné placeholders | ✅ | |
| Console errors | ✅ | žádné |

---

## Scenario 4 — Inzerce subdomain (inzerce.localhost:3000)

| Test | Status | Detail |
|------|--------|--------|
| H1 | ✅ | "Prodejte své auto. Zdarma." |
| Inzerce navbar: Katalog, Přidat inzerát, Moje inzeráty | ✅ | |
| PlatformSwitcher: CarMakléř, Shop, Marketplace | ✅ | Cross-subdomain hrefs |
| Footer sekce INZERCE | ✅ | Katalog vozidel, Přidat inzerát, Moje inzeráty, Ceník, Tipy prodejcům |
| Footer PLATFORMY | ✅ | 4 linky |
| Žádné placeholders | ✅ | |
| Console errors | ✅ | žádné |

---

## ❌ Broken Links — 3 bugy ve footer (main web)

Playwright potvrdil 3× HTTP 404 na odkazech z footer sekce SLUŽBY:

| Link text | href | HTTP | Dopad |
|-----------|------|------|-------|
| "Staň se makléřem" | `/stan-se-maklerem` | **404** | Stránka neexistuje |
| "Blog" | `/blog` | **404** | Stránka neexistuje |
| "FAQ" | `/faq` | **404** | Stránka neexistuje |

**Stránky jsou odkazovány z footer ale nebyli dosud implementovány.**

Rychlý fix: buď stránky vytvořit, nebo je zatím z footer odebrat do doby implementace.

---

## Celkové skóre

| Scenario | Pass | Fail |
|----------|------|------|
| S1 Main web — navbar PlatformSwitcher | 4 | 0 |
| S1 Main web — footer redesign | 10 | 0 |
| S1 Responzivita (4 viewporty) | 4 | 0 |
| S2 Shop subdomain | 10 | 0 |
| S3 Marketplace subdomain | 7 | 0 |
| S4 Inzerce subdomain | 6 | 0 |
| Footer links broken | 0 | **3** |
| **CELKEM** | **41** | **3** |

---

## Závěr

Batch #26 (PlatformSwitcher) a #28 (Footer redesign) jsou **funkční** — všechny 4 subdomény fungují, cross-linking správný, žádné placeholders, ShopTrustBar v pořádku, social ikony s carmakler-specific URL.

**3 bugy** — footer na main webu odkazuje na `/stan-se-maklerem`, `/blog`, `/faq` které vrací 404. Jsou to budoucí stránky ještě neimplementované.

**Doporučení:** Opravit 3 broken footer links před releasem → stránky vytvořit nebo linky dočasně odebrat.
