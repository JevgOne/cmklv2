# Scénář: Uvítací video pro nové makléře CarMakléř

**Formát:** Screencast PWA + voice-over (úvodní a závěrečný záběr face-to-camera)
**Délka:** ~4:30 (čtyři a půl minuty)
**Tón:** Přátelský, klidný, neformální. Jako kdyby mu to říkal zkušenější kolega u kafe. Žádná korporátní mluva, žádný tlak.
**Cílová skupina:** Nový makléř po registraci / po schválení onboardingu.
**Voice-over:** Český hlas (muž nebo žena), tempo ~140 slov/min, klidné.
**Hudba na pozadí:** Lehký pozitivní ambient, -18dB pod voice-overem.

---

## 1. UVÍTÁNÍ (0:00 – 0:25)

**Záběr:** Logo CarMakléř (oranžová, symbol + text) na bílém pozadí, jemná animace. Přechod na záběr člověka s telefonem u auta (stock/vlastní) nebo face-to-camera mluvčí.

**Text k namluvení:**

> „Ahoj a vítej v CarMakléř!
>
> Jsme rádi, že jsi tady. V tomhle krátkém videu ti ukážeme všechno, co potřebuješ vědět — od toho, jak nabrat první auto, až po to, jak dostaneš zaplaceno. Žádná věda, slibujeme.
>
> Tak pojďme na to."

---

## 2. CO JE CARMAKLÉŘ A JAK FUNGUJE (0:25 – 1:05)

**Záběr:** Jednoduchá animovaná infografika — flow:

```
[Prodejce chce prodat auto]
        ↓
[Ty — makléř — nabereš auto v terénu]
        ↓
[Zadáš do systému, BackOffice schválí]
        ↓
[Inzerát jde online, kupující se ozývají]
        ↓
[Auto se prodá → ty dostaneš provizi]
```

**Text k namluvení:**

> „CarMakléř je makléřská síť pro prodej aut. Jednoduše řečeno — ty v terénu najdeš auto k prodeji, nabereš ho do systému, a my se postaráme o inzerci a kupující.
>
> Celý proces je transparentní. Prodejce ví, co se děje, kupující dostane ověřený inzerát a ty dostaneš provizi.
>
> A ta provize? Pět procent z prodejní ceny, minimálně dvacet pět tisíc korun. Žádný strop — čím víc prodáš, tím víc vyděláš."

**Text overlay na obrazovce:** „5 % provize · min. 25 000 Kč · bez stropu"

---

## 3. PWA APLIKACE — JAK JI OTEVŘÍT (1:05 – 1:40)

**Záběr:** Screencast telefonu — otevření URL v Chrome/Safari → „Přidat na plochu" → ikona CarMakléř na home screenu → otevření jako fullscreen app.

**Text k namluvení:**

> „Tvým hlavním nástrojem je naše aplikace. A dobrá zpráva — nemusíš nic stahovat z obchodu. Otevřeš ji v prohlížeči a přidáš si ji na plochu telefonu. Od té chvíle vypadá a funguje jako normální appka.
>
> A tady je ta nejlepší část — funguje i offline. Když jsi někde bez signálu, třeba v garáži nebo na vesnici, data se uloží lokálně a synchronizují se, jakmile budeš zase online. Takže tě nic nezastaví."

**Záběr:** Krátká animace „offline" ikony → „online sync" → zelená fajfka.

---

## 4. JAK NABRAT AUTO — PRŮCHOD WIZARDEM (1:40 – 3:20)

**Záběr:** Screencast PWA — dashboard, klik na oranžové CTA „Přidat vozidlo".

**Text k namluvení (intro):**

> „Teď to hlavní — jak nabrat auto. Máš na to sedm kroků. Neboj, nemusíš je zvládnout najednou. Rozpracovaný koncept se automaticky ukládá a můžeš se k němu kdykoliv vrátit."

### Krok 1: Kontakt prodejce (1:50 – 2:00)

**Záběr:** Screenshot `ContactStep` — formulář s jménem, telefonem, zdrojem leadu (Bazoš, Sauto, Facebook, doporučení, studený kontakt).

> „Začneš kontaktem na prodejce. Jméno, telefon a odkud jsi se o autě dozvěděl."

### Krok 2: Fotografie (2:00 – 2:15)

**Záběr:** Screenshot `PhotosStep` — grid s fotkami, fotoprůvodce ukazující kde fotit.

> „Pak jdeš fotit. Máme fotoprůvodce, který ti přesně ukáže jaké záběry potřebujeme — exteriér, interiér, motor, detaily. Čím lepší fotky, tím rychlejší prodej. Ideálně patnáct a víc."

### Krok 3: VIN kód (2:15 – 2:35)

