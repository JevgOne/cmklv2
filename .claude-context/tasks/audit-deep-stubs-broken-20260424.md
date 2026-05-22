# Deep Audit: Stuby, Broken funkce a Technický dluh

**Datum:** 2026-04-24
**Autor:** Plánovač
**Scope:** Celý codebase — všech 7 produktových oblastí

---

## SOUHRN

| Závažnost | Počet |
|-----------|-------|
| 🔴 BLOCKER | 4 |
| 🟠 MAJOR | 12 |
| 🟡 MINOR | 19 |
| **CELKEM** | **35** |

---

## 🔴 BLOCKERS (4)

### B1. Marketplace: Tlačítka bez onClick handlerů
- **Soubor:** `app/(web)/marketplace/dealer/[id]/page.tsx:181-186`
- **Produkt:** Marketplace VIP
- **Problém:** Dvě tlačítka "Označit jako dokončené" a "Aktualizovat fotky" nemají žádný onClick handler. Kliknutí nedělá nic.
- **Dopad:** Dealer nemůže aktualizovat stav flipu ani nahrát nové fotky opravy. Kritický workflow blokován.
- **Fix:** Implementovat handlery — PATCH na `/api/marketplace/opportunities/[id]` pro status update, file upload pro fotky.

### B2. Marketplace: Photo upload je UI-only stub
- **Soubor:** `app/(web)/marketplace/dealer/[id]/page.tsx:126-136`
- **Produkt:** Marketplace VIP
- **Problém:** Oblast "Fotky z opravy" zobrazuje dashed border s tlačítkem "Nahrát fotky", ale tlačítko nemá onClick handler ani file input. Čistě vizuální placeholder.
- **Dopad:** Dealer nemůže dokumentovat průběh opravy fotkami — klíčová funkce pro investory.
- **Fix:** Přidat file input + upload handler + API endpoint pro repair photos.

### B3. Inzerce: maxListings hardcoded na 10
- **Soubor:** `app/(web)/moje-inzeraty/page.tsx:142`
- **Produkt:** Inzertní platforma
- **Problém:** `const maxListings = 10; // Placeholder, API by mělo vracet skutečný limit` — limit je hardcoded místo dle typu účtu (PRIVATE=1, BAZAAR=10, DEALER=neomezeno).
- **Dopad:** Soukromý prodejce vidí "1/10" místo "1/1". Dealer vidí "5/10" místo "5/∞". Matoucí UX, potenciálně blokuje DEALER účty.
- **Fix:** Načíst account type ze session, zobrazit správný limit per tier.

### B4. Cloudinary migrace: Not Implemented
- **Soubor:** `scripts/migrate-cloudinary.ts:66-73`
- **Produkt:** Infrastruktura
- **Problém:** Funkce `migrateUrl()` obsahuje `throw new Error("Not implemented")`. Celý migrační skript je nefunkční.
- **Dopad:** Migrace z Cloudinary na self-hosted nemůže proběhnout. Pokud se spustí, crashne.
- **Fix:** Implementovat fetch → Sharp processing → zápis na disk → return URL (4 kroky v TODO).

---

## 🟠 MAJOR (8)

### M1. Cloudinary migrace: Neúplný scope
- **Soubor:** `scripts/migrate-cloudinary.ts:58`
- **Produkt:** Infrastruktura
- **Problém:** `// TODO: Part.images (JSON parse), User.avatar, User.documents, Contract.pdfUrl` — migrace pokrývá jen ListingImage, chybí 4 další entity.
- **Dopad:** I po implementaci migrateUrl() zůstanou Cloudinary URLs v Part, User a Contract tabulkách.

### M2. Kontakt stránka: Map placeholder místo mapy
- **Soubor:** `app/(web)/kontakt/page.tsx:69-80`
- **Produkt:** Veřejný web
- **Problém:** Místo interaktivní mapy je jen šedý div s emoji 📍 a textem "CarMakléř — Praha". Komentář `{/* Map placeholder */}`.
- **Dopad:** Neprofesionální vzhled, uživatel nevidí přesnou lokaci.
- **Fix:** Přidat Google Maps embed nebo Mapy.cz iframe.

### M3. Partner dashboard: Silent error → infinite spinner
- **Soubor:** `app/(partner)/partner/dashboard/page.tsx:31-32`
- **Produkt:** Partner portál
- **Problém:** `catch (err) { console.error("Dashboard load failed:", err); }` — při chybě API se dashboard zasekne na loading skeletonu bez jakékoliv chybové hlášky.
- **Dopad:** Partner (dodavatel dílů) nevidí svůj dashboard, netuší proč, nemá retry tlačítko.
- **Fix:** Přidat error state s retry tlačítkem a user-visible chybovou hláškou.

