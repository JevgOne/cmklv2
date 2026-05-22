# Scénář: Uvítací video pro dodavatele dílů (vrakoviště & bazary)

**Formát:** Screencast PWA + voice-over (úvodní a závěrečný záběr face-to-camera)
**Délka:** ~5:00 (pět minut)
**Tón:** Přátelský, přímočarý, pragmatický. Jako kdyby to říkal kolega, který ví jak funguje branže. Žádná korporátní mluva, žádné přehnané sliby.
**Cílová skupina:** Majitel/provozovatel vrakoviště nebo autobazaru, který zvažuje nebo právě začal používat CarMakléř.
**Voice-over:** Český hlas (muž nebo žena), tempo ~140 slov/min, klidné.
**Hudba na pozadí:** Lehký pozitivní ambient, -18dB pod voice-overem.

---

## 1. UVÍTÁNÍ (0:00 – 0:25)

**Záběr:** Logo CarMakléř (oranžová, symbol + text) na bílém pozadí, jemná animace. Přechod na záběr vrakoviště/skladu dílů nebo face-to-camera mluvčí.

**Text k namluvení:**

> „Ahoj a vítej v CarMakléř!
>
> Jsme rádi, že jsi tady. V tomhle krátkém videu ti ukážeme, jak funguje naše aplikace pro dodavatele dílů — od přidání prvního dílu až po to, jak ti přijdou peníze na účet. Je to jednodušší, než si myslíš.
>
> Tak pojďme na to."

---

## 2. CO JE CARMAKLÉŘ A JAK TO FUNGUJE (0:25 – 1:10)

**Záběr:** Jednoduchá animovaná infografika — flow:

```
[Ty — dodavatel — přidáš díly do systému]
        ↓
[Díly se objeví v e-shopu CarMakléř]
        ↓
[Zákazník najde díl, objedná, zaplatí]
        ↓
[Ty balíš a posíláš → peníze jdou na tvůj účet]
```

**Text k namluvení:**

> „CarMakléř je marketplace pro autodíly. Jednoduše řečeno — ty přidáš díly do systému, zákazníci je najdou v našem e-shopu, objednají a zaplatí. Ty je odešleš a peníze dostaneš automaticky na účet.
>
> A teď to nejdůležitější — celý nástroj je pro tebe **zdarma**. Žádný paušál, žádné měsíční poplatky. My si bereme jen provizi z prodaných dílů. Prodáš? Vyděláš ty i my. Neprodáš? Nic neplatíš.
>
> Je to jako Wolt pro restaurace — appku dostaneš zdarma a platíš jen když ti chodí objednávky."

**Text overlay na obrazovce:** „Nástroj ZDARMA · Provize jen z prodaných dílů · Žádný paušál"

---

## 3. REGISTRACE A ONBOARDING (1:10 – 1:50)

**Záběr:** Screencast telefonu — onboarding flow (3 kroky).

### Krok 1: Údaje o firmě (1:15 – 1:25)

**Záběr:** Screenshot `/parts/onboarding/profile` — formulář s názvem firmy, IČO, telefon, adresa.

> „Po registraci tě čekají tři jednoduché kroky. Nejdřív vyplníš údaje o firmě — název, IČO, telefon a adresu. Nic složitého."

### Krok 2: Dokumenty (1:25 – 1:35)

**Záběr:** Screenshot `/parts/onboarding/documents` — upload živnostenského listu a občanky.

> „Pak nahraješ živnostenský list nebo výpis z rejstříku a občanku. Je to kvůli ověření — chceme, aby zákazníci věděli, že nakupují od ověřeného dodavatele."

### Krok 3: Schválení (1:35 – 1:50)

**Záběr:** Screenshot `/parts/onboarding/approval` — čekací obrazovka s animovanou ikonou.

> „A pak počkáš na schválení — obvykle do dvaceti čtyř hodin. Jakmile tě schválíme, můžeš začít přidávat díly. Dostaneš notifikaci na email."

---

## 4. PWA APLIKACE — PŘIDÁNÍ NA PLOCHU (1:50 – 2:10)

**Záběr:** Screencast telefonu — otevření URL v Chrome/Safari → „Přidat na plochu" → ikona CarMakléř na home screenu → otevření jako fullscreen app.

**Text k namluvení:**

> „Tvým hlavním nástrojem je naše aplikace. Nemusíš nic stahovat z obchodu — otevřeš ji v prohlížeči a přidáš si ji na plochu telefonu. Od té chvíle vypadá a funguje jako normální appka.
>
> A funguje i offline. Když jsi ve skladu bez signálu, data se uloží lokálně a synchronizují se, jakmile budeš zase online."

---

## 5. DASHBOARD — TVŮJ PŘEHLED (2:10 – 2:30)

**Záběr:** Screencast `/parts` — dashboard s CTA „Přidat nový díl", statistikami (aktivní díly, čekající objednávky, tržby za měsíc, hodnocení), graf tržeb.

**Text k namluvení:**

