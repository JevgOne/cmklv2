# Legal Brief — Task #90: Komisionářský model pro Carmakler eshop autodílů

**Datum:** 2026-04-07
**Pro:** Externí právník (specializace: e-commerce, B2C, EU Omnibus, OZ §2161+)
**Od:** Carmakler s.r.o. (provozovatel platformy)
**Připravil:** Plánovač (Carmakler agent team)

---

## 0. KONTEXT — CO JE CARMAKLER A CO STAVÍME

### 0.1 Carmakler ekosystém (4 produkty)
Carmakler s.r.o. provozuje platformu sestávající ze 4 propojených produktů:
1. **Makléřská síť** — zprostředkování prodeje vozidel certifikovanými makléři (Carmakler je smluvní zprostředkovatel)
2. **Inzertní platforma** — digitální inzerce aut pro soukromé prodejce a autobazary (free tool)
3. **Eshop autodílů** ⬅ **PŘEDMĚT TOHOTO LEGAL BRIEFU** — e-shop s **použitými díly z vrakovišť** + **nové aftermarket díly**
4. **Marketplace VIP** — uzavřená investiční platforma pro flipping aut (oddělený scope)

### 0.2 Eshop autodílů — business model (Wolt model)
- **Vrakoviště** (50+ partnerů, plán) přidávají díly do Carmakler eshopu přes vlastní PWA aplikaci
- **Carmakler** provozuje frontend (carmakler.cz/dily), platební bránu (Stripe Connect), customer support
- Vrakoviště používá PWA **zdarma**, Carmakler si bere **provizi 12-20 %** z prodaných dílů (variable per partner, dle kvality + objemu)
- **Tok peněz:** Zákazník zaplatí Stripem → Stripe Connect dynamic split → vrakoviště dostane 80-88 %, Carmakler dostane 12-20 %
- **Tok dílu:** Vrakoviště drží sklad → po objednávce balí + posílá zákazníkovi (přes Zásilkovnu, Carmakler shipping label)

### 0.3 Klíčová nejistota — komu patří díl?
**Současná pracovní hypotéza:** Carmakler je **komisionář** (zákon §2455 OZ a další), vrakoviště je **právní prodávající**. Vrakoviště zůstává vlastníkem dílu až do okamžiku prodeje koncovému zákazníkovi. Carmakler zprostředkovává prodej vlastním jménem na účet vrakoviště.

**Alternativní model:** Carmakler **kupuje** díly od vrakoviště za sníženou cenu a **dále prodává** zákazníkům jako vlastní zboží (Carmakler = prodávající). Tento model však zvyšuje daňovou zátěž (dvakrát DPH), inventory risk a operativní složitost.

**Otázka pro právníka:** Který z těchto modelů je legálně čistší a operativně jednodušší pro 50+ partnerů? Tento brief předpokládá **komisionářský model** a hledá potvrzení/odmítnutí.

### 0.4 Vazba na technickou implementaci
Tento legal brief blokuje produkční spuštění Carmakler eshopu autodílů. Stripe Connect dynamic split + DPH split logika **už je implementována**, ale za **ENABLE flag = false**. Po obdržení odpovědí od právníka:
- Carmakler nastaví ENABLE flag = true (pokud doporučení = komisionářský model)
- NEBO refaktoruje implementaci na alternativní model (pokud doporučení = jiný model)

---

## 0.5 SCOPE TOHOTO BRIEFU