### M4. Partner leads: Silent error na load i update
- **Soubor:** `app/(partner)/partner/leads/page.tsx:62-63, 83-84`
- **Produkt:** Partner portál
- **Problém:** Načtení i aktualizace leadů logují chybu jen do console.error. Žádná vizuální indikace pro uživatele.
- **Dopad:** Broker nevidí leady a netuší proč. Status update selže tiše — state mismatch.
- **Fix:** Přidat error/toast notifikaci při selhání.

### M5. Partner billing/stats/orders: Console-only errors
- **Soubory:**
  - `app/(partner)/partner/billing/page.tsx:31-32`
  - `app/(partner)/partner/stats/page.tsx:41-42`
  - `app/(partner)/partner/orders/page.tsx:55-56`
- **Produkt:** Partner portál
- **Problém:** Všechny 3 stránky mají identický pattern — catch block s console.error ale žádné UI error state.
- **Dopad:** Při výpadku API jsou stránky prázdné nebo na infinite spinneru.

### M6. Handover follow-up email chybí
- **Soubor:** `app/api/vehicles/[id]/handover/route.ts:185`
- **Produkt:** PWA makléř
- **Problém:** `// TODO: TASK-026 — automatický email kupujícímu po 7 dnech (follow-up systém)` — systém jen vytvoří notifikaci pro makléře, automatický follow-up email kupujícímu neexistuje.
- **Dopad:** Chybí automatizace post-prodejního procesu. Makléř musí manuálně volat.

### M7. Visual search: Graceful degradation bez API klíče
- **Soubor:** `app/api/parts/visual-search/route.ts:19-24`
- **Produkt:** Eshop dílů
- **Problém:** Bez ANTHROPIC_API_KEY vrací `"Vizuální vyhledávání je ve vývoji"` — ale UI tlačítko je aktivní a uživatel neví, že funkce nefunguje, dokud nenahraje fotku.
- **Dopad:** Uživatel nahraje fotku, čeká, a dostane "ve vývoji" zprávu. Frustruj��cí UX.
- **Fix:** Buď skrýt tlačítko když API key chybí, nebo zobrazit "Beta" badge.

### M8. Eshop checkout: Error data parsing
- **Soubor:** `app/(web)/shop/objednavka/page.tsx:120-121`
- **Produkt:** Eshop dílů
- **Problém:** `const errData = await res.json().catch(() => null); console.error("Order error:", errData);` — chyba objednávky jen logována do konzole.
- **Dopad:** Zákazník nevidí detailní důvod selhání objednávky.

### M9. Admin: 3 permanently disabled buttons ve Vehicles
- **Soubor:** `components/admin/VehiclesPageContent.tsx:48, 189, 192`
- **Produkt:** Admin panel
- **Problém:** Tlačítka Delete, Filtrovat a Přidat vozidlo jsou trvale `disabled` bez podmínky. "Přidat vozidlo" má title "Vozidla přidávají makléři přes PWA" — ale delete a filtr nemají vysvětlení.
- **Dopad:** Admin nemůže filtrovat vozidla ani smazat problematické záznamy.
- **Fix:** Implementovat delete + filtr, nebo přidat tooltip s vysvětlením.

### M10. Admin: 2 permanently disabled buttons v Brokers
- **Soubor:** `components/admin/BrokersPageContent.tsx:65, 185`
- **Produkt:** Admin panel
- **Problém:** Tlačítka Delete a Exportovat jsou trvale `disabled` bez podmínky. Žádné vysvětlení.
- **Dopad:** Admin nemůže exportovat seznam makléřů ani smazat neaktivní záznamy.
- **Fix:** Implementovat export (CSV/Excel) a delete s potvrzením.

### M11. PWA Parts: Shipping label nedostupný
- **Soubor:** `components/pwa-parts/orders/ShippingLabelCard.tsx:251`
- **Produkt:** PWA Parts (dodavatelé dílů)
- **Problém:** Tlačítko "🖨️ Stáhnout štítek (nedostupné)" je trvale disabled. Text explicitně říká "(nedostupné)".
- **Dopad:** Dodavatel nemůže stáhnout přepravní štítek přímo z aplikace — musí generovat manuálně.
- **Fix:** Implementovat Zásilkovna/PPL/DPD label API integraci.