> „Po přihlášení vidíš dashboard. Tady máš přehled o všem — kolik máš aktivních dílů, kolik čekajících objednávek, kolik jsi tento měsíc utržil. A graf, jak ti rostou tržby.
>
> A uprostřed velké tlačítko „Přidat nový díl". To je místo, kde to začíná."

---

## 6. JAK PŘIDAT DÍL — PRŮCHOD WIZARDEM (2:30 – 3:40)

**Záběr:** Screencast PWA — klik na CTA „Přidat nový díl", wizard se otevře.

**Text k namluvení (intro):**

> „Přidání dílu má tři kroky. Je to rychlé — jeden díl přidáš za minutu."

### Krok 1: Fotografie (2:40 – 2:55)

**Záběr:** Screenshot `/parts/new` — PhotoStep s gridem fotek, upload tlačítko.

> „Začneš fotkami. Můžeš nahrát až deset fotek — čím víc, tím líp. Zákazník chce vidět díl ze všech stran. První fotka bude hlavní v e-shopu."

### Krok 2: Detaily (2:55 – 3:15)

**Záběr:** Screenshot `/parts/new` — DetailsStep s názvem dílu, kategorií, stavem, OEM číslem, kompatibilitou.

> „Ve druhém kroku vyplníš detaily — název dílu, kategorii, stav. Můžeš přidat OEM číslo, výrobce a popis.
>
> A důležitá věc — kompatibilita. Nastavíš, na jaké značky, modely a roky se díl hodí. Díky tomu zákazník najde přesně to, co potřebuje. Můžeš přidat víc vozidel — třeba díl sedí na Octavii i na Golf."

### Krok 3: Cena a doručení (3:15 – 3:35)

**Záběr:** Screenshot `/parts/new` — PricingStep s cenou, DPH, skladem, zárukou, možnostmi doručení (PPL, Zásilkovna, Česká pošta, osobní odběr).

> „Třetí krok — nastavíš cenu, jestli je s DPH nebo bez, kolik kusů máš na skladě a jakou záruku nabízíš.
>
> A vybereš způsoby doručení — PPL, Zásilkovna, Česká pošta, DPD, GLS, nebo osobní odběr. Zaškrtneš co nabízíš a je to."

### Publikování (3:35 – 3:40)

**Záběr:** Screenshot — náhled dílu + tlačítko „Publikovat".

> „Zkontrolujete si náhled a kliknete publikovat. Díl je okamžitě v e-shopu a čeká na zákazníky."

---

## 7. HROMADNÝ IMPORT — PRO VELKÉ SKLADY (3:40 – 4:00)

**Záběr:** Screencast `/parts/import` — upload CSV souboru, náhled dat, tlačítko import.

**Text k namluvení:**

> „Máš na skladě stovky dílů a nechce se ti je přidávat jeden po druhém? Žádný problém. Připravíš si jednoduchý CSV soubor — Excel tabulku — a nahraješ ji najednou. Systém ti ukáže náhled a naimportuje všechno naráz.
>
> Ze sta dílů na Excelu máš za pět minut plný e-shop."

---

## 8. OBJEDNÁVKY — OD PŘIJETÍ PO ODESLÁNÍ (4:00 – 4:30)

**Záběr:** Screencast `/parts/orders` — seznam objednávek s taby (Nové, K odeslání, Aktivní, Hotovo).

**Text k namluvení (intro):**

> „Když si zákazník objedná tvůj díl, dostaneš notifikaci a objednávka se objeví v sekci „Objednávky"."

### Nová objednávka (4:05 – 4:15)

**Záběr:** Screencast `/parts/orders/[id]` — detail objednávky s údaji kupujícího, položkami, adresou.

> „Klikneš na objednávku a vidíš všechno — kdo objednal, co, kam to chce poslat. Potvrdíš objednávku a připravíš díl k odeslání."

### Štítek a odeslání (4:15 – 4:25)

**Záběr:** Screencast — ShippingLabelCard, stažení štítku, označení jako odesláno.

> „Přepravní štítek si vygeneruješ přímo v aplikaci — stáhneš PDF, nalepíš na balík a hotovo. Pak označíš jako odesláno a zákazník dostane tracking."

### Hotovo (4:25 – 4:30)

> „Po doručení se objednávka přesune do „Hotovo" a peníze za díl ti přijdou automaticky na účet přes Stripe."

---

## 9. VÝPLATY — STRIPE CONNECT (4:30 – 4:45)

**Záběr:** Screencast `/parts/profile` — SupplierStripeCard s napojením na Stripe.

**Text k namluvení:**

> „Peníze dostáváš automaticky přes Stripe. V profilu si jednou nastavíš bankovní účet — napojíš Stripe a od té chvíle ti chodí výplaty samy. Vidíš přehled tržeb, provizi a co ti přistane na účtu.
>
> Žádné faktury, žádné dohánění plateb. Zákazník zaplatí, my zpracujeme, ty dostaneš peníze."

---

## 10. MOJE DÍLY — SPRÁVA INVENTÁŘE (4:45 – 4:55)

**Záběr:** Screencast `/parts/my` — seznam dílů s taby (Vše, Aktivní, Neaktivní, Prodané), kartičky dílů.

**Text k namluvení:**