**Záběr:** Screenshot `VinStep` — VIN input → klik na „Skenovat" → kamera se otevře → VIN se přečte → dekódovaná data se zobrazí v kartě (značka, model, rok, palivo...).

> „Třetí krok — VIN kód. A tady to začne být šikovné. Nemusíš opisovat sedmnáct znaků ručně. Klikneš na „Skenovat", zaměříš kamerou na VIN štítek a aplikace ho sama přečte.
>
> Systém pak automaticky dekóduje značku, model, rok, motor, převodovku. Za tři sekundy máš polovinu formuláře vyplněnou."

### Krok 4: Detaily a výbava (2:35 – 2:50)

**Záběr:** Screenshot `DetailsStep` — předvyplněné parametry z VIN + `EquipmentSelector` s rozbalenými kategoriemi a zaškrtnutými položkami.

> „Ve čtvrtém kroku doplníš detaily — nájezd, barvu, stav. Většinu už máš z VIN dekódování. A výbavu vybereš z přehledného seznamu — rozbalíš kategorii, zaškrtneš co auto má. Můžeš přidat i vlastní položky."

### Krok 5: Inspekce (2:50 – 3:00)

**Záběr:** Screenshot `InspectionStep` — hodnocení stavu (Výborný/Dobrý/Ucházející/Špatný), focení defektů.

> „Pátý krok je inspekce. Ohodnotíš stav karoserie a interiéru. Pokud jsou nějaké vady, vyfotíš je a popíšeš. Kupující to ocení — a tobě se nebude nic vracet."

### Krok 6: Cena — AI cenový odhad (3:00 – 3:15)

**Záběr:** Screenshot `PricingStep` — klik na „Odhadnout cenu AI" → loading spinner → modrý card s rozmezím (min–max), doporučenou cenou, confidence badge, reasoning. Pod tím zelený card s provizí. Dole tlačítko „Vygenerovat popis AI".

> „A teď cena. Klikneš na „Odhadnout cenu" a umělá inteligence ti navrhne cenové rozmezí a doporučenou cenu. Vidíš i svoji provizi. Samozřejmě máš poslední slovo — ty znáš auto nejlíp.
>
> A bonus — dole si můžeš nechat vygenerovat celý popis inzerátu. AI to napíše profesionálně a tobě to ušetří dvacet minut."

### Krok 7: Kontrola a odeslání (3:15 – 3:20)

**Záběr:** Screenshot `ReviewStep` — zelený checklist, tlačítko „Odeslat ke schválení".

> „Poslední krok je kontrola. Systém ti ukáže, co je v pořádku a co chybí. Když je všechno zelené — odešleš a auto jde ke schválení. A je to."

---

## 5. DASHBOARD — PŘEHLED TVÝCH VOZIDEL (3:20 – 3:35)

**Záběr:** Screencast `dashboard` — statistiky (provize za měsíc, počet prodejů, aktivní vozidla), level badge, pozice v žebříčku, rozpracované koncepty (DraftsList), notifikace.

**Text k namluvení:**

> „Na dashboardu máš přehled o všem — kolik jsi tento měsíc vydělal, kolik máš aktivních vozidel, rozpracované koncepty. A taky svoji pozici v žebříčku makléřů. Jo, trochu to gamifikujeme — protože zdravá soutěž motivuje."

---

## 6. AI ASISTENT (3:35 – 3:50)