### M12. Brand phone: Hardcoded fake číslo v dokumentech
- **Soubor:** `lib/brand-styles.ts:30`
- **Produkt:** Celá platforma
- **Problém:** `phone: "+420 123 456 789"` — fake telefonní číslo které se zobrazuje v PDF smlouvách (ř. 215), email footerech (ř. 264) a hlavičkách dokumentů (ř. 207).
- **Dopad:** Zákazník na smlouvě vidí nefunkční telefon.
- **Fix:** Nahradit skutečným firemním číslem nebo env proměnnou.

---

## 🟡 MINOR (19)

### m1. SEO data: Stub pro Parts model pages
- **Soubor:** `lib/seo-data.ts:1249`
- **Produkt:** Eshop dílů (SEO)
- **Problém:** `// Stub data only — full FAQ + long-form description přijde s #87c (SeoContent + AI gen).`
- **Dopad:** SEO stránky pro díly nemají FAQ ani long-form content. Nižší SEO score.

### m2. Makléř stats: Placeholder komentář (ale reálná data)
- **Soubor:** `app/(pwa)/makler/stats/page.tsx:126`
- **Produkt:** PWA makléř
- **Problém:** Komentář `// Mesicni prodeje (poslednich 6 mesicu) - placeholder data pro grafy` — ale data jsou ve skutečnosti z Prisma DB aggregate. Komentář je zavádějící, data jsou reálná.
- **Dopad:** Žádný funkční — jen matoucí komentář pro vývojáře.
- **Fix:** Smazat komentář "placeholder".

### m3. PWA audit script: Placeholder v summary
- **Soubor:** `scripts/audit-pwa-apps.js:280`
- **Produkt:** DevTools
- **Problém:** `.map((url) => ({ url })); // placeholder — real results are in renders above`
- **Dopad:** Audit skript generuje neúplné souhrnné výsledky.

### m4. Profile share: Empty catch
- **Soubor:** `app/(web)/profil/[slug]/ProfileClient.tsx:231`
- **Produkt:** Veřejný web
- **Problém:** `} catch {}` — Web Share API selhání tiché. Ale existuje clipboard fallback na řádku 233.
- **Dopad:** Minimální — fallback funguje.

### m5. View count increments: Fire-and-forget
- **Soubory:**
  - `app/(web)/nabidka/[slug]/page.tsx:185`
  - `app/(web)/profil/[slug]/ProfileClient.tsx:184`
- **Produkt:** Veřejný web
- **Problém:** `.catch(() => {})` na view count incrementech.
- **Dopad:** Nepřesné analytics, ale nekritické.

### m6. Admin parts: Silent supplier fetch
- **Soubor:** `app/(admin)/admin/parts/page.tsx:123`
- **Produkt:** Admin panel
- **Problém:** `.catch(() => {})` na fetch suppliers pro filtr dropdown.
- **Dopad:** Admin nevidí supplier filtr, ale hlavní data fungují.

### m7. JSON parse fallbacks (6+ instancí)
- **Soubory:**
  - `app/(web)/makleri/page.tsx:106` — broker cities
  - `app/(web)/nabidka/[slug]/page.tsx:955,960` — equipment list
  - `app/(web)/bazar/[slug]/page.tsx:71` — opening hours
  - `app/(web)/muj-ucet/profil/page.tsx:114` — specializations
  - `app/(web)/nabidka/porovnani/CompareTable.tsx:101` — equipment
- **Produkt:** Různé
- **Problém:** `try { JSON.parse(...) } catch { return []; }` — nevalidní JSON v DB tiše vrátí prázdné pole.
- **Dopad:** Data zmizí bez indikace. Nízké riziko pokud DB data jsou konzistentní.

### m8. `as any` type assertions (2 produkční)
- **Soubory:**
  - `components/pwa/vehicles/new/PhotosStep.tsx:138`
  - `components/pwa/vehicles/quick/QuickStep2.tsx:100`
- **Produkt:** PWA makléř
- **Problém:** `as any` na photos array update.
- **Dopad:** Type safety bypass, ale funkčně funguje.

### m9. Makléř dashboard: Aggressive error fallbacks
- **Soubor:** `app/(pwa)/makler/dashboard/page.tsx:39-92`
- **Produkt:** PWA makléř
- **Problém:** 6× `.catch(() => fallbackValue)` — každý dashboard widget má silent fallback.
- **Dopad:** Dashboard vždy zobrazí něco, ale partial failures jsou neviditelné.

### m10. Service Worker: Contact sync silent fail
- **Soubor:** `app/sw.ts:83`
- **Produkt:** PWA (offline)
- **Problém:** `console.error("[SW] Contact sync failed:", err)` — offline sync selhání jen logováno.
- **Dopad:** Kontakty přidané offline se nemusí synchronizovat zpět.