### V scope (3 sekce):
1. **B2C reklamace** (PRIORITY #1 — největší vnímané riziko)
2. **Komisionářská smlouva** (vrakoviště ↔ Carmakler)
3. **DPH model** (split mezi vrakoviště + Carmakler, doklad pro zákazníka)

### Out of scope:
- ❌ Scraping ToS Sauto/TipCars/Bazoš — Carmakler nepoužívá scraping (potvrzeno s ownerem)
- ❌ DE→CZ Bridge legal (Mobile.de) — strategický bet pro Q4, ne MVP
- ❌ AI Price Valuation training data legal — bude trénováno jen na vlastních Carmakler datech
- ❌ Makléřská síť legal (oddělený scope, řeší se separátně)
- ❌ Marketplace VIP legal (oddělený scope)
- ❌ Inzertní platforma legal (free tool, žádné transakce)

---

# SEKCE #1 — B2C REKLAMACE (PRIORITA #1)

## 1.1 Kontext a hlavní otázka

Použité díly z vrakovišť mají vyšší míru reklamovatelnosti než nové díly (typicky 5-15 % dle interních benchmarků z partnerských vrakovišť). Carmakler chce stavět platformu jako **single-point-of-contact** pro zákazníka (jednotná zákaznická podpora, jednotná značka), ale zároveň **nepřebírat finální odpovědnost za vady dílů**, které Carmakler fyzicky nikdy nevidí.

**Hlavní otázka pro právníka:**

> Můžeme postavit Carmakler jako **komisionáře** (vrakoviště = právní prodávající, vlastník dílu až do prodeje koncovému zákazníkovi), ale zároveň jako **"reklamační single-point-of-contact"** (jediný kontaktní bod pro zákazníka), aniž bychom přebrali finální právní odpovědnost za vady? Jaké jsou minimální požadavky **EU Omnibus směrnice** a CZ **zákona o ochraně spotřebitele** + **§2161 a další OZ**, abychom tento model mohli provozovat legálně?

## 1.2 Konkrétní otázky pro právníka (8)

### Q1.1 — Zkrácení záruky na použité díly (§2168 OZ)

§2168 OZ umožňuje při prodeji použitého zboží zkrátit zákonnou záruku z 24 na 12 měsíců.

**Otázka:**
- Lze v komisionářské smlouvě (vrakoviště ↔ Carmakler) a následně v T&C (Carmakler ↔ koncový zákazník) **zkrátit záruku na použité díly z 24 na 12 měsíců** pro všechny použité díly z vrakovišť?
- Jaké jsou **minimální formální požadavky** pro takové zkrácení (písemně, transparentně, výslovně, kde — v košíku, v product detailu, v T&C, v emailu po objednávce)?
- Stačí **jednorázová akceptace T&C při registraci**, nebo musí být zkrácení **akceptováno per objednávka** (např. checkbox v košíku)?
- Existuje **kategorie dílů, u kterých zkrácení záruky NENÍ možné** (např. bezpečnostní díly — brzdy, airbagy, řídící jednotky)?

**Naše current assumption:** Zkrácení na 12 měsíců = OK pro všechny použité díly z vrakovišť, **POKUD** je to transparentně uvedeno v T&C + v product detail page + opětovně v košíku/checkoutu (3-bodová transparentnost).

### Q1.2 — Náklady na dopravu při reklamaci

**Otázka:**
- Kdo nese **náklady na zpětnou dopravu reklamovaného dílu** k vrakovišti (vrakoviště, Carmakler, nebo zákazník)?
- Lze v T&C definovat klauzuli **"zákazník dopraví díl zpět vrakovišti na vlastní náklady"** v B2C kontextu? Je to vymahatelné, nebo neplatné jako nepřiměřená klauzule (§1813 OZ)?
- Pokud se reklamace prokáže jako oprávněná, **musí vrakoviště nahradit dopravní náklady** zákazníkovi? V plné výši, nebo jen do určité hranice (cena nejlevnější přepravy)?
- Lze nabídnout **2 možnosti** (zákazník volí): (A) zákazník platí dopravu sám, ale dostane vrácení do 7 dní; (B) Carmakler/vrakoviště domluví svoz Zásilkovnou, zákazník nezaplatí, ale řešení trvá 14+ dní?

**Naše current assumption:** Při oprávněné reklamaci nese dopravu vrakoviště (přes Zásilkovna svoz). Při neoprávněné reklamaci platí zákazník zpětnou dopravu. Toto musí být v T&C jasně rozlišeno.

### Q1.3 — Insolvence vrakoviště během aktivní reklamace

**Otázka:**
- Co se stane, pokud vrakoviště **zruší činnost nebo zkrachuje**, zatímco má aktivní reklamaci od zákazníka?
- **Přebírá Carmakler automaticky odpovědnost** za vyřízení reklamace? Na základě jakého právního titulu?
- Měl by Carmakler vést **rezervní fond pro tyto případy** (např. 1-2 % z provize pooled do "reklamačního fondu")? Je to legálně akceptovatelný mechanismus?
- Lze v T&C **omezit Carmakler odpovědnost** na případy, kdy je vrakoviště insolventní (např. "Carmakler nahradí cenu dílu do 5 000 Kč v případě, že vrakoviště nemůže reklamaci vyřídit")?
- **Alternativa:** povinné pojištění vrakovišť (jako podmínka přijetí na platformu)? Existuje takový pojistný produkt v ČR?

**Naše current assumption:** Carmakler nepřebírá automatickou odpovědnost — to by zničilo komisionářský model. Ale chceme nabídnout zákazníkovi **goodwill kompenzaci** (z marketingového rozpočtu) v případech, kdy by vrakoviště selhalo. Otázka: je to legálně bezpečné (precedent risk)?

### Q1.4 — Disclaimer "as-is" pro rizikové díly

**Otázka:**
- Lze pro **extrémně rizikové použité díly** (motor, převodovka, řídící jednotka, airbag, ABS modul) nabídnout **úplné vyloučení záruky** s disclaimerem **"použitý díl bez záruky, prodej as-is"**?
- Je toto **legálně vymahatelné v B2C kontextu**, nebo platí absolutní minimum 12 měsíců záruky bez možnosti vyloučení (§2168 OZ ve spojení s §1813 OZ)?
- Pokud lze, jaké jsou **minimální požadavky transparentnosti** (písemně? checkbox? notarizace? video acceptance?)
- Lze nechat **vrakoviště označit konkrétní díly jako "as-is"** v PWA admin (per-SKU flag) — Carmakler pak v eshopu zobrazí výrazný disclaimer?
- **Hybrid model:** zákonná záruka 12 měsíců na "základní funkčnost" (díl je ten, který jsme inzerovali, není rozbitý při doručení), ALE vyloučení odpovědnosti za "životnost / opotřebení" (díl může mít kratší životnost než nový)?

**Naše current assumption:** Asi NE plné vyloučení záruky v B2C, ale ANO **transparentní disclaimer o očekávané životnosti** + **fotodokumentace stavu** od vrakoviště + **akceptace zákazníka před objednávkou**. To by mělo redukovat počet sporů, i když nevylučuje právo na reklamaci.

### Q1.5 — Reklamační formulář (Carmakler vs vrakoviště)

**Otázka:**
- **Musí mít každé vrakoviště vlastní reklamační formulář** (na vlastním webu, vlastní telefonní lince, vlastní emailové adrese), nebo stačí **centralizovaný Carmakler formulář**, který přeposílá reklamaci na email vrakoviště?
- Pokud stačí Carmakler centralizovaný formulář, **co musí obsahovat** podle EU Omnibus + zák. o ochraně spotřebitele:
  - Identifikační údaje právního prodávajícího (vrakoviště IČO, název, sídlo, kontakt)
  - Identifikační údaje zprostředkovatele (Carmakler s.r.o., IČO, sídlo)
  - Lhůty pro vyřízení reklamace (30 dní)
  - Možnost mimosoudního řešení sporů (ČOI, ADR)
  - Předloha reklamačního protokolu
- **Musí vrakoviště mít vlastní reklamační řád**, nebo lze použít **jednotný Carmakler reklamační řád**, který se aplikuje na všechny partnery?

**Naše current assumption:** Carmakler centralizovaný formulář v zákaznické zóně + email forward na vrakoviště = OK, ale Carmakler musí v každém kroku transparentně uvádět "právní prodávající: [vrakoviště]" a **nepředstírat**, že reklamaci řeší sám.

### Q1.6 — Single-Point-of-Contact pattern (Wolt model)

**Hlavní otázka sekce:** Carmakler chce následující flow:

```
1. Zákazník otevře reklamaci přes Carmakler customer support (web/email/telefon)
2. Carmakler customer support zaeviduje reklamaci v interním tool
3. Carmakler předá reklamaci vrakovišti přes interní notifikační kanál (email + admin notification)
4. Vrakoviště má X dní na první reakci (návrh: 7 dní)
5. Vrakoviště má Y dní na finální vyřízení (návrh: 30 dní celkem dle §19 zák. č. 634/1992)
6. Pokud vrakoviště ignoruje / zpoždění:
   a. Carmakler eskaluje (mediator)
   b. NEBO Carmakler přebírá vyřízení a odečte z provize vrakoviště (penalty)
7. Komunikace se zákazníkem proběhne **vždy přes Carmakler kanál**, vrakoviště nemá přímý kontakt
```

**Otázky:**
- **Je tento flow legálně přípustný?** Konkrétně: může Carmakler **komunikovat se zákazníkem vlastním jménem o reklamaci**, kterou právně řeší vrakoviště, aniž by se Carmakler stal **právním adresátem reklamace**?
- Je **30-denní lhůta na vyřízení reklamace dle §19 zák. č. 634/1992** závazná pro vrakoviště, **i když je reklamace doručena přes Carmakler** (a tedy s časovým zpožděním)? Začíná lhůta dnem doručení Carmaklerovi nebo vrakovišti?
- Je možné v komisionářské smlouvě stanovit **vnitřní SLA** (např. "vrakoviště musí reagovat do 7 dní"), s sankcí (např. **automatický penalty 5 % z měsíční provize**) v případě porušení?
- Pokud Carmakler **přebírá vyřízení** v případě nečinnosti vrakoviště (krok 6b), znamená to že **se stává právním prodávajícím retroaktivně**? Nebo lze konstruovat jako **mandatáře vrakoviště** (Carmakler jedná jménem vrakoviště)?

**Naše current assumption:** SPoC pattern je legal (Wolt, Bolt, Glovo, Foodora ho používají v ČR), ALE je nutná **explicitní transparentnost** (zákazník musí vědět, že právní prodávající = vrakoviště, ne Carmakler). Vnitřní penalty mechanismus = OK ve smluvním vztahu Carmakler ↔ vrakoviště.

### Q1.7 — Daňový doklad (kdo vystavuje, integrace se Stripe Connect)

**Otázka:**
- Daňový doklad (faktura nebo zjednodušený daňový doklad) **vystavuje vrakoviště** (jeho IČO, jeho DPH) NEBO **Carmakler** (jako zprostředkovatel)?
- Pokud **vrakoviště**, jak se to integruje se **Stripe Connect dynamic split** technicky? Stripe vygeneruje 1 účtenku za celkovou částku, ale daňový doklad dle CZ DPH zákona musí být na konkrétní IČO právního prodávajícího.
- **Lze v jedné objednávce** (košík) mít díly od **více vrakovišť** najednou? Pak by zákazník dostal **více daňových dokladů** (jeden per vrakoviště)?
- **Zjednodušený daňový doklad** (do 10 000 Kč) — stačí, nebo musí Carmakler/vrakoviště vystavit plnou fakturu?
- **Carmakler vystavuje provizní fakturu vrakovišti** (12-20 % komise) — to je separátní doklad, předpokládám?

**Naše current assumption:** Vrakoviště vystavuje daňový doklad zákazníkovi (právní prodávající). Carmakler vystavuje provizní fakturu vrakovišti. Stripe Connect handluje split, ale daňové doklady jsou na úrovni Carmakler aplikace (vrakoviště je vygeneruje přes PWA tool, Carmakler centrálně archivuje). Pokud košík obsahuje díly od víc vrakovišť → víc dokladů (může být UX problém, ale legal compliance je důležitější).

### Q1.8 — EU Omnibus transparentnost

EU směrnice **Omnibus** (2019/2161, transponována do ČR v roce 2023) zavádí povinnost online marketplace zveřejňovat **identitu prodávajícího** u každé nabídky.

**Otázky:**
- **Co konkrétně musí Carmakler zveřejnit u každého dílu**, aby splnil EU Omnibus + CZ ZOOS §1820 odst. 1?
  - IČO + název vrakoviště?
  - Sídlo (ulice + město + PSČ)?
  - Kontaktní email a telefon vrakoviště?
  - Status plátce DPH vrakoviště?
  - Identifikátor zápisu v obchodním rejstříku (oddíl, vložka)?
- **Stačí to v product detail page**, nebo **musí být i v košíku/checkoutu** (před akceptací objednávky)?
- **Stačí to v T&C**, nebo **musí být u každé položky zvlášť**?
- Co když je v košíku **víc vrakovišť** (více prodávajících)? Musí být zákazník schopen si **u každé položky ověřit identitu prodávajícího bez složitého klikání**?
- **Jaké jsou pokuty** za nedodržení (ČOI sankce)?

**Naše current assumption:** U každého dílu v product detail = malý box "Prodávající: Autovrak Praha 5 s.r.o., IČO 12345678" + link na detail prodávajícího. V košíku = list položek s prodávajícím u každé. V T&C = obecné info. Toto by mělo splnit Omnibus, ale chceme potvrzení.

---

# SEKCE #2 — KOMISIONÁŘSKÁ SMLOUVA (vrakoviště ↔ Carmakler)

## 2.1 Kontext

Carmakler chce uzavřít s každým vrakovištěm (50+ partnerů, plán) **komisionářskou smlouvu** dle §2455 a násl. OZ. Vrakoviště zůstává **vlastníkem dílu** až do okamžiku prodeje koncovému zákazníkovi. Carmakler **zprostředkovává prodej vlastním jménem na účet vrakoviště** za **provizi 12-20 % z prodejní ceny** (variable per partner, dle objemu, kvality, exkluzivity).

**Hlavní otázka pro právníka:**

> Je komisionářský model dle §2455+ OZ vhodný pro provoz B2C eshopu s 50+ partnery, kde Carmakler chce vystupovat jako "single-point-of-contact" pro zákazníka? Jaké jsou klíčové smluvní klauzule, které musíme zahrnout?

## 2.2 Konkrétní otázky pro právníka (6)

### Q2.1 — Vlastnictví dílu při prodeji

**Otázka:**
- V komisionářském modelu (§2455+ OZ) vrakoviště zůstává **vlastníkem dílu** až do okamžiku prodeje koncovému zákazníkovi. **Vlastnictví přechází přímo z vrakoviště na zákazníka** (Carmakler nikdy není vlastníkem).
- **Je toto správné** pro náš případ, kdy:
  - Díl je fyzicky v skladu vrakoviště (Carmakler nemá inventory)
  - Stripe Connect dynamic split rozdělí platbu při zaplacení (Carmakler dostane provizi, vrakoviště dostane 80-88 %)
  - Vrakoviště balí + odesílá díl koncovému zákazníkovi (přes Zásilkovnu, Carmakler shipping label)
- **Existují alternativní modely**, které by byly výhodnější (např. **skladovací smlouva + komise**, **agentura**, **nákup-prodej**)? Pro/proti pro 50+ partnerů.
- Jak se liší **právní postavení Carmakleru** v tomto modelu od **internetových marketplace** typu Mall.cz, Heureka, Allegro, Wolt?

**Naše current assumption:** Komisionářský model je správný (Carmakler nikdy vlastní díl) a odpovídá Wolt/Bolt patternu.

### Q2.2 — Fakturace koncovému zákazníkovi

**Otázka:**
- **Kdo fakturuje koncovému zákazníkovi** (vystavuje daňový doklad)?
- Naše assumption: **vrakoviště** (právní prodávající), které vystaví doklad přes Carmakler PWA tool (Carmakler centralizovaný systém umožní vrakovišti vygenerovat doklad). **Je to správně?**
- **Lze Carmakler** (jako komisionář) **vystavit doklad jménem vrakoviště** (na základě zmocnění v komisionářské smlouvě)? Pak by zákazník dostal jeden doklad od "Carmakler s.r.o. jako komisionář pro Autovrak Praha 5 s.r.o.". **Je to legálně přípustné** dle CZ DPH zákona + zák. o účetnictví?
- **Praktická otázka:** uživatel vidí v emailu po nákupu daňový doklad — má to být "Faktura č. 2026-0001 vystavená Autovrak Praha 5 s.r.o." nebo "Faktura č. 2026-0001 vystavená Carmakler s.r.o. jménem Autovrak Praha 5 s.r.o."? Z UX hlediska chceme to druhé (čistší branding).

**Naše current assumption:** Vrakoviště je IČO na dokladu, ale doklad fyzicky generuje Carmakler systém + odesílá zákazníkovi přes Carmakler email. Tj. "vystaveno Autovrak Praha 5 s.r.o., IČO 12345678" — Carmakler je pouze technický nástroj.

### Q2.3 — Odpovědnost za vady

**Otázka:** (Tato otázka se prolíná s sekcí #1, ale formuluje se zde z pohledu **vnitřního smluvního vztahu** Carmakler ↔ vrakoviště, nikoli vůči zákazníkovi.)
- V komisionářské smlouvě Carmakler ↔ vrakoviště, **kdo nese ekonomické riziko** za reklamace:
  - **Vrakoviště** (právní prodávající) — Carmakler žádné riziko
  - **Sdílené** — např. první 5 % obratu = vrakoviště, nad 5 % = Carmakler nese
  - **Pojištění** — vrakoviště musí mít commercial liability insurance jako podmínka přijetí na platformu
- **Lze v komisionářské smlouvě stanovit povinnost vrakoviště mít pojištění** odpovědnosti za vady prodávaného zboží? Existuje takový pojistný produkt v ČR pro malá vrakoviště?
- **Lze stanovit penalty** za pomalé vyřizování reklamací (např. 5 % z měsíční provize za každý den nad SLA)?

**Naše current assumption:** Vrakoviště nese 100 % ekonomické riziko za reklamace. Carmakler může nabídnout **goodwill kompenzaci** zákazníkovi z marketingového rozpočtu (out-of-court settlement) v případech, kdy by vrakoviště selhalo. Vnitřní penalty mechanismus = OK.

### Q2.4 — Komise 12-20 % variable per partner

**Otázka:**
- Lze v komisionářské smlouvě stanovit **variabilní výši provize** (12-20 % dle objemu, kvality, exkluzivity)?
- **Daňové implikace:** je provize Carmakleru **DPH-able service** (Carmakler vystaví fakturu vrakovišti na 12-20 % + DPH 21 %)?
- Pokud je vrakoviště **plátce DPH**, je to jednoduché reverse charge / standardní fakturace. Co když je vrakoviště **neplátce DPH** (ročně < 2 mil. Kč obrat)? Jak to ovlivní:
  - Cenu pro koncového zákazníka (zda Carmakler může accountovat DPH na celé částce)
  - Provizní fakturu Carmakler → vrakoviště (jak se počítá DPH?)
- **Maximum DPH compliance:** je nutné, aby vrakoviště bylo plátce DPH jako podmínka přijetí na platformu? To by zúžilo partner pool, ale zjednodušilo accounting.
- **Stripe Connect dynamic split** umí rozdělit netto + DPH separately. Lze toto použít, nebo musí být Carmakler "intermediary" co provede 2 transakce (zákazník → Carmakler, Carmakler → vrakoviště)?

**Naše current assumption:** Variabilní provize OK. Carmakler vystavuje měsíční provizní fakturu vrakovišti (s DPH). Vrakoviště musí být plátce DPH jako **doporučená podmínka** (neplátci budou ad-hoc, ručně účetně řešitelní). Stripe Connect handluje split netto+DPH.

### Q2.5 — Šablona smlouvy pro 50+ partnerů

**Otázka:**
- Carmakler chce **standardizovanou šablonu komisionářské smlouvy**, kterou podepíše s každým vrakovištěm (white glove pilot s prvními 5-10 partnery, pak scale na 50+).
- **Co MUSÍ být ve smlouvě** dle §2455+ OZ + best practices:
  - Identifikace stran
  - Předmět komise (které díly, jaké kategorie, exkluzivita)
  - Cena a provize (variable, mechanism změny)
  - Vlastnické vztahy a okamžik přechodu
  - Odpovědnost za vady, reklamace, lhůty
  - Reporting (jak se Carmakler dovídá o stavu skladu, výpadcích)
  - Doba trvání + výpovědní lhůta
  - Mlčenlivost (Carmakler předává PII zákazníků vrakovišti)
  - GDPR — vrakoviště zpracovává PII zákazníků (jméno, adresa, email pro doručení)
  - Sankce za nedodržení SLA
- **Stačí jeden jednotný dokument** pro všech 50+ partnerů, nebo musí být **per partner customized** (např. exkluzivita, marketing podmínky)?
- **Cena za přípravu šablony** (orientačně) — kvůli rozpočtu právní podpory.

**Naše current assumption:** Jednotná šablona + appendix s individuálními parametry (provize %, exkluzivita kategorie, marketing podpora). Smlouva v elektronické podobě s elektronickým podpisem (PostSignum nebo BankID).

### Q2.6 — GDPR a předávání PII

**Otázka:**
- Zákazník si objedná díl → Carmakler předá vrakovišti **jméno, adresu, telefon, email** koncového zákazníka (nutné pro doručení).
- **Je vrakoviště zpracovatelem osobních údajů** dle GDPR článku 28, nebo **samostatným správcem**?
  - Pokud zpracovatel: musíme uzavřít **DPA** (Data Processing Agreement) jako součást komisionářské smlouvy
  - Pokud samostatný správce: zákazník musí být **informován o předání** v privacy policy + souhlasit (?)
- **Vrakoviště uloží zákaznická data ve svém systému** pro účely vlastní reklamace, marketingu (?), evidence. Jaké jsou limity?
- **Lze v T&C zakázat vrakovišti používat data zákazníků pro vlastní marketing** (žádné newslettery, žádné direct mail kampaně)?

**Naše current assumption:** Vrakoviště je zpracovatel (Carmakler je správce). DPA bude součást komisionářské smlouvy. Vrakoviště smí používat data jen pro vyřízení objednávky + zákonem vyžadované archivace (účetní 10 let). Vlastní marketing zakázán.

---

# SEKCE #3 — DPH MODEL

## 3.1 Kontext

V komisionářském modelu (sekce #2) Carmakler není vlastníkem dílu. Vrakoviště je právní prodávající. Zákazník zaplatí Stripem celkovou částku, která se přes **Stripe Connect dynamic split** rozdělí mezi vrakoviště (80-88 %) a Carmakler (12-20 % provize).

**Hlavní otázka pro právníka:**

> Jak je DPH rozděleno mezi vrakoviště a Carmakler v Stripe Connect dynamic split? Kdo je plátcem DPH na koncové faktuře, a jak se účtuje provize Carmakleru?

## 3.2 Konkrétní otázky pro právníka (5)

### Q3.1 — DPH split v Stripe Connect

**Otázka:**
- Stripe Connect dynamic split rozdělí platbu **na úrovni částky** (např. 1 000 Kč = 850 Kč vrakoviště + 150 Kč Carmakler). DPH se ale počítá **na úrovni faktury**, ne platby.
- **Jak má Carmakler technicky řešit DPH** v tomto modelu:
  - **Vrakoviště** vystavuje fakturu zákazníkovi na **celých 1 000 Kč** (z toho např. 826 Kč netto + 174 Kč DPH 21 %). Vrakoviště odvádí 174 Kč DPH státu.
  - **Carmakler** vystavuje **provizní fakturu vrakovišti** na 150 Kč netto + 31,5 Kč DPH 21 % = 181,5 Kč. Vrakoviště si toto odečte v DPH přiznání (DPH na vstupu).
- **Je toto schéma správné?** Konkrétně: vrakoviště dostane od Stripe 850 Kč (Stripe split), ale fakturuje zákazníkovi 1 000 Kč a odvádí 174 Kč DPH státu? Zní to jako vrakoviště "ztratí" 150 Kč hotovosti (Carmakler provize) ale účetně to musí vyrovnat fakturou od Carmakleru.
- **Alternativa:** Carmakler je zákazníkův prodávající (nákup-prodej model), Carmakler odvádí DPH ze celých 1 000 Kč, Carmakler si pak odečte fakturu od vrakoviště za 850 Kč. Je tento model jednodušší pro účetnictví?

**Naše current assumption:** Komisionářský model = vrakoviště odvádí DPH z prodeje, Carmakler odvádí DPH z provize (samostatné transakce). Stripe Connect je technický nástroj rozdělení peněz, neovlivňuje účetní stranu.

### Q3.2 — Vrakoviště neplátce DPH

**Otázka:**
- Pokud je vrakoviště **neplátce DPH** (roční obrat < 2 mil. Kč), jak to ovlivní:
  - **Cenu pro koncového zákazníka:** vrakoviště by mělo prodávat **bez DPH** (1 000 Kč = 1 000 Kč netto)? Nebo musí počítat DPH a stát z něj nedostane? (Dovozní DPH problem.)
  - **Provizní fakturu Carmakler → vrakoviště:** Carmakler je plátce, fakturuje s DPH 21 %. Vrakoviště neplátce nemůže odečíst DPH, takže "ztrácí" 21 % z provize.
  - **Konkurenční nevýhoda neplátců** vs plátci na platformě?
- **Lze v eshop UI rozlišovat ceny** u plátců vs neplátců (neplátci = "cena bez DPH, fyzická osoba")? Z UX perspektivy špatné.
- **Doporučení:** mělo by Carmakler **vyžadovat plátcovství DPH** jako podmínku přijetí na platformu? Nebo **podporovat neplátce** s explicit handlingem?

**Naše current assumption:** Doporučená (ne povinná) podmínka = plátce DPH. Neplátce je akceptovatelný, ale s explicit warningem v admin onboarding flow ("budete platit Carmakler provizi s DPH 21 % bez možnosti odpočtu, počítejte s tím v cenotvorbě").

### Q3.3 — Reverse charge pro B2B objednávky

**Otázka:**
- Pokud je **koncový zákazník B2B (firma s IČ)**, lze použít **reverse charge** mechanismus?
- V autodíl segmentu je B2B zákazník typický (autoservis kupuje díl pro opravu auta klientovi). **Jak často to bude — 30-50 % objednávek?**
- **Praktická otázka:** UI v eshop checkout musí mít option "objednávám jako firma" + IČO field → systém přepne na reverse charge → vrakoviště vystaví fakturu bez DPH → zákazník vykáže DPH sám.
- **Je toto legálně OK** pro komisionářský model? Carmakler musí přepnout splnění mezi B2C a B2B mode dynamicky?

**Naše current assumption:** Reverse charge platí jen pro **plnění mezi plátci DPH v ČR** za určitých podmínek (např. stavební práce, investiční zlato — ne autodíly). Pro autodíly = standardní DPH, i pro B2B. Ale pokud je zákazník plátce DPH s IČO, **vystavuje se faktura na firmu** (ne zjednodušený daňový doklad).

### Q3.4 — Doklad pro koncového zákazníka

**Otázka:**
- **Kdo formálně vystavuje daňový doklad** zákazníkovi v komisionářském modelu?
  - **Vrakoviště** (právní prodávající, IČO na dokladu)?
  - **Carmakler** (zprostředkovatel, IČO na dokladu, vrakoviště uvedeno jako "skutečný dodavatel")?
- **Praktická realita:** zákazník si objedná díly **z více vrakovišť v 1 košíku**. Dostane:
  - **Více dokladů** (jeden per vrakoviště) — UX problém, ale legal compliance
  - **Jeden doklad od Carmakleru** s rozpisem vrakovišť — UX OK, ale je to legal?
- **Stripe automaticky generuje "platební potvrzení"**, ale to není daňový doklad. Daňový doklad musí být zvlášť vygenerován.
- **Archivace:** doklady musí být archivovány 10 let (zákon o účetnictví). Kdo je archivuje (vrakoviště nebo Carmakler)?

**Naše current assumption:** Vrakoviště je IČO na dokladu (vystavuje technicky Carmakler PWA systém jménem vrakoviště). Pokud je v košíku víc vrakovišť → víc dokladů. Carmakler centrálně archivuje (S3 bucket + Prisma reference) + vrakoviště má kopii.

### Q3.5 — Doprava a Zásilkovna v DPH split

**Otázka:**
- Cena dopravy (Zásilkovna, PPL, atd.) je **součást objednávky**. **Kdo fakturuje dopravu zákazníkovi**?
- **Naše assumption:** Carmakler má smlouvu se Zásilkovnou (fakturuje Zásilkovna Carmakleru), Carmakler přefakturovává zákazníkovi v rámci checkoutu. Pokud je doprava fakturována "carmaklerem", ale díl "vrakovištěm", **vznikají 2 doklady na 1 košík**?
- **Alternativa:** vrakoviště fakturuje dopravu jako součást ceny dílu (vč. dopravy), Carmakler refunduje vrakoviště za dopravní náklady přes provizi. Komplikovanější, ale 1 doklad.
- **Co je legálně cleaner?**

**Naše current assumption:** Doprava je samostatný řádek na faktuře (od vrakoviště, NE Carmakler). Vrakoviště si zaplatí Zásilkovnu sám (Carmakler poskytne shipping label generated přes Zásilkovna API). Zákazník vidí 1 doklad od vrakoviště s 2 řádky: díl + doprava.

---

# SEKCE #4 — DOPORUČENÍ CARMAKLER MODELU (NÁŠ PŘÍSTUP)

## 4.1 Preferovaný model

Po analýze několika alternativ Carmakler **preferuje komisionářský model s SPoC patternem**:

| Aspekt | Náš preferovaný model |
|--------|----------------------|
| **Vlastnictví dílu** | Vrakoviště je vlastník až do prodeje koncovému zákazníkovi |
| **Carmakler role** | Komisionář dle §2455+ OZ + technický provozovatel platformy |
| **Daňový doklad** | Vystavuje vrakoviště (právní prodávající), Carmakler je technický nástroj |
| **DPH** | Vrakoviště odvádí DPH z prodeje, Carmakler odvádí DPH z provize (samostatně) |
| **Reklamace** | Right adresát = vrakoviště, ale zákazník komunikuje přes Carmakler SPoC (single-point-of-contact) |
| **Záruka** | 12 měsíců (zkrácená dle §2168 OZ pro použité díly) |
| **Doprava** | Vrakoviště fakturuje dopravu jako součást objednávky, Carmakler poskytuje technický nástroj (Zásilkovna API) |
| **Komise** | Carmakler 12-20 % + DPH 21 % (variable per partner) |
| **Platba** | Stripe Connect dynamic split (zákazník platí 1× → split 80-88 % vrakoviště + 12-20 % Carmakler) |
| **Pojištění** | Doporučená podmínka — vrakoviště mít commercial liability insurance |
| **GDPR** | Vrakoviště = zpracovatel (Carmakler = správce), DPA součást komisionářské smlouvy |

## 4.2 Důvody preference

1. **Operativní jednoduchost** — Carmakler nemusí nakupovat sklad, držet inventory, řešit fyzický return logistics
2. **Daňová jednoduchost** — vrakoviště odvádí DPH samo, Carmakler jen z provize (jednoduché B2B fakturace)
3. **Limit liability** — Carmakler je technický provozovatel, ne prodávající (jako Wolt, Bolt, Glovo)
4. **Scale-friendly** — model funguje pro 5 partnerů i 500 partnerů bez zásadní změny operations
5. **Wolt model** (memory: `project_wolt_model_platform_wide.md`) — Carmakler je platforma, vrakoviště je prodávající, KPI #1 = liquidity

## 4.3 Rizika modelu (která chceme s právníkem prokonzultovat)

1. **Reklamace** — pokud vrakoviště ignoruje, zákazník nárokuje od Carmakleru → reputační + právní risk
2. **Insolvence vrakoviště** — co s aktivními reklamacemi, výplatami, skladem
3. **Vrakoviště neplátce DPH** — accounting komplikace
4. **EU Omnibus** — transparentnost prodávajícího, sankce ČOI
5. **Jednotná T&C** — musí pokrýt 50+ partnerů s různými podmínkami (cena dopravy, doba dodání, zkrácená záruka)

---

# SEKCE #5 — ACTION ITEMS PRO PRÁVNÍKA

Prosíme o **písemné stanovisko** k následujícím bodům, ideálně ve formátu **strukturovaného dokumentu** s odpověďmi na každou Q1.x / Q2.x / Q3.x otázku z tohoto briefu:

1. **Confirmation/rejection komisionářského modelu** dle §2455+ OZ pro náš use case
2. **Šablona komisionářské smlouvy** (jednotná pro 50+ partnerů, s appendixem pro individual parametry)
3. **Šablona T&C eshopu** (pokrývající SPoC model + zkrácenou záruku 12 měsíců)
4. **Šablona reklamačního řádu** (jednotný pro Carmakler eshop, transparent o roli vrakoviště jako právního prodávajícího)
5. **DPA template** (Data Processing Agreement) pro vrakoviště jako zpracovatele
6. **DPH compliance check** (split logic, neplátci, B2B/B2C)
7. **EU Omnibus compliance check** (transparentnost prodávajícího v UI)
8. **Doporučení pro insolvence scenario** (rezervní fond, pojištění, goodwill kompenzace)

**Cenová nabídka:** prosíme o orientační rozpočet pro dodávku všech 8 bodů. Carmakler preferuje **fixed-price contract** s milestones (deliverables 1-4 v první vlně, 5-8 v druhé vlně po aplikaci feedbacku).

**Termín:** Carmakler eshop je v posledním stage testingu, **plánovaný production launch v Q2 2026**. Legal sign-off je blocker pro launch. Prosíme o feasibility check **do 14 dní** + finální dodávku **do 6 týdnů**.

---

# SEKCE #6 — TECHNICKÝ KONTEXT (PRO PRÁVNÍKA)

## 6.1 Co Carmakler **už má implementováno**:

- **Stripe Connect dynamic split** — kód ready, ENABLE flag = false (čeká na legal sign-off)
- **Vrakoviště PWA** — admin tool pro vrakoviště přidávat díly, vidět objednávky, generovat shipping labels
- **Eshop frontend** — `/dily/katalog`, `/dily/[slug]`, košík, checkout
- **Customer support tooling** — interní reklamace tracking (Carmakler centrální systém)
- **Email notifications** — automatic email po objednávce (Resend), reklamace email forward na vrakoviště

## 6.2 Co Carmakler **plánuje implementovat po legal sign-off**:

- **Vrakoviště smluvní onboarding** — elektronický podpis komisionářské smlouvy (PostSignum nebo BankID)
- **DPH compliance UI** — v product detailu IČO + plátce DPH info, v košíku per-vrakoviště rozpis
- **Reklamační flow v zákaznické zóně** — zákazník otevře reklamaci přes Carmakler portal, status tracking
- **Vrakoviště reklamace dashboard** — vrakoviště vidí přidělené reklamace, reaguje, uploaduje dokumenty
- **Goodwill kompenzace tool** — Carmakler customer support může schválit goodwill kompenzaci ze separátního rozpočtu

## 6.3 Reference na technické plány

- `.claude-context/tasks/plan-task-76.md` (v2) — AI Part Scanner pro vrakoviště PWA, §0.6 LEGAL section
- `.claude-context/tasks/plan-task-88.md` (TBD) — Implementace Stripe webhook + DPH split logiky **bez ENABLE flag**, paralelní práce s tímto legal briefem
- `.claude-context/tasks/research-task-77.md` — Deeper analysis pro #76 (10 oblastí včetně Wolt model, partner economics, fraud prevention)

---

# CHANGELOG

- **2026-04-07 (PLANOVAC v1):** Initial brief po team-lead dispatchi #90 (post #80 supersaded). Po user clarification 2026-04-07 přesunuta sekce **B2C reklamace** na priority #1 (před komisionářskou smlouvou + DPH). Out-of-scope: scraping ToS, DE→CZ Bridge, AI training data.

---

**Kontaktní osoba pro upřesnění:**
[bude doplněno team-leadem před odesláním]
Carmakler s.r.o.
Email: legal@carmakler.cz (placeholder)