**Záběr:** Screencast — floating button dole → otevření AI chatu → quick actions bubbles („Jak fotit auto?", „Jak poznat stočený tacho?", „Jak funguje provize?") → ukázka odpovědi.

**Text k namluvení:**

> „A kdyby sis nevěděl rady — dole v rohu máš AI asistenta. Zeptej se ho na cokoliv: jak nastavit cenu, na co si dát pozor při inspekci, jakou smlouvu použít. Jsou tam i rychlé otázky, stačí kliknout. Je to jako mít zkušeného kolegu v kapse."

---

## 7. SMLOUVY — DIGITÁLNÍ PODPIS A PDF (3:50 – 4:10)

**Záběr:** Screencast — `/makler/contracts/new` → výběr typu smlouvy → vyplnění → náhled → `SignatureCanvas` (prodejce podepisuje prstem na displeji) → makléř podepisuje → PDF vygenerováno → odeslání emailem.

**Text k namluvení:**

> „Smlouvy řešíš taky přímo v aplikaci. Vyplníš údaje, prodejce podepíše prstem na displeji, ty taky, a systém vygeneruje PDF a pošle ho emailem. Žádné papírování, žádná tiskárna. Všechno čistě digitální."

---

## 8. PROVIZE — JAK TO FUNGUJE (4:10 – 4:20)

**Záběr:** Infografika / animace:

```
Auto se prodá za 400 000 Kč
    ↓
Tvoje provize: 5 % = 25 000 Kč ← (minimální sazba)
    ↓
Výplata na účet po úhradě kupujícím
```

**Text k namluvení:**

> „Ještě jednou k provizi — pět procent z prodejní ceny, minimálně dvacet pět tisíc. Peníze dostaneš na účet po tom, co kupující zaplatí. Všechno vidíš v aplikaci — kolik máš vydělat, kolik čeká na výplatu."

---

## 9. PODPORA (4:20 – 4:25)

**Záběr:** Ikony: AI asistent, manažer (avatar), telefon, email.

**Text k namluvení:**

> „Když budeš potřebovat pomoct — máš AI asistenta, svého manažera a celý tým CarMakléř. Vždycky se na nás můžeš obrátit."

---

## 10. MOTIVAČNÍ ZÁVĚR (4:25 – 4:35)

**Záběr:** Face-to-camera nebo animace — logo CarMakléř, makléř u auta s úsměvem, přechod na logo + tagline.

**Text k namluvení:**

> „Tak. Teď víš všechno, co potřebuješ. Nejsi v tom sám — jsme tu pro tebe. Hodně štěstí s prvním autem. Věříme, že to bude jízda."

**Záběr:** Logo CarMakléř. Fade out.

---

## TECHNICKÉ POZNÁMKY PRO PRODUKCI

### Seznam screenshotů / screencastů

| # | Záběr | URL v PWA | Typ |
|---|-------|-----------|-----|
| 1 | Logo CarMakléř animace | — | Grafika |
| 2 | Flow infografika (Prodejce→Makléř→Systém→Kupující) | — | Grafika/animace |
| 3 | Přidání PWA na plochu (Chrome/Safari) | — | Screencast telefonu |
| 4 | Dashboard s CTA, statistikami, level badge, leaderboard | `/makler/dashboard` | Screencast |
| 5 | ContactStep — formulář kontaktu prodejce | `/makler/vehicles/new` | Screenshot |
| 6 | PhotosStep — grid fotek + fotoprůvodce | `/makler/vehicles/new/photos` | Screenshot |
| 7 | VinStep — sken kamerou → VIN input → dekódovaná data | `/makler/vehicles/new/vin` | Screencast |
| 8 | DetailsStep — parametry + EquipmentSelector | `/makler/vehicles/new/details` | Screenshot |
| 9 | InspectionStep — hodnocení + focení defektů | `/makler/vehicles/new/inspection` | Screenshot |
| 10 | PricingStep — AI cenový odhad card + provize + AI popis | `/makler/vehicles/new/pricing` | Screencast |
| 11 | ReviewStep — zelený checklist + odeslat | `/makler/vehicles/new/review` | Screenshot |
| 12 | AI asistent — floating button → chat → quick actions | Overlay na jakékoliv stránce | Screencast |
| 13 | ContractWizard → SignatureCanvas → PDF | `/makler/contracts/new` | Screencast |
| 14 | Provize infografika (auto 400k → 5% = 25k) | — | Grafika |

### Grafické prvky

- Logo CarMakléř (symbol + text, oranžová/bílá varianta)
- Flow diagram: Prodejce → Makléř → Systém → Kupující (5 kroků, oranžové šipky)
- Provize infografika (400 000 Kč → 25 000 Kč)
- Progress bar animace (7 kroků wizardu)
- Overlay texty: „5 % provize · min. 25 000 Kč · bez stropu"
- Offline/online sync animace

### Časování

| Sekce | Od | Do | Délka |
|-------|----|----|-------|
| 1. Uvítání | 0:00 | 0:25 | 0:25 |
| 2. Co je CarMakléř | 0:25 | 1:05 | 0:40 |
| 3. PWA aplikace | 1:05 | 1:40 | 0:35 |
| 4. Wizard (7 kroků) | 1:40 | 3:20 | 1:40 |
| 5. Dashboard | 3:20 | 3:35 | 0:15 |
| 6. AI asistent | 3:35 | 3:50 | 0:15 |
| 7. Smlouvy | 3:50 | 4:10 | 0:20 |
| 8. Provize | 4:10 | 4:20 | 0:10 |
| 9. Podpora | 4:20 | 4:25 | 0:05 |
| 10. Závěr | 4:25 | 4:35 | 0:10 |
| **CELKEM** | | | **4:35** |

### Voice-over statistiky

- **Celkový počet slov:** ~680
- **Tempo:** ~140 slov/min (klidné, přátelské)
- **Jazyk:** Čeština, neformální tykání
- **Hlas:** Neutrální muž nebo žena, ne robotický, ne přehnaně nadšený

### Hudba

- Pozadí: Lehký pozitivní ambient/lo-fi (Epidemic Sound, Artlist, nebo free)
- Hlasitost: -18dB pod voice-over
- Žádné dramatické přechody, žádná EDM — prostě příjemná kulisa