### m11. Contract PDF: Signature fallback to text
- **Soubor:** `app/api/contracts/[id]/pdf/route.ts:164,186`
- **Produkt:** PWA makléř
- **Problém:** Při selhání embedu podpisového obrázku se do PDF vloží text "[Podpis makléře]" místo obrázku.
- **Dopad:** PDF smlouva bez vizuálního podpisu.

### m12. Partner documents: "Zatím nedostupné" state
- **Soubor:** `app/(partner)/partner/documents/page.tsx:66-68`
- **Produkt:** Partner portál
- **Problém:** Dokumenty bez `href` zobrazí "Zatím nedostupné" s cursor-not-allowed. Legitimní UX pro zatím nevygenerované dokumenty.
- **Dopad:** Žádný — správné chování.
- **Status:** ✅ OK (není bug)

### m13. ShopTrustBar: Text badges místo SVG ikon
- **Soubor:** `components/shop/ShopTrustBar.tsx:6`
- **Produkt:** Eshop dílů
- **Problém:** `TODO(designer): Aktuálně text-badges jako placeholder. Nahradit oficiálními brand SVG` — platební metody (Visa, Mastercard, Apple Pay) a dopravci (Zásilkovna, DPD, PPL) zobrazeny jako text místo oficiálních SVG log.
- **Dopad:** Neprofesionální vzhled trust baru v eshopu.

### m14. PWA vehicle edit: Returns null (redirect stub)
- **Soubor:** `app/(pwa)/makler/vehicles/[id]/edit/page.tsx:139`
- **Produkt:** PWA makléř
- **Problém:** Stránka načte vozidlo, vytvoří draft a přesměruje na `/makler/vehicles/new/contact?draft=...&edit=...`. Samotná edit stránka vrací `null` — není to vlastní edit UI, jen redirect.
- **Dopad:** Funkčně OK (edit funguje přes redirect), ale zbytečný network roundtrip.

### m15. Zásilkovna: Mock fallback bez API klíče
- **Soubor:** `app/api/shipping/zasilkovna-points/route.ts:18-33`
- **Produkt:** Eshop dílů
- **Problém:** Bez `NEXT_PUBLIC_ZASILKOVNA_API_KEY` vrací hardcoded mock data s 3 fiktivními výdejními místy.
- **Dopad:** V dev/staging prostředí OK. Na produkci s klíčem funguje správně.

### m16. Supplier stats chart: Silent fail
- **Soubor:** `components/pwa-parts/dashboard/SupplierStats.tsx:45`
- **Produkt:** PWA Parts
- **Problém:** `catch { /* silent */ }` — chart data fail zobrazí prázdný dashboard.
- **Dopad:** Dodavatel nevidí grafy tržeb.

### m17. Smart search suggestions: Silent fail
- **Soubor:** `components/web/SmartSearchBar.tsx:33`
- **Produkt:** Veřejný web
- **Problém:** `catch { /* ignore */ }` — API návrhy selhání tiché.
- **Dopad:** Autocomplete přestane fungovat bez indikace, ale hlavní vyhledávání funguje.

### m18. Middleware URI decode: Silent null
- **Soubor:** `middleware.ts:61`
- **Produkt:** Core routing
- **Problém:** `catch { return null; }` — malformed URI tiše vrátí null.
- **Dopad:** URLs se speciálními znaky mohou selhat tiše.

### m19. Broker cities JSON: Silent empty array
- **Soubor:** `app/(web)/makleri/page.tsx:106`
- **Produkt:** Veřejný web (makléři)
- **Problém:** `try { JSON.parse(broker.cities); } catch { return []; }` — nevalidní JSON v cities poli tiše skryje lokace makléře.
- **Dopad:** Makléř zmizí z mapového přehledu bez indikace.

---

## PO PRODUKTECH

### Marketplace VIP (2 issues)
| # | Závažnost | Popis |
|---|-----------|-------|
| B1 | 🔴 BLOCKER | 2 tlačítka bez onClick handlerů |
| B2 | 🔴 BLOCKER | Photo upload je UI-only stub |

### Inzertní platforma (1 issue)
| # | Závažnost | Popis |
|---|-----------|-------|
| B3 | 🔴 BLOCKER | maxListings hardcoded 10 |

### Eshop dílů (4 issues)
| # | Závažnost | Popis |
|---|-----------|-------|
| M7 | 🟠 MAJOR | Visual search degradation bez API key |
| M8 | 🟠 MAJOR | Checkout error jen v konzoli |
| m1 | 🟡 MINOR | SEO stub data |
| m13 | 🟡 MINOR | ShopTrustBar text badges místo SVG |
| m15 | 🟡 MINOR | Zásilkovna mock fallback (dev only) |