> „V sekci „Moje díly" máš přehled o celém svém inventáři. Vidíš co je aktivní, co se prodalo, kolik má každý díl zobrazení. Každý díl můžeš upravit, deaktivovat nebo smazat. Je to tvůj digitální sklad."

---

## 11. ZÁVĚR A MOTIVACE (4:55 – 5:05)

**Záběr:** Face-to-camera nebo animace — logo CarMakléř, dodavatel ve skladu s telefonem, přechod na logo + tagline.

**Text k namluvení:**

> „Tak. Teď víš všechno, co potřebuješ. Přidej první díl, ať se to rozjede. A kdyby cokoliv — napiš nám na podpora@carmakler.cz nebo zavolej. Jsme tu pro tebe.
>
> Hodně úspěšných prodejů. Jedeme!"

**Záběr:** Logo CarMakléř. Fade out.

---

## TECHNICKÉ POZNÁMKY PRO PRODUKCI

### Seznam screenshotů / screencastů

| # | Záběr | URL v PWA | Typ |
|---|-------|-----------|-----|
| 1 | Logo CarMakléř animace | — | Grafika |
| 2 | Flow infografika (Dodavatel→E-shop→Zákazník→Platba) | — | Grafika/animace |
| 3 | Onboarding krok 1 — údaje firmy | `/parts/onboarding/profile` | Screenshot |
| 4 | Onboarding krok 2 — upload dokumentů | `/parts/onboarding/documents` | Screenshot |
| 5 | Onboarding krok 3 — čekání na schválení | `/parts/onboarding/approval` | Screenshot |
| 6 | Přidání PWA na plochu (Chrome/Safari) | — | Screencast telefonu |
| 7 | Dashboard s CTA, statistikami, grafem tržeb | `/parts` | Screencast |
| 8 | PhotoStep — grid fotek, upload | `/parts/new` (krok 1) | Screenshot |
| 9 | DetailsStep — název, kategorie, kompatibilita | `/parts/new` (krok 2) | Screenshot |
| 10 | PricingStep — cena, DPH, doručení, náhled | `/parts/new` (krok 3) | Screenshot |
| 11 | CSV import — upload, náhled, výsledek | `/parts/import` | Screencast |
| 12 | Objednávky — seznam s taby | `/parts/orders` | Screencast |
| 13 | Detail objednávky — kupující, položky, adresa | `/parts/orders/[id]` | Screenshot |
| 14 | Shipping label — vygenerování štítku | `/parts/orders/[id]` | Screencast |
| 15 | Stripe Connect — napojení v profilu | `/parts/profile` | Screencast |
| 16 | Moje díly — seznam s filtry | `/parts/my` | Screenshot |

### Grafické prvky

- Logo CarMakléř (symbol + text, oranžová/bílá varianta)
- Flow diagram: Dodavatel → E-shop → Zákazník → Platba (4 kroky, oranžové šipky)
- Text overlay: „Nástroj ZDARMA · Provize jen z prodaných dílů · Žádný paušál"
- Onboarding progress bar (3 kroky)
- Bottom nav vizualizace (5 ikon: Home, Díly, +, Objednávky, Profil)
- Offline/online sync animace

### Časování

| Sekce | Od | Do | Délka |
|-------|----|----|-------|
| 1. Uvítání | 0:00 | 0:25 | 0:25 |
| 2. Co je CarMakléř | 0:25 | 1:10 | 0:45 |
| 3. Onboarding (3 kroky) | 1:10 | 1:50 | 0:40 |
| 4. PWA na plochu | 1:50 | 2:10 | 0:20 |
| 5. Dashboard | 2:10 | 2:30 | 0:20 |
| 6. Přidání dílu (3 kroky) | 2:30 | 3:40 | 1:10 |
| 7. Hromadný import | 3:40 | 4:00 | 0:20 |
| 8. Objednávky | 4:00 | 4:30 | 0:30 |
| 9. Výplaty (Stripe) | 4:30 | 4:45 | 0:15 |
| 10. Moje díly | 4:45 | 4:55 | 0:10 |
| 11. Závěr | 4:55 | 5:05 | 0:10 |
| **CELKEM** | | | **5:05** |

### Voice-over statistiky

- **Celkový počet slov:** ~720
- **Tempo:** ~140 slov/min (klidné, přátelské)
- **Jazyk:** Čeština, neformální tykání
- **Hlas:** Neutrální muž nebo žena, ne robotický, ne přehnaně nadšený

### Hudba

- Pozadí: Lehký pozitivní ambient/lo-fi (Epidemic Sound, Artlist, nebo free)
- Hlasitost: -18dB pod voice-over
- Žádné dramatické přechody, žádná EDM — prostě příjemná kulisa

### Klíčové sdělení videa

1. **Zdarma** — žádný paušál, provize jen z prodaného
2. **Jednoduché** — 3 kroky onboarding, 3 kroky přidání dílu
3. **Automatické** — objednávky přijdou samy, peníze přijdou samy
4. **Profesionální** — ověření dodavatelé, přepravní štítky, tracking
5. **Hromadný import** — pro velké sklady, CSV za 5 minut