### Partner portál (4 issues)
| # | Závažnost | Popis |
|---|-----------|-------|
| M3 | 🟠 MAJOR | Dashboard silent error → spinner |
| M4 | 🟠 MAJOR | Leads silent error na load i update |
| M5 | 🟠 MAJOR | Billing/stats/orders console-only errors |
| m12 | 🟡 MINOR | "Zatím nedostupné" docs (OK) |

### Veřejný web (5 issues)
| # | Závažnost | Popis |
|---|-----------|-------|
| M2 | 🟠 MAJOR | Kontakt: map placeholder |
| m4 | 🟡 MINOR | Profile share empty catch |
| m5 | 🟡 MINOR | View count fire-and-forget |
| m7 | 🟡 MINOR | JSON parse fallbacks |
| m17 | 🟡 MINOR | Smart search suggestions silent fail |
| m19 | 🟡 MINOR | Broker cities JSON silent empty |

### PWA makléř (7 issues)
| # | Závažnost | Popis |
|---|-----------|-------|
| M6 | 🟠 MAJOR | Handover follow-up email TODO |
| m2 | 🟡 MINOR | Stats placeholder komentář |
| m8 | 🟡 MINOR | `as any` type assertions |
| m9 | 🟡 MINOR | Dashboard aggressive fallbacks |
| m10 | 🟡 MINOR | SW contact sync silent fail |
| m11 | 🟡 MINOR | Contract PDF signature fallback |
| m14 | 🟡 MINOR | Vehicle edit returns null (redirect stub) |

### PWA Parts (2 issues)
| # | Závažnost | Popis |
|---|-----------|-------|
| M11 | 🟠 MAJOR | Shipping label nedostupný |
| m16 | 🟡 MINOR | Supplier stats chart silent fail |

### Admin panel (3 issues)
| # | Závažnost | Popis |
|---|-----------|-------|
| M9 | 🟠 MAJOR | 3 disabled buttons ve Vehicles (delete, filtr, přidat) |
| M10 | 🟠 MAJOR | 2 disabled buttons v Brokers (delete, export) |
| m6 | 🟡 MINOR | Parts supplier fetch silent |

### Celá platforma (1 issue)
| # | Závažnost | Popis |
|---|-----------|-------|
| M12 | 🟠 MAJOR | Brand phone hardcoded "+420 123 456 789" v dokumentech |

### Infrastruktura (2 issues)
| # | Závažnost | Popis |
|---|-----------|-------|
| B4 | 🔴 BLOCKER | Cloudinary migrace Not Implemented |
| M1 | 🟠 MAJOR | Cloudinary migrace neúplný scope |
| m3 | 🟡 MINOR | PWA audit script placeholder |

### Core routing (1 issue)
| # | Závažnost | Popis |
|---|-----------|-------|
| m18 | 🟡 MINOR | Middleware URI decode silent null |

---

## PRIORITIZOVANÝ FIX LIST

### Sprint 1 (okamžitě — user-facing blockers)
1. **B1+B2** — Marketplace dealer detail: implementovat onClick handlery + photo upload
2. **B3** — Inzerce maxListings: nahradit hardcoded 10 za per-account-type limit
3. **M12** — Brand phone: nahradit "+420 123 456 789" skutečným číslem firmy
4. **M3+M4+M5** — Partner portál: přidat error states místo console.error (5 stránek)

### Sprint 2 (brzy — UX a profesionalita)
5. **M2** — Kontakt stránka: přidat Google Maps / Mapy.cz embed
6. **M9+M10** — Admin: implementovat disabled buttons (delete, filtr, export)
7. **M11** — PWA Parts: implementovat shipping label download
8. **M7** — Visual search: skrýt nebo lablit jako "Beta" bez API key
9. **M8** — Checkout: zobrazit chybovou hlášku uživateli
10. **M6** — Handover follow-up: implementovat cron/email systém (TASK-026)
11. **m13** — ShopTrustBar: SVG brand ikony místo textu

### Sprint 3 (technický dluh)
12. **B4+M1** — Cloudinary migrace: implementovat migrateUrl() + doplnit scope
13. **m1** — SEO parts model data (#87c)
14. **m7+m19** — JSON parse: přidat logging pro detekci corrupt dat v DB
15. **m2** — Smazat zavádějící "placeholder" komentář v stats

---

*Generováno automatickým auditem codebase. Každý nález ověřen čtením zdrojového kódu.*
