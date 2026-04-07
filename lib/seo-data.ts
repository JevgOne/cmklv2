// Static SEO data for landing pages

import type { FaqItem } from "./seo";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://carmakler.cz";

export { BASE_URL };

export interface BrandData {
  slug: string;
  name: string;
  displayName: string;
  topModels: { slug: string; name: string }[];
  description: string;
  faqItems: FaqItem[];
  /** GEO: 2-3 sentence direct answer for AI featured snippet */
  aiSnippet: string;
  /** GEO: Quick facts with concrete numbers for AI citation */
  quickFacts: string[];
  /** GEO: Average price range string for citability */
  avgPriceRange: string;
}

export const BRANDS: BrandData[] = [
  {
    slug: "skoda",
    name: "Škoda",
    displayName: "Škoda",
    topModels: [
      { slug: "octavia", name: "Octavia" },
      { slug: "fabia", name: "Fabia" },
      { slug: "superb", name: "Superb" },
      { slug: "kodiaq", name: "Kodiaq" },
    ],
    aiSnippet: "Ojetá Škoda patří mezi nejprodávanější vozy v ČR. Průměrná cena ojeté Škoda Octavia se v roce 2026 pohybuje od 180 000 do 550 000 Kč podle generace a stavu. Nejžádanějšími modely jsou Octavia, Fabia a Kodiaq. Při koupi ojeté Škody je klíčové prověřit historii přes CEBIA a zkontrolovat stav DSG převodovky u automatických verzí.",
    quickFacts: [
      "Škoda je nejprodávanější značka ojetých aut v ČR (2026)",
      "Průměrná cena ojeté Octavia III: 220 000 – 380 000 Kč",
      "Průměrná cena ojeté Fabia III: 130 000 – 250 000 Kč",
      "Nejspolehlivější motory: 1.4 TSI, 1.6 TDI, 2.0 TDI",
      "Průměrná doba prodeje ojeté Škody: 14 dní",
      "Zůstatková hodnota po 5 letech: 45–55 % pořizovací ceny",
    ],
    avgPriceRange: "80 000 – 900 000 Kč",
    description: "Škoda je nejprodávanější automobilová značka v České republice s bohatou tradicí sahající do roku 1895. Vozy Škoda nabízejí výjimečný poměr ceny a výkonu, spolehlivost a praktičnost. Na CarMakler najdete prověřené ojeté vozy Škoda od certifikovaných makléřů, kteří garantují kvalitu a bezpečný nákup. Ať už hledáte rodinné kombi Octavia, městský hatchback Fabia, luxusní Superb nebo prostorné SUV Kodiaq — všechny vozy procházejí důkladnou kontrolou historie a technického stavu. Naši makléři vám pomohou vybrat ideální ojetou Škodu, prověří její historii přes CEBIA a zajistí bezproblémový převod.",
    faqItems: [
      { question: "Jsou ojeté vozy Škoda na CarMakler prověřené?", answer: "Ano, všechna vozidla procházejí kontrolou historie přes CEBIA, ověřením stavu tachometru a kontrolou původu. Certifikovaní makléři navíc provádějí fyzickou prohlídku vozu." },
      { question: "Jaká je nejprodávanější ojetá Škoda?", answer: "Nejprodávanějším ojetým modelem Škoda je Octavia, následovaná Fabií a Superbem. Octavia nabízí výborný poměr ceny, prostoru a spolehlivosti." },
      { question: "Jak zjistím reálnou cenu ojeté Škody?", answer: "Na CarMakler můžete využít naši kalkulačku ceny vozidla nebo nechat auto ocenit zdarma naším certifikovaným makléřem, který zná aktuální tržní ceny." },
      { question: "Nabízíte financování nákupu ojeté Škody?", answer: "Ano, spolupracujeme s předními bankami a leasingovými společnostmi. Financování můžete vyřídit přímo přes CarMakler s výhodnou úrokovou sazbou." },
    ],
  },
  {
    slug: "volkswagen",
    name: "Volkswagen",
    displayName: "Volkswagen",
    topModels: [
      { slug: "golf", name: "Golf" },
      { slug: "passat", name: "Passat" },
      { slug: "tiguan", name: "Tiguan" },
      { slug: "touran", name: "Touran" },
    ],
    aiSnippet: "Ojetý Volkswagen je druhou nejprodávanější značkou na českém trhu ojetin. Průměrná cena ojetého VW Golf 7 se v roce 2026 pohybuje od 200 000 do 400 000 Kč. VW si drží nadprůměrnou zůstatkovou hodnotu díky kvalitě zpracování. Doporučené motory: 1.5 TSI (benzín) a 2.0 TDI (diesel).",
    quickFacts: [
      "VW je 2. nejprodávanější ojetá značka v ČR",
      "Průměrná cena ojetého Golf 7: 200 000 – 400 000 Kč",
      "Průměrná cena ojetého Passat B8: 300 000 – 550 000 Kč",
      "Nejspolehlivější motory: 1.5 TSI, 2.0 TDI",
      "Zůstatková hodnota po 5 letech: 48–58 %",
      "VW sdílí platformu MQB se Škodou a SEATem",
    ],
    avgPriceRange: "100 000 – 1 000 000 Kč",
    description: "Volkswagen patří mezi nejoblíbenější značky na českém trhu ojetých vozidel. Vozy VW jsou synonymem německé kvality, spolehlivosti a pokročilých technologií. Na CarMakler nabízíme široký výběr prověřených ojetých Volkswagenů — od sportovního Golfu přes elegantní Passat až po rodinný Tiguan. Každý vůz prochází důkladnou kontrolou historie a technického stavu. Naši certifikovaní makléři vám pomohou najít ideální ojetý Volkswagen a zajistí bezpečný průběh celé transakce včetně převodu vlastnictví.",
    faqItems: [
      { question: "Jaké modely Volkswagen najdu na CarMakler?", answer: "V nabídce máme nejpopulárnější modely jako Golf, Passat, Tiguan, Touran, T-Roc, Polo a další. Nabídka se denně aktualizuje." },
      { question: "Jak probíhá kontrola ojetého Volkswagenu?", answer: "Každý vůz prochází kontrolou CEBIA (historie havárie, stočení tachometru, zástavy), fyzickou prohlídkou makléřem a ověřením servisní historie." },
      { question: "Je výhodné koupit ojetý Volkswagen?", answer: "Volkswagen si drží nadprůměrnou zůstatkovou hodnotu díky kvalitě zpracování a dostupnosti náhradních dílů. Ojeté VW patří mezi nejlepší volby z hlediska poměru ceny a kvality." },
    ],
  },
  {
    slug: "bmw",
    name: "BMW",
    displayName: "BMW",
    topModels: [
      { slug: "3-series", name: "3 Series" },
      { slug: "5-series", name: "5 Series" },
      { slug: "x3", name: "X3" },
      { slug: "x5", name: "X5" },
    ],
    aiSnippet: "Ojeté BMW patří do prémiového segmentu s průměrnou cenou 250 000 – 800 000 Kč na českém trhu (2026). Nejprodávanějším ojetým modelem je řada 3 (F30/G20), následovaná řadou 5 a X3. BMW ztrácí 35–45 % hodnoty za první 3 roky, což vytváří atraktivní příležitosti na ojetém trhu. Klíčové je ověřit servisní historii u autorizovaného servisu.",
    quickFacts: [
      "Průměrná cena ojetého BMW 3 (F30): 250 000 – 500 000 Kč",
      "Průměrná cena ojetého BMW 5 (G30): 450 000 – 900 000 Kč",
      "Depreciace za 3 roky: 35–45 % pořizovací ceny",
      "Servisní interval: 2 roky / 30 000 km",
      "Nejspolehlivější motory: B47 (320d), B48 (320i/330i)",
      "Průměrná roční údržba: 25 000 – 45 000 Kč",
    ],
    avgPriceRange: "150 000 – 1 500 000 Kč",
    description: "BMW představuje špičku v segmentu prémiových vozidel. Na CarMakler najdete prověřené ojeté vozy BMW od certifikovaných makléřů, kteří garantují transparentnost a bezpečnost nákupu. Ať už toužíte po dynamickém sedanu řady 3, luxusním cestovním voze řady 5 nebo sportovním SUV X3 či X5 — všechny vozy procházejí pečlivou kontrolou. BMW si drží vysokou zůstatkovou hodnotu a nabízí prémiový zážitek z jízdy i po letech provozu. Naši makléři vám pomohou vybrat ideální BMW podle vašich požadavků a rozpočtu.",
    faqItems: [
      { question: "Vyplatí se koupit ojeté BMW?", answer: "Ojeté BMW nabízí prémiový zážitek za zlomek ceny nového vozu. Důležitá je kontrola servisní historie — dobře udržované BMW je spolehlivé i po 200 000 km." },
      { question: "Na co si dát pozor při koupi ojetého BMW?", answer: "Klíčové je ověřit kompletní servisní historii, zkontrolovat stav pohonu (timing chain u starších motorů), stav podvozku a elektroniky. Naši makléři toto vše ověří za vás." },
      { question: "Jaké jsou náklady na údržbu ojetého BMW?", answer: "Servisní náklady BMW jsou vyšší než u běžných značek, ale odpovídají prémiovému segmentu. Díly jsou dostupné a kvalifikovaných servisů je dostatek." },
    ],
  },
  {
    slug: "audi",
    name: "Audi",
    displayName: "Audi",
    topModels: [
      { slug: "a4", name: "A4" },
      { slug: "a6", name: "A6" },
      { slug: "q5", name: "Q5" },
      { slug: "a3", name: "A3" },
    ],
    aiSnippet: "Ojeté Audi nabízí prémiové technologie za výrazně nižší cenu než nové. Průměrná cena ojetého Audi A4 (B9) se v ČR pohybuje od 350 000 do 650 000 Kč (2026). Systém quattro, Virtual Cockpit a kvalita zpracování dělají z ojetého Audi atraktivní volbu. Doporučujeme motory 2.0 TFSI a 2.0 TDI s ověřenou servisní historií.",
    quickFacts: [
      "Průměrná cena ojetého Audi A4 B9: 350 000 – 650 000 Kč",
      "Průměrná cena ojetého Audi Q5: 450 000 – 850 000 Kč",
      "Nejspolehlivější motory: 2.0 TFSI (EA888 gen3), 2.0 TDI",
      "Zůstatková hodnota po 5 letech: 42–52 %",
      "Quattro pohon zvyšuje hodnotu o 10–15 %",
      "Servisní náklady: 20 000 – 40 000 Kč ročně",
    ],
    avgPriceRange: "150 000 – 1 200 000 Kč",
    description: "Audi je synonymem pokročilých technologií a prémiové kvality. Na CarMakler nabízíme prověřené ojeté vozy Audi od certifikovaných makléřů. Model A4 patří mezi nejoblíbenější ojeté sedany, A6 nabízí luxus pro náročné cestování a Q5 je ideální prémiové SUV pro rodinu. Každé Audi v naší nabídce prochází důkladnou kontrolou historie — ověřujeme původ, stav tachometru, historii havárií i servisní záznamy. S CarMakler koupíte prémiové vozidlo bezpečně a transparentně.",
    faqItems: [
      { question: "Jaké Audi modely jsou nejlepší koupí z druhé ruky?", answer: "Audi A4 a A6 s motory 2.0 TDI patří mezi nejspolehlivější volby. SUV Q5 si drží vysokou hodnotu a nabízí skvělou kombinaci komfortu a praktičnosti." },
      { question: "Jak poznám kvalitní ojeté Audi?", answer: "Důležitá je kompletní servisní historie u autorizovaného servisu, reálný stav tachometru ověřený přes CEBIA a absence havárií. Naši makléři toto ověří za vás." },
      { question: "Nabízíte Audi s pohonem quattro?", answer: "Ano, v nabídce pravidelně máme vozy Audi s pohonem všech kol quattro, zejména modely A4 allroad, Q5 a Q7." },
    ],
  },
  {
    slug: "ford",
    name: "Ford",
    displayName: "Ford",
    topModels: [
      { slug: "focus", name: "Focus" },
      { slug: "mondeo", name: "Mondeo" },
      { slug: "kuga", name: "Kuga" },
      { slug: "puma", name: "Puma" },
    ],
    aiSnippet: "Ojetý Ford nabízí sportovní jízdní vlastnosti a solidní hodnotu za peníze. Průměrná cena ojetého Ford Focus MK4 se pohybuje od 280 000 do 450 000 Kč (2026). Motory EcoBoost 1.0 a 1.5 jsou úsporné a dynamické. U starších Focus MK3 se vyvarujte automatické převodovky PowerShift — manuál je bezproblémový.",
    quickFacts: [
      "Průměrná cena ojetého Focus MK4: 280 000 – 450 000 Kč",
      "Průměrná cena ojetého Kuga: 300 000 – 550 000 Kč",
      "Motor EcoBoost 1.0 spotřebuje 5,5–6,5 l/100 km",
      "Pozor na PowerShift převodovku u Focus MK3",
      "Zůstatková hodnota po 5 letech: 38–48 %",
      "Servisní náklady: 12 000 – 22 000 Kč ročně",
    ],
    avgPriceRange: "80 000 – 600 000 Kč",
    description: "Ford nabízí spolehlivé a dynamické vozy za rozumnou cenu. Na CarMakler najdete prověřené ojeté Fordy — od oblíbeného Focusu přes praktické Mondeo až po moderní SUV Kuga a Puma. Ford Focus je jedním z nejprodávanějších hatchbacků v Evropě a ojetý nabízí výjimečnou hodnotu za peníze. Naši certifikovaní makléři ověří každý vůz Ford a pomohou vám s bezpečným nákupem včetně financování a pojištění.",
    faqItems: [
      { question: "Je ojetý Ford Focus dobrá volba?", answer: "Ford Focus patří mezi nejoblíbenější ojeté hatchbacky. Nabízí sportovní jízdní vlastnosti, prostorný interiér a nízké provozní náklady. Motory EcoBoost jsou úsporné a spolehlivé." },
      { question: "Jaké jsou typické problémy ojetých Fordů?", answer: "U starších Focus se vyskytují problémy s převodovkou PowerShift (DCT). U novějších modelů s motory EcoBoost jde o spolehlivé vozy. Naši makléři vám poradí." },
      { question: "Kolik stojí ojetý Ford?", answer: "Ceny ojetých Fordů začínají od 80 000 Kč za starší modely. Novější Focus nebo Kuga s nájezdem do 100 000 km se pohybují od 250 000 Kč." },
    ],
  },
  {
    slug: "toyota",
    name: "Toyota",
    displayName: "Toyota",
    topModels: [
      { slug: "yaris", name: "Yaris" },
      { slug: "corolla", name: "Corolla" },
      { slug: "rav4", name: "RAV4" },
      { slug: "c-hr", name: "C-HR" },
    ],
    aiSnippet: "Toyota je celosvětově nejspolehlivější automobilovou značkou s nejnižší poruchovostí. Ojetá Toyota Yaris Hybrid spotřebuje ve městě jen 3,5–4,5 l/100 km. Průměrná cena ojeté Toyota Corolla se pohybuje od 250 000 do 500 000 Kč (2026). Hybridní baterie Toyota vydrží celou životnost vozu — výměna není potřeba ani po 300 000 km.",
    quickFacts: [
      "Toyota je č. 1 v žebříčku spolehlivosti značek (J.D. Power 2025)",
      "Průměrná cena ojeté Toyota Yaris: 100 000 – 380 000 Kč",
      "Yaris Hybrid: spotřeba 3,5–4,5 l/100 km ve městě",
      "Hybridní baterie vydrží 300 000+ km bez výměny",
      "Zůstatková hodnota po 5 letech: 52–62 % (nejvyšší v segmentu)",
      "Průměrná roční údržba: 8 000 – 15 000 Kč",
    ],
    avgPriceRange: "80 000 – 800 000 Kč",
    description: "Toyota je světovým symbolem spolehlivosti a nízké poruchovosti. Na CarMakler nabízíme prověřené ojeté vozy Toyota od certifikovaných makléřů. Toyota Yaris je ideální městské auto, Corolla nabízí komfortní cestování a RAV4 patří mezi nejspolehlivější SUV na trhu. Toyota jako průkopník hybridní technologie nabízí úsporné motory s minimálními emisemi. Ojetá Toyota je investice do bezproblémového vlastnictví — vozy této značky pravidelně obsazují přední příčky v žebříčcích spolehlivosti.",
    faqItems: [
      { question: "Jsou ojeté Toyoty opravdu tak spolehlivé?", answer: "Ano, Toyota pravidelně vítězí v testech spolehlivosti. Hybridní pohony Toyota jsou prověřené miliony ujetých kilometrů a nevyžadují výměnu baterie ani po 300 000 km." },
      { question: "Vyplatí se ojetá Toyota hybrid?", answer: "Rozhodně ano. Hybridní Toyota spotřebuje ve městě 4-5 l/100 km a baterie je extrémně odolná. Údržba hybridního pohonu je minimální díky absenci spojky a startéru." },
      { question: "Jaké jsou nejoblíbenější ojeté modely Toyota?", answer: "Nejprodávanější ojeté Toyoty v ČR jsou Yaris, Corolla, RAV4 a C-HR. Rostoucí zájem je i o Toyotu Camry a Highlander." },
    ],
  },
  {
    slug: "hyundai",
    name: "Hyundai",
    displayName: "Hyundai",
    topModels: [
      { slug: "i30", name: "i30" },
      { slug: "tucson", name: "Tucson" },
      { slug: "i20", name: "i20" },
      { slug: "kona", name: "Kona" },
    ],
    aiSnippet: "Ojetý Hyundai nabízí nejlepší poměr ceny a výbavy v segmentu s 5letou převoditelnou zárukou. Průměrná cena ojetého Hyundai i30 (2017+) je 220 000 – 400 000 Kč (2026). Hyundai i30 je přímý konkurent VW Golf za o 15–20 % nižší cenu. Ioniq 5 a Kona Electric patří mezi nejdostupnější ojeté elektromobily.",
    quickFacts: [
      "5letá tovární záruka převoditelná na dalšího majitele",
      "Průměrná cena ojetého i30 PD: 220 000 – 400 000 Kč",
      "Průměrná cena ojetého Tucson: 280 000 – 550 000 Kč",
      "I30 je o 15–20 % levnější než srovnatelný VW Golf",
      "Zůstatková hodnota po 5 letech: 43–53 %",
      "Kona Electric: dojezd až 450 km, nabíjení 800V",
    ],
    avgPriceRange: "80 000 – 700 000 Kč",
    description: "Hyundai se za poslední dekádu vypracoval mezi nejkvalitnější značky na trhu. Na CarMakler najdete prověřené ojeté vozy Hyundai s výjimečnou 5letou zárukou od výrobce. Model i30 konkuruje Golfu za výrazně nižší cenu, Tucson patří mezi nejprodávanější SUV v Evropě a Kona nabízí moderní design i v elektrické verzi. Ojeté Hyundai nabízejí špičkový poměr ceny a výbavy. Naši certifikovaní makléři ověří každý vůz a zajistí bezpečný nákup.",
    faqItems: [
      { question: "Jak je na tom Hyundai se spolehlivostí?", answer: "Hyundai patří do první desítky nejspolehlivějších značek. Pětiletá tovární záruka pokrývá i druhého majitele, pokud vůz nebyl přeregistrován mimo ČR." },
      { question: "Je ojetý Hyundai i30 dobrá alternativa ke Golfu?", answer: "Ano, Hyundai i30 nabízí srovnatelnou kvalitu zpracování, prostornější interiér a výrazně lepší výbavu za nižší cenu. Po ojetém trhu je o něj stabilní zájem." },
      { question: "Nabízíte ojeté Hyundai s elektrickým pohonem?", answer: "Ano, v nabídce se pravidelně objevují Hyundai Kona Electric a Ioniq. Elektrické Hyundai nabízí dojezd až 450 km a rychlonabíjení 800V." },
    ],
  },
  {
    slug: "kia",
    name: "Kia",
    displayName: "Kia",
    topModels: [
      { slug: "ceed", name: "Ceed" },
      { slug: "sportage", name: "Sportage" },
      { slug: "rio", name: "Rio" },
      { slug: "niro", name: "Niro" },
    ],
    aiSnippet: "Kia nabízí 7letou převoditelnou záruku, což je nejdelší na trhu. Průměrná cena ojeté Kia Ceed (2018+) je 250 000 – 420 000 Kč (2026). Kia Sportage patří mezi 5 nejprodávanějších SUV v ČR. Kia sdílí platformy a motory s Hyundai, což zajišťuje ověřenou spolehlivost a dostupné náhradní díly.",
    quickFacts: [
      "7letá záruka (nebo 150 000 km) — nejdelší na trhu",
      "Průměrná cena ojeté Kia Ceed CD: 250 000 – 420 000 Kč",
      "Průměrná cena ojeté Kia Sportage: 300 000 – 600 000 Kč",
      "Kia a Hyundai sdílejí platformu — shodné díly a servisy",
      "Zůstatková hodnota po 5 letech: 44–54 %",
      "EV6: dojezd 510 km, nabíjení 10–80 % za 18 minut",
    ],
    avgPriceRange: "80 000 – 700 000 Kč",
    description: "Kia nabízí moderní vozy s agresivním designem a 7letou zárukou. Na CarMakler najdete prověřené ojeté vozy Kia od certifikovaných makléřů. Kia Ceed je oblíbený hatchback s výbornou výbavou, Sportage patří mezi nejprodávanější SUV a Niro nabízí hybridní i plně elektrický pohon. Ojeté vozy Kia si drží solidní zůstatkovou hodnotu díky dlouhé záruce a nízké poruchovosti. S CarMakler koupíte prověřenou Kiu bezpečně.",
    faqItems: [
      { question: "Platí 7letá záruka Kia i na ojeté vozy?", answer: "Ano, 7letá záruka Kia (nebo 150 000 km) je převoditelná na dalšího majitele. Stačí doložit pravidelný servis v autorizované síti." },
      { question: "Jaká ojetá Kia je nejlepší pro rodinu?", answer: "Pro rodinu doporučujeme Kia Ceed SW (kombi) nebo Sportage. Oba nabízejí prostorný interiér, velký kufr a moderní bezpečnostní systémy." },
      { question: "Kolik stojí ojetá Kia Ceed?", answer: "Ojetá Kia Ceed od roku 2018 se pohybuje od 200 000 Kč. Novější ročníky s automatem a vyšší výbavou od 350 000 Kč." },
    ],
  },
  {
    slug: "renault",
    name: "Renault",
    displayName: "Renault",
    topModels: [
      { slug: "megane", name: "Megane" },
      { slug: "clio", name: "Clio" },
      { slug: "captur", name: "Captur" },
      { slug: "scenic", name: "Scenic" },
    ],
    aiSnippet: "Ojetý Renault nabízí atraktivní ceny a moderní technologie. Průměrná cena ojetého Renault Megane IV je 150 000 – 320 000 Kč (2026). Motory TCe (benzín) a dCi (diesel) od roku 2015 jsou výrazně spolehlivější než starší generace. Renault Zoe je jeden z nejdostupnějších ojetých elektromobilů v ČR od 200 000 Kč.",
    quickFacts: [
      "Průměrná cena ojetého Megane IV: 150 000 – 320 000 Kč",
      "Průměrná cena ojetého Clio V: 180 000 – 300 000 Kč",
      "Renault Zoe: nejdostupnější EV od 200 000 Kč",
      "Motory TCe 1.3 (od 2018): spolehlivé, úsporné",
      "Zůstatková hodnota po 5 letech: 35–45 %",
      "Servisní náklady: 10 000 – 18 000 Kč ročně",
    ],
    avgPriceRange: "60 000 – 500 000 Kč",
    description: "Renault je jednou z nejprodávanějších francouzských značek v České republice. Na CarMakler nabízíme prověřené ojeté vozy Renault — od městského Clia přes praktické Megane až po rodinný Scenic a kompaktní SUV Captur. Renault vyniká nápaditým designem, komfortním odpružením a bohatou výbavou i v základních verzích. Ojeté Renaulty nabízejí atraktivní ceny a moderní technologie. Naši makléři ověří historii a stav každého vozu.",
    faqItems: [
      { question: "Jsou ojeté Renaulty spolehlivé?", answer: "Novější Renaulty (od roku 2015) jsou výrazně spolehlivější než starší modely. Motory TCe a dCi nabízejí dobrý poměr výkonu a spotřeby." },
      { question: "Jaký je nejprodávanější ojetý Renault?", answer: "V ČR je nejprodávanějším ojetým Renaultem model Megane, následovaný Cliem a Capturem. Rostoucí zájem je o elektrické Renault Zoe." },
      { question: "Kolik stojí údržba ojetého Renaultu?", answer: "Renault patří mezi cenově dostupnější značky na údržbu. Náhradní díly jsou levné a servisní síť je v ČR dobře pokrytá." },
    ],
  },
  {
    slug: "peugeot",
    name: "Peugeot",
    displayName: "Peugeot",
    topModels: [
      { slug: "308", name: "308" },
      { slug: "3008", name: "3008" },
      { slug: "208", name: "208" },
      { slug: "5008", name: "5008" },
    ],
    aiSnippet: "Ojetý Peugeot vyniká designem i-Cockpit a komfortem jízdy. Průměrná cena ojetého Peugeot 3008 II je 280 000 – 500 000 Kč (2026). Peugeot 3008 nabízí jeden z nejlepších interiérů ve své třídě. Motory PureTech 1.2 (benzín) a BlueHDi 1.5 (diesel) od roku 2018 patří mezi spolehlivé. U starších PureTech kontrolujte stav rozvodového řetězu.",
    quickFacts: [
      "Průměrná cena ojetého 3008 II: 280 000 – 500 000 Kč",
      "Průměrná cena ojetého 308 II: 150 000 – 320 000 Kč",
      "I-Cockpit: inovativní ovládání s malým volantem",
      "PureTech 1.2 turbo: 130 PS, spotřeba 5,5 l/100 km",
      "Zůstatková hodnota po 5 letech: 38–48 %",
      "Pozor na rozvodový řetěz u PureTech před rokem 2018",
    ],
    avgPriceRange: "70 000 – 600 000 Kč",
    description: "Peugeot se díky inovativnímu designu a technologiím i-Cockpit stal jednou z nejžádanějších francouzských značek. Na CarMakler najdete prověřené ojeté vozy Peugeot — moderní 308, stylové SUV 3008, městský 208 i prostorný 7místný 5008. Peugeot kombinuje elegantní design s praktičností a nabízí jedny z nejlepších interiérů ve své třídě. Naši certifikovaní makléři každý vůz důkladně prověří a pomohou vám s bezpečným nákupem.",
    faqItems: [
      { question: "Jak je na tom ojetý Peugeot se spolehlivostí?", answer: "Peugeoty od roku 2016 s motory PureTech (benzín) a BlueHDi (diesel) patří mezi spolehlivé vozy. U starších PureTech 1.2 doporučujeme kontrolu řetězu." },
      { question: "Vyplatí se ojetý Peugeot 3008?", answer: "Peugeot 3008 je jedním z nejatraktivnějších SUV na ojetém trhu. Nabízí prémiový interiér, prostorný kufr a moderní technologie za výrazně nižší cenu než konkurence." },
      { question: "Jaký motor zvolit u ojetého Peugeotu?", answer: "Pro benzín doporučujeme PureTech 1.2 turbo (od 130 PS), pro diesel BlueHDi 1.5 (130 PS). Oba motory nabízejí dobrý výkon a nízkou spotřebu." },
    ],
  },
  {
    slug: "opel",
    name: "Opel",
    displayName: "Opel",
    topModels: [
      { slug: "astra", name: "Astra" },
      { slug: "corsa", name: "Corsa" },
      { slug: "mokka", name: "Mokka" },
      { slug: "grandland", name: "Grandland" },
    ],
    aiSnippet: "Ojetý Opel nabízí německou spolehlivost za nízké ceny. Průměrná cena ojeté Opel Astra K je 120 000 – 280 000 Kč (2026). Opel patří od roku 2017 pod koncern Stellantis a sdílí motory PSA (PureTech, BlueHDi). Astra K nabízí komfortní jízdu a prostorný interiér za jednu z nejnižších cen v segmentu kompaktních aut.",
    quickFacts: [
      "Průměrná cena ojeté Astra K: 120 000 – 280 000 Kč",
      "Průměrná cena ojeté Corsa F: 180 000 – 300 000 Kč",
      "Nejnižší náklady na údržbu v segmentu: 8 000 – 15 000 Kč/rok",
      "Od 2017 pod Stellantis — motory PSA (spolehlivé)",
      "Zůstatková hodnota po 5 letech: 35–42 %",
      "Opel Corsa-e: elektrická verze od 350 000 Kč ojetá",
    ],
    avgPriceRange: "50 000 – 450 000 Kč",
    description: "Opel nabízí praktické a cenově dostupné vozy s německou spolehlivostí. Na CarMakler máme prověřené ojeté Opely — od populární Astry přes městskou Corsu až po SUV Mokka a Grandland. Opel je ideální volba pro ty, kdo hledají solidní vůz za rozumné peníze. Od přechodu pod koncern Stellantis nabízí Opel moderní motory PSA a vylepšenou kvalitu zpracování. Naši makléři ověří každý ojetý Opel a zajistí bezpečnou transakci.",
    faqItems: [
      { question: "Je ojetý Opel Astra dobrá volba?", answer: "Opel Astra K (od 2015) nabízí komfortní jízdní vlastnosti, prostorný interiér a nízké provozní náklady. Patří mezi nejlepší volby v segmentu kompaktních aut." },
      { question: "Jaké jsou náklady na údržbu ojetého Opelu?", answer: "Opel patří mezi nejlevnější značky na údržbu v ČR. Náhradní díly jsou cenově dostupné a servisů je dostatek." },
      { question: "Nabízíte ojeté Opely s automatem?", answer: "Ano, v nabídce máme Opely s automatickou převodovkou. Nejčastěji jde o modely Astra, Insignia a Grandland s 8stupňovým automatem." },
    ],
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    displayName: "Mercedes-Benz",
    topModels: [
      { slug: "c-trida", name: "C-Třída" },
      { slug: "e-trida", name: "E-Třída" },
      { slug: "glc", name: "GLC" },
      { slug: "a-trida", name: "A-Třída" },
    ],
    aiSnippet: "Ojetý Mercedes-Benz nabízí nejvyšší úroveň komfortu a prestiže v prémiovém segmentu. Průměrná cena ojeté třídy C (W205) je 350 000 – 700 000 Kč (2026). Mercedes ztrácí 40–50 % hodnoty za první 3 roky — ojetý tříletý Mercedes tak stojí polovinu ceny nového. Doporučené motory: OM654 (diesel) a M264 (benzín) od roku 2018.",
    quickFacts: [
      "Průměrná cena ojeté C-Třídy W205: 350 000 – 700 000 Kč",
      "Průměrná cena ojeté E-Třídy W213: 500 000 – 1 100 000 Kč",
      "Depreciace za 3 roky: 40–50 % (výhodné pro kupce)",
      "Nejspolehlivější motory: OM654 (diesel), M264 (benzín)",
      "Servisní náklady: 30 000 – 55 000 Kč ročně",
      "MBUX infotainment systém od 2018 modelů",
    ],
    avgPriceRange: "200 000 – 2 000 000 Kč",
    description: "Mercedes-Benz je synonymem luxusu, komfortu a prémiové kvality. Na CarMakler nabízíme prověřené ojeté Mercedesy od certifikovaných makléřů. Třída C nabízí sportovní eleganci, třída E cestovní komfort nejvyšší úrovně a GLC je ideální prémiové SUV. Ojetý Mercedes-Benz je investice do prestiže a pohodlí — vozy si drží vysokou hodnotu a nabízejí nejmodernější technologie. S CarMakler koupíte prověřený Mercedes bezpečně a transparentně.",
    faqItems: [
      { question: "Vyplatí se koupit ojetý Mercedes?", answer: "Ojetý Mercedes nabízí prémiový komfort a technologie za zlomek ceny nového vozu. Klíčová je kompletní servisní historie a kontrola u odborníka." },
      { question: "Na co si dát pozor u ojetého Mercedesu?", answer: "Důležitá je servisní historie u autorizovaného servisu, kontrola vzduchového podvozku (u E/S třídy), stav elektroniky a automatické převodovky." },
      { question: "Jaký je nejspolehlivější ojetý Mercedes?", answer: "Nejspolehlivější ojeté Mercedesy jsou modely třídy C a E s motory OM651 (diesel) a M264 (benzín). Doporučujeme ročníky od 2016." },
    ],
  },
  {
    slug: "seat",
    name: "SEAT",
    displayName: "SEAT",
    topModels: [
      { slug: "leon", name: "Leon" },
      { slug: "ibiza", name: "Ibiza" },
      { slug: "ateca", name: "Ateca" },
      { slug: "arona", name: "Arona" },
    ],
    aiSnippet: "Ojetý SEAT nabízí techniku koncernu VW s temperamentním španělským designem za nižší cenu. Průměrná cena ojetého SEAT Leon (2020+) je 280 000 – 450 000 Kč (2026). SEAT sdílí platformu MQB, motory a převodovky s VW Golf a Škoda Octavia. Leon je o 10–15 % levnější než srovnatelný Golf se stejnou technikou.",
    quickFacts: [
      "Průměrná cena ojetého Leon IV: 280 000 – 450 000 Kč",
      "SEAT Leon je o 10–15 % levnější než VW Golf",
      "Sdílí platformu MQB s VW a Škodou",
      "Díly plně kompatibilní s VW a Škodou",
      "Zůstatková hodnota po 5 letech: 38–46 %",
      "Cupra Leon: sportovní verze s 300 PS od 500 000 Kč",
    ],
    avgPriceRange: "60 000 – 550 000 Kč",
    description: "SEAT nabízí temperamentní španělský design s technologiemi koncernu Volkswagen. Na CarMakler najdete prověřené ojeté vozy SEAT — sportovní Leon, městskou Ibizu, všestrannou Atecu a kompaktní Aronu. SEAT sdílí platformy a motory s VW a Škodou, což znamená ověřenou spolehlivost a dostupné náhradní díly. Ojeté SEATy nabízejí dynamičtější design a jízdní vlastnosti než sesterské modely za srovnatelnou cenu.",
    faqItems: [
      { question: "Je ojetý SEAT Leon srovnatelný s VW Golf?", answer: "Ano, SEAT Leon sdílí platformu, motory a převodovky s VW Golf. Nabízí sportovnější design a jízdní vlastnosti za o 10-15 % nižší cenu." },
      { question: "Jaké jsou typické problémy ojetých SEATů?", answer: "SEAT sdílí techiku s VW, takže problémy jsou stejné — u starších DSG převodovek občas mechatronika, u TSI motorů řetěz. Od roku 2015 jsou motory výrazně spolehlivější." },
      { question: "Kde seženu náhradní díly na SEAT?", answer: "Díly na SEAT jsou plně kompatibilní s VW a Škodou. Dostupnost je v ČR výborná díky síti dealerů a nezávislých dodavatelů." },
    ],
  },
  {
    slug: "citroen",
    name: "Citroën",
    displayName: "Citroën",
    topModels: [
      { slug: "c3", name: "C3" },
      { slug: "c4", name: "C4" },
      { slug: "c5-aircross", name: "C5 Aircross" },
      { slug: "berlingo", name: "Berlingo" },
    ],
    aiSnippet: "Ojetý Citroën vyniká komfortem odpružení a originálním designem za atraktivní ceny. Průměrná cena ojetého Citroën C3 III je 150 000 – 280 000 Kč (2026). Systém odpružení Citroën Advanced Comfort patří mezi nejlepší v segmentu. C5 Aircross nabízí prémiový komfort SUV za cenu kompaktního vozu.",
    quickFacts: [
      "Průměrná cena ojetého C3 III: 150 000 – 280 000 Kč",
      "Průměrná cena ojetého C5 Aircross: 250 000 – 450 000 Kč",
      "Advanced Comfort odpružení: nejlepší komfort v segmentu",
      "Sdílí motory s Peugeot (PureTech, BlueHDi)",
      "Zůstatková hodnota po 5 letech: 33–42 %",
      "Berlingo: nejpraktičtější rodinné auto s kufrem 775 l",
    ],
    avgPriceRange: "60 000 – 500 000 Kč",
    description: "Citroën je značka, která si zakládá na komfortu a originálním designu. Na CarMakler nabízíme prověřené ojeté Citroëny — stylový C3, moderní C4, komfortní SUV C5 Aircross a praktický Berlingo. Citroën vyniká odpružením Comfort, které je jedním z nejlepších v segmentu. Ojeté Citroëny nabízejí atraktivní ceny, originální design a vysokou praktičnost. Naši certifikovaní makléři každý vůz důkladně prověří.",
    faqItems: [
      { question: "Jsou ojeté Citroëny spolehlivé?", answer: "Citroëny od roku 2015 s motory PureTech a BlueHDi jsou spolehlivé. Značka výrazně zapracovala na kvalitě. U starších modelů doporučujeme důkladnou kontrolu." },
      { question: "Který ojetý Citroën je nejlepší pro rodinu?", answer: "Pro rodinu doporučujeme Citroën C5 Aircross (prostorné SUV) nebo Berlingo (maximální praktičnost a prostor). Oba modely nabízejí skvělý komfort." },
      { question: "Kolik stojí ojetý Citroën C3?", answer: "Ojetý Citroën C3 od roku 2017 se pohybuje od 150 000 Kč. Novější ročníky s vyšší výbavou od 250 000 Kč." },
    ],
  },
  {
    slug: "dacia",
    name: "Dacia",
    displayName: "Dacia",
    topModels: [
      { slug: "duster", name: "Duster" },
      { slug: "sandero", name: "Sandero" },
      { slug: "jogger", name: "Jogger" },
      { slug: "spring", name: "Spring" },
    ],
    aiSnippet: "Dacia je nejdostupnější značka na evropském trhu — nové Dacia stojí méně než většina ojetých konkurentů. Ojetý Dacia Duster II se prodává od 200 000 Kč (2026), Spring Electric od 180 000 Kč. Dacia využívá osvědčené motory Renault s nízkou poruchovostí. Pro kupce s omezeným rozpočtem je ojetá Dacia nejlepší volba z hlediska hodnoty za peníze.",
    quickFacts: [
      "Nejdostupnější značka v Evropě",
      "Průměrná cena ojetého Duster II: 200 000 – 380 000 Kč",
      "Spring Electric: nejlevnější EV od 180 000 Kč ojeté",
      "Motory Renault: osvědčená technika, levné díly",
      "Zůstatková hodnota po 5 letech: 48–55 % (nadprůměrná)",
      "Jogger: 7místný MPV od 250 000 Kč — nejlevnější 7místný vůz",
    ],
    avgPriceRange: "50 000 – 400 000 Kč",
    description: "Dacia je nejdostupnější značka na evropském trhu a nabízí nové auto za cenu ojetého. Na CarMakler najdete prověřené ojeté vozy Dacia — robustní Duster, úsporný Sandero, praktický Jogger a elektrický Spring. Dacia využívá osvědčené motory Renault a nabízí jednoduchou, ale funkční výbavu. Ojetá Dacia je ideální volba pro ty, kdo hledají maximální hodnotu za minimum peněz. Naši makléři ověří stav každého vozu.",
    faqItems: [
      { question: "Vyplatí se ojetá Dacia?", answer: "Ojetá Dacia je skvělá volba pro rozpočtově orientované kupce. Duster nabízí schopnosti SUV za cenu menšího hatchbacku a motory Renault jsou ověřené." },
      { question: "Jaká je spolehlivost ojeté Dacie?", answer: "Dacia používá osvědčené motory a převodovky Renault. Jednoduchá konstrukce znamená méně potenciálních poruch. Údržba je nenáročná a levná." },
      { question: "Kolik stojí ojetá Dacia Duster?", answer: "Ojetý Duster od roku 2018 se pohybuje od 200 000 Kč. Starší generace od 100 000 Kč. S pohonem 4x4 počítejte s příplatkem 30-50 000 Kč." },
    ],
  },
  {
    slug: "mazda",
    name: "Mazda",
    displayName: "Mazda",
    topModels: [
      { slug: "3", name: "3" },
      { slug: "cx-5", name: "CX-5" },
      { slug: "cx-30", name: "CX-30" },
      { slug: "6", name: "6" },
    ],
    aiSnippet: "Ojetá Mazda nabízí prémiový pocit za cenu mainstreamové značky. Mazda je v top 5 nejspolehlivějších značek celosvětově. Průměrná cena ojeté Mazda CX-5 je 300 000 – 550 000 Kč (2026). Motory SkyActiv-G (benzín) pracují bez turba, což přináší vyšší spolehlivost a nižší náklady na údržbu. Mazda má nejvyšší kvalitu laku v segmentu.",
    quickFacts: [
      "Top 5 nejspolehlivějších značek (Consumer Reports 2025)",
      "Průměrná cena ojeté CX-5: 300 000 – 550 000 Kč",
      "Průměrná cena ojeté Mazda 3: 250 000 – 450 000 Kč",
      "Motory SkyActiv bez turba: vysoká spolehlivost",
      "Zůstatková hodnota po 5 letech: 48–58 %",
      "Průměrná roční údržba: 10 000 – 18 000 Kč (nízká)",
    ],
    avgPriceRange: "100 000 – 700 000 Kč",
    description: "Mazda nabízí vozy s prémiovým pocitem za cenu mainstreamové značky. Na CarMakler najdete prověřené ojeté Mazdy — sportovní Mazdu 3, elegantní Mazdu 6 a populární SUV CX-5 a CX-30. Mazda je známá technologií SkyActiv, která optimalizuje výkon i spotřebu, a filozofií Kodo designu. Ojeté Mazdy patří mezi nejspolehlivější vozy na trhu a nabízejí výjimečné jízdní vlastnosti. Naši certifikovaní makléři prověří každý vůz.",
    faqItems: [
      { question: "Jsou ojeté Mazdy spolehlivé?", answer: "Mazda patří mezi nejspolehlivější značky na světě. Motory SkyActiv jsou konstrukčně jednoduché a odolné. Mazda pravidelně obsazuje přední příčky v testech spolehlivosti." },
      { question: "Jaký motor zvolit u ojeté Mazdy?", answer: "Benzínové motory SkyActiv-G 2.0 a 2.5 jsou extrémně spolehlivé. Dieselový SkyActiv-D 2.2 nabízí skvělý výkon a spotřebu. Všechny motory jsou bez turba (kromě dieselu)." },
      { question: "Je ojetá Mazda CX-5 dobrá volba?", answer: "Mazda CX-5 je jedním z nejlepších kompaktních SUV na ojetém trhu. Nabízí prémiový interiér, spolehlivé motory a příjemné jízdní vlastnosti." },
    ],
  },
];

export interface BodyTypeData {
  slug: string;
  name: string;
  description: string;
  faqItems: FaqItem[];
  filterValue?: string;
  aiSnippet?: string;
  quickFacts?: string[];
}

export const BODY_TYPES: BodyTypeData[] = [
  {
    slug: "suv",
    name: "SUV",
    filterValue: "SUV",
    description: "SUV vozy kombinují prostornost, zvýšenou světlou výšku a všestrannost pro každodenní i outdoorové použití. Na CarMakler nabízíme široký výběr prověřených ojetých SUV od certifikovaných makléřů. Ať už hledáte kompaktní SUV do města nebo velké rodinné SUV pro cestování — u nás najdete ověřené vozy s historií bez rizika. SUV jsou aktuálně nejpopulárnějším segmentem na trhu ojetých aut v České republice.",
    faqItems: [
      { question: "Jaké ojeté SUV je nejlepší pro rodinu?", answer: "Pro rodinu doporučujeme Škoda Kodiaq, Hyundai Tucson, Kia Sportage nebo Toyota RAV4. Všechny nabízejí prostorný interiér, velký kufr a moderní bezpečnostní systémy." },
      { question: "Kolik stojí slušné ojeté SUV?", answer: "Kvalitní ojeté SUV s nájezdem do 100 000 km seženete od 300 000 Kč (Dacia Duster, Hyundai Tucson) do 600 000 Kč (BMW X3, Audi Q5)." },
      { question: "Vyplatí se SUV s pohonem 4x4?", answer: "Pokud jezdíte často mimo město nebo v horách, pohon 4x4 se vyplatí. Pro městské použití stačí pohon předních kol — je úspornější a levnější na údržbu." },
    ],
    aiSnippet: "SUV je nejpopulárnější segment na trhu ojetých aut v ČR (2026). Kvalitní ojeté SUV s nájezdem do 100 000 km stojí od 300 000 Kč (Dacia Duster, Hyundai Tucson) do 600 000 Kč (BMW X3, Audi Q5). Nejprodávanějšími ojetými SUV jsou Škoda Kodiaq, Hyundai Tucson a Kia Sportage.",
    quickFacts: [
      "Nejpopulárnější segment ojetých aut v ČR (2026)",
      "Kompaktní SUV: od 300 000 Kč (Tucson, Sportage)",
      "Prémiové SUV: od 500 000 Kč (BMW X3, Audi Q5)",
      "SUV s 4x4: příplatek 30 000 – 80 000 Kč oproti 2WD",
      "Průměrná spotřeba ojetého SUV: 6,5 – 8,5 l/100 km",
    ],
  },
  {
    slug: "kombi",
    name: "Kombi",
    filterValue: "COMBI",
    description: "Kombi vozy jsou ideální pro rodiny a všechny, kdo potřebují maximální prostor pro zavazadla. Na CarMakler nabízíme prověřené ojeté kombi vozy od certifikovaných makléřů. Česká republika je tradičně jedním z největších trhů s kombi vozy v Evropě — modely jako Škoda Octavia Combi, VW Passat Variant nebo Ford Focus Combi patří mezi nejoblíbenější ojetá auta. Kombi kombinují praktičnost velkého kufru s elegancí sedanu.",
    faqItems: [
      { question: "Jaké ojeté kombi je nejprodávanější?", answer: "Nejprodávanějším ojetým kombi v ČR je Škoda Octavia Combi, následovaná VW Passat Variant a Škoda Superb Combi. Oblíbené jsou i Ford Focus a Kia Ceed SW." },
      { question: "Jaký objem kufru mají ojetá kombi?", answer: "Typické kombi nabízí 550-700 litrů objemu kufru. Škoda Superb Combi má až 660 l, VW Passat Variant 650 l, Škoda Octavia Combi 640 l." },
      { question: "Je kombi lepší volba než SUV?", answer: "Kombi nabízí větší zavazadlový prostor, nižší spotřebu a lepší jízdní vlastnosti na silnici. SUV má výhodu vyššího posedu a lepší průchodnosti v terénu." },
    ],
    aiSnippet: "Kombi je tradičně nejoblíbenější karoserie v ČR. Škoda Octavia Combi je nejprodávanějším ojetým kombi s kufrem 640 litrů. Průměrná cena ojeté Octavia Combi III je 200 000 – 400 000 Kč (2026). Kombi nabízí o 20–30 % větší zavazadlový prostor a nižší spotřebu než srovnatelné SUV.",
    quickFacts: [
      "Nejoblíbenější karoserie v ČR",
      "Škoda Octavia Combi: 640 l kufr, od 200 000 Kč",
      "VW Passat Variant: 650 l kufr, od 250 000 Kč",
      "Škoda Superb Combi: 660 l kufr, od 300 000 Kč",
      "Spotřeba kombi: o 0,3–0,5 l/100 km nižší než SUV",
    ],
  },
  {
    slug: "sedan",
    name: "Sedan",
    filterValue: "SEDAN",
    description: "Sedan je klasická karoserie nabízející eleganci, komfort a aerodynamiku. Na CarMakler najdete prověřené ojeté sedany od certifikovaných makléřů. Od kompaktních modelů jako Škoda Octavia sedan přes střední třídu jako VW Passat až po prémiové sedany BMW řady 3 nebo Mercedes C-třídy. Ojetý sedan nabízí výborné jízdní vlastnosti, nízkou spotřebu a nadčasový design. V České republice zůstávají sedany oblíbenou volbou pro reprezentativní i osobní účely.",
    faqItems: [
      { question: "Který ojetý sedan je nejlepší volbou?", answer: "Záleží na rozpočtu: Škoda Octavia (od 150 000 Kč), VW Passat (od 200 000 Kč), BMW 3 (od 300 000 Kč) nebo Mercedes C (od 350 000 Kč)." },
      { question: "Je sedan vhodný pro rodinu?", answer: "Sedan je vhodný pro menší rodinu. Pro větší rodinu nebo časté přepravy rozměrnějších věcí doporučujeme kombi nebo SUV variantu." },
      { question: "Jaké jsou výhody sedanu oproti hatchbacku?", answer: "Sedan nabízí větší zavazadlový prostor (oddělený kufr), tišší interiér díky oddělenému prostoru a elegantnější vzhled." },
    ],
    aiSnippet: "Sedan nabízí eleganci, komfort a nižší spotřebu díky lepší aerodynamice. Ojeté sedany v ČR stojí od 150 000 Kč (Škoda Octavia sedan) do 350 000+ Kč (BMW 3, Mercedes C). Sedan má oddělený kufr, což přináší tišší interiér a lepší tepelnou izolaci.",
    quickFacts: [
      "Škoda Octavia sedan: od 150 000 Kč",
      "VW Passat sedan: od 200 000 Kč",
      "BMW 3 sedan (F30): od 250 000 Kč",
      "Mercedes C sedan (W205): od 350 000 Kč",
      "Nižší spotřeba oproti SUV díky aerodynamice",
    ],
  },
  {
    slug: "hatchback",
    name: "Hatchback",
    filterValue: "HATCHBACK",
    description: "Hatchback je nejrozšířenější karoserie v Evropě díky kompaktním rozměrům a praktičnosti. Na CarMakler nabízíme prověřené ojeté hatchbacky od certifikovaných makléřů. VW Golf, Škoda Fabia, Ford Focus, Hyundai i30 — to jsou jedny z nejprodávanějších ojetých hatchbacků v ČR. Hatchback nabízí ideální kompromis mezi velikostí, spotřebou a praktičností. Sklopná zadní sedadla umožňují flexibilní využití prostoru. Ojeté hatchbacky jsou cenově nejdostupnější segment.",
    faqItems: [
      { question: "Jaký ojetý hatchback je nejspolehlivější?", answer: "Mezi nejspolehlivější ojeté hatchbacky patří Toyota Yaris, Mazda 3, Honda Civic a Hyundai i30. Z českých značek vede Škoda Fabia." },
      { question: "Kolik stojí kvalitní ojetý hatchback?", answer: "Kvalitní ojetý hatchback s nájezdem do 100 000 km seženete od 150 000 Kč (Škoda Fabia) do 400 000 Kč (VW Golf 8, BMW 1)." },
      { question: "Je hatchback vhodný jako první auto?", answer: "Hatchback je ideální jako první auto — kompaktní rozměry usnadňují parkování, nízká spotřeba šetří peníze a pojištění je levnější než u větších aut." },
    ],
    aiSnippet: "Hatchback je nejrozšířenější karoserie v Evropě a cenově nejdostupnější segment ojetých aut. Kvalitní ojetý hatchback s nájezdem do 100 000 km stojí od 150 000 Kč (Škoda Fabia) do 400 000 Kč (VW Golf 8). Nejspolehlivější ojeté hatchbacky: Toyota Yaris, Mazda 3, Honda Civic a Hyundai i30.",
    quickFacts: [
      "Nejrozšířenější karoserie v Evropě",
      "Škoda Fabia: od 130 000 Kč",
      "VW Golf 7: od 200 000 Kč",
      "Hyundai i30: od 220 000 Kč",
      "Ideální jako první auto — nízké pojištění a spotřeba",
    ],
  },
  {
    slug: "elektromobily",
    name: "Elektromobily",
    filterValue: "ELECTRIC",
    description: "Elektromobily představují budoucnost automobilové dopravy a na ojetém trhu nabízejí stále atraktivnější ceny. Na CarMakler najdete prověřené ojeté elektromobily od certifikovaných makléřů — od cenově dostupných modelů jako Renault Zoe a Dacia Spring přes populární VW ID.3 až po prémiové Tesla Model 3 a Hyundai Ioniq 5. Ojetý elektromobil nabízí nulové emise, minimální provozní náklady a vysoký komfort jízdy. Naši makléři ověří stav baterie a celkový technický stav.",
    faqItems: [
      { question: "Vyplatí se ojetý elektromobil?", answer: "Ojetý elektromobil se vyplatí zejména pro denní dojíždění a městský provoz. Provozní náklady jsou 3-5x nižší než u spalovacího motoru. Cena nabíjení doma je cca 1 Kč/km." },
      { question: "Jak zkontrolovat stav baterie u ojetého elektromobilu?", answer: "Naši makléři provedou diagnostiku baterie a zjistí její aktuální kapacitu (SOH). Kvalitní baterie by měla mít po 100 000 km stále 90 %+ kapacity." },
      { question: "Jaký je dojezd ojetého elektromobilu?", answer: "Záleží na modelu: Renault Zoe (300 km), VW ID.3 (350-550 km), Tesla Model 3 (400-600 km). Reálný dojezd je v zimě o 20-30 % nižší." },
    ],
    aiSnippet: "Ojeté elektromobily nabízejí nulové emise a provozní náklady 3-5x nižší než spalovací motor. Nabíjení doma stojí cca 1 Kč/km. Renault Zoe a Dacia Spring startují od 180 000 Kč, VW ID.3 od 450 000 Kč, Tesla Model 3 od 600 000 Kč (2026). Kvalitní baterie má po 100 000 km stále 90 %+ kapacity.",
    quickFacts: [
      "Provozní náklady: 3-5x nižší než spalovací motor",
      "Nabíjení doma: cca 1 Kč/km",
      "Renault Zoe / Dacia Spring: od 180 000 Kč",
      "VW ID.3: od 450 000 Kč, dojezd 350–550 km",
      "Tesla Model 3: od 600 000 Kč, dojezd 400–600 km",
    ],
  },
  {
    slug: "hybrid",
    name: "Hybrid",
    filterValue: "HYBRID",
    description: "Hybridní vozy kombinují spalovací motor s elektrickým pohonem pro nižší spotřebu a emise. Na CarMakler najdete prověřené ojeté hybridy od certifikovaných makléřů. Toyota je průkopníkem hybridní technologie — modely Yaris Hybrid, Corolla Hybrid a RAV4 Hybrid patří mezi nejspolehlivější. Rostoucí nabídka plug-in hybridů (PHEV) umožňuje čistě elektrickou jízdu ve městě. Ojetý hybrid nabízí nižší spotřebu, osvobození od některých poplatků a plynulý komfort jízdy.",
    faqItems: [
      { question: "Je ojetý hybrid spolehlivý?", answer: "Hybridní vozy Toyota a Lexus mají prokázanou spolehlivost i po 300 000 km. Baterie vydrží celou životnost vozu. Plug-in hybridy jsou novější technologie, ale rovněž spolehlivá." },
      { question: "Kolik ušetřím s ojetým hybridem na palivu?", answer: "Hybrid spotřebuje ve městě o 30-50 % méně paliva. Toyota Yaris Hybrid spotřebuje 4 l/100 km, RAV4 Hybrid 5,5 l/100 km. PHEV umí jezdit čistě na elektřinu." },
      { question: "Na co si dát pozor u ojetého hybridu?", answer: "Zkontrolujte stav hybridní baterie a servisní historii. U PHEV ověřte, zda majitel pravidelně nabíjel — plug-in hybrid bez nabíjení spotřebuje více než běžný motor." },
    ],
    aiSnippet: "Hybridní vozy spotřebují ve městě o 30–50 % méně paliva. Toyota Yaris Hybrid spotřebuje 4 l/100 km, RAV4 Hybrid 5,5 l/100 km. Toyota hybridy jsou prokázaně spolehlivé i po 300 000 km — baterie vydrží celou životnost vozu. Plug-in hybridy (PHEV) umí jezdit čistě na elektřinu ve městě.",
    quickFacts: [
      "Toyota Yaris Hybrid: spotřeba 3,5–4,5 l/100 km",
      "Toyota RAV4 Hybrid: od 400 000 Kč",
      "Úspora paliva ve městě: 30–50 % oproti benzínu",
      "Hybridní baterie Toyota: bez výměny po 300 000+ km",
      "PHEV: elektrický dojezd 40–80 km ve městě",
    ],
  },
  {
    slug: "kabriolet",
    name: "Kabriolet",
    filterValue: "CABRIO",
    description: "Kabriolet je synonymem svobody a požitku z jízdy. Na CarMakler nabízíme prověřené ojeté kabriolety od certifikovaných makléřů — od cenově dostupných modelů jako MINI Cabrio a Fiat 500C přes sportovní Mazdu MX-5 až po prémiové BMW řady 4 Cabrio a Mercedes C Cabrio. Ojetý kabriolet nabízí nezapomenutelný zážitek z jízdy za zlomek ceny nového vozu. Naši makléři zkontrolují stav střechy, těsnění a celkový technický stav.",
    faqItems: [
      { question: "Na co si dát pozor u ojetého kabrioletu?", answer: "Klíčový je stav střechy (plátěné nebo kovové), těsnění, funkčnost mechanismu otevírání, stav interiéru (vyblednutí od slunce) a kontrola koroze." },
      { question: "Který ojetý kabriolet je nejspolehlivější?", answer: "Mazda MX-5 je legendární spolehlivý kabriolet. BMW řady 2/4 Cabrio nabízí prémiový zážitek. MINI Cabrio je ideální městský kabriolet." },
      { question: "Vyplatí se ojetý kabriolet celoročně?", answer: "Se střechou zavřenou je kabriolet pohodlný i v zimě. Moderní kabriolety mají kvalitní izolaci a vytápění. Počítejte s vyšší spotřebou a náklady na údržbu střechy." },
    ],
    aiSnippet: "Ojetý kabriolet nabízí nezapomenutelný zážitek z jízdy za zlomek ceny nového vozu. Mazda MX-5 je nejspolehlivější kabriolet od 250 000 Kč. MINI Cabrio je ideální městský kabriolet od 200 000 Kč. BMW 4 Cabrio nabízí prémiový zážitek od 500 000 Kč (2026). Klíčové je prověřit stav střechy a těsnění.",
    quickFacts: [
      "Mazda MX-5: nejspolehlivější kabriolet, od 250 000 Kč",
      "MINI Cabrio: městský kabriolet, od 200 000 Kč",
      "BMW 4 Cabrio: prémiový segment, od 500 000 Kč",
      "Kontrola střechy, těsnění a mechanismu je klíčová",
      "Moderní kabriolety jsou pohodlné celoročně",
    ],
  },
];

export interface PriceRangeData {
  slug: string;
  maxPrice: number;
  label: string;
  description: string;
  faqItems: FaqItem[];
  aiSnippet?: string;
  quickFacts?: string[];
}

export const PRICE_RANGES: PriceRangeData[] = [
  {
    slug: "do-100000",
    maxPrice: 100000,
    label: "do 100 000 Kč",
    description: "Hledáte ojeté auto do 100 000 Kč? Na CarMakler najdete prověřené vozy za dostupné ceny od certifikovaných makléřů. V tomto cenovém rozpětí nabízíme starší, ale funkční vozy ideální jako první auto, městské vozy pro dojíždění nebo spolehlivý druhý vůz do rodiny. Každý vůz prochází kontrolou historie — ověřujeme stav tachometru, původ a historii havárií. I za 100 000 Kč můžete koupit prověřený vůz bez rizika.",
    faqItems: [
      { question: "Dá se koupit dobré auto do 100 000 Kč?", answer: "Ano, za 100 000 Kč seženete spolehlivé auto — Škoda Fabia (2008-2012), Ford Fiesta, Hyundai i20 nebo Opel Corsa. Důležitá je servisní historie a technická kontrola." },
      { question: "Na co si dát pozor u auta do 100 000 Kč?", answer: "Zkontrolujte STK, servisní historii, stav tachometru (přes CEBIA), stav karoserie (koroze) a motor. Náš makléř to vše prověří za vás." },
      { question: "Jaké jsou skryté náklady u levného ojetého auta?", answer: "Počítejte s STK (1 500 Kč), přepisem (800 Kč), pojištěním (3-5 000 Kč/rok) a případnými opravami. Celkový budget by měl být 120-130 000 Kč." },
    ],
    aiSnippet: "Za 100 000 Kč koupíte spolehlivé ojeté auto jako Škoda Fabia (2008–2012), Ford Fiesta nebo Hyundai i20. Důležitá je servisní historie a technická kontrola. Celkový budget by měl být 120–130 000 Kč po započtení STK (1 500 Kč), přepisu (800 Kč) a pojištění (3–5 000 Kč/rok).",
    quickFacts: [
      "Škoda Fabia (2008–2012): od 60 000 Kč",
      "Ford Fiesta: od 70 000 Kč",
      "Hyundai i20: od 80 000 Kč",
      "Skryté náklady: STK + přepis + pojištění = cca 5–8 000 Kč",
      "Doporučený celkový budget: 120–130 000 Kč",
    ],
  },
  {
    slug: "do-200000",
    maxPrice: 200000,
    label: "do 200 000 Kč",
    description: "V rozpočtu do 200 000 Kč se otevírá široká nabídka kvalitních ojetých vozidel. Na CarMakler nabízíme prověřené vozy v tomto cenovém segmentu — od novějších malých aut přes kompaktní hatchbacky až po starší vozy střední třídy. Za 200 000 Kč koupíte vozy jako Škoda Octavia (2012-2015), VW Golf 7, Hyundai i30, Kia Ceed nebo Ford Focus. Naši makléři každý vůz důkladně prověří a pomohou vám vybrat nejlepší volbu.",
    faqItems: [
      { question: "Jaké auto koupit do 200 000 Kč?", answer: "Za 200 000 Kč doporučujeme Škoda Octavia III (2013-2015), VW Golf 7 (2013-2015), Hyundai i30 (2015-2017) nebo Kia Ceed (2016-2018). Všechny nabízejí spolehlivost a nízké náklady." },
      { question: "Je lepší novější malé auto nebo starší větší?", answer: "Záleží na prioritách: novější malé auto (Fabia 2017) nabídne moderní výbavu a záruku. Starší větší auto (Octavia 2014) nabídne více prostoru. Naši makléři vám poradí." },
      { question: "Nabízíte financování pro auta do 200 000 Kč?", answer: "Ano, financování je dostupné od 50 000 Kč. U aut do 200 000 Kč nabízíme splátkový prodej s akontací od 20 % a splátkami od 3 000 Kč měsíčně." },
    ],
    aiSnippet: "Za 200 000 Kč koupíte kvalitní ojeté auto jako Škoda Octavia III (2013–2015), VW Golf 7, Hyundai i30 nebo Kia Ceed. V tomto segmentu najdete novější malá auta i starší vozy střední třídy. Financování je dostupné s akontací od 20 % a splátkami od 3 000 Kč/měsíc.",
    quickFacts: [
      "Škoda Octavia III (2013–2015): od 180 000 Kč",
      "VW Golf 7 (2013–2015): od 190 000 Kč",
      "Hyundai i30 (2015–2017): od 170 000 Kč",
      "Financování: akontace od 20 %, splátky od 3 000 Kč",
      "Typický nájezd: 100 000 – 150 000 km",
    ],
  },
  {
    slug: "do-300000",
    maxPrice: 300000,
    label: "do 300 000 Kč",
    description: "Rozpočet do 300 000 Kč nabízí přístup ke kvalitním ojetým vozidlům s moderní výbavou a nižším nájezdem. Na CarMakler najdete prověřené vozy jako Škoda Octavia III facelift, VW Golf 7.5, Hyundai Tucson, Kia Sportage, Ford Kuga nebo Toyota Corolla. V tomto segmentu již můžete vybírat z novějších ročníků (2017-2020) s bohatou výbavou včetně navigace, parkovací kamery a bezpečnostních asistentů.",
    faqItems: [
      { question: "Jaký vůz doporučujete do 300 000 Kč?", answer: "V tomto rozpočtu doporučujeme Škoda Octavia III FL (2017-2019), VW Golf 7.5 (2017-2019), Hyundai Tucson (2017-2019) nebo Toyota Corolla (2019-2020)." },
      { question: "Mohu za 300 000 Kč koupit SUV?", answer: "Ano, za 300 000 Kč koupíte kvalitní SUV — Dacia Duster (novější), Hyundai Tucson (2017-2018), Kia Sportage (2017-2018) nebo Škoda Karoq (2018-2019)." },
      { question: "Jaký nájezd očekávat u auta za 300 000 Kč?", answer: "U aut z let 2017-2019 za 300 000 Kč očekávejte nájezd 60 000-120 000 km. Nižší nájezd typicky znamená benzínový motor, vyšší dieselový." },
    ],
    aiSnippet: "Rozpočet do 300 000 Kč otevírá přístup k moderním ojetým autům (2017–2020) s bohatou výbavou. Škoda Octavia III FL, VW Golf 7.5, Hyundai Tucson nebo Toyota Corolla — všechny s navigací, parkovací kamerou a bezpečnostními asistenty. Typický nájezd: 60 000–120 000 km.",
    quickFacts: [
      "Škoda Octavia III FL (2017–2019): od 250 000 Kč",
      "Hyundai Tucson (2017–2019): od 280 000 Kč",
      "SUV v rozpočtu: Dacia Duster, Škoda Karoq",
      "Typický nájezd: 60 000 – 120 000 km",
      "Vozy s navigací, kamerou a asistenčními systémy",
    ],
  },
  {
    slug: "do-500000",
    maxPrice: 500000,
    label: "do 500 000 Kč",
    description: "S rozpočtem do 500 000 Kč vstupujete do segmentu novějších a lépe vybavených ojetých vozidel. Na CarMakler najdete prověřené vozy od certifikovaných makléřů — Škoda Octavia IV, VW Golf 8, Škoda Kodiaq, Hyundai Tucson nové generace, BMW řady 3 (F30/G20), Audi A4 (B9) nebo Mercedes C-třídy (W205). V tomto segmentu najdete vozy s nájezdem pod 80 000 km, kompletní výbavou a často i zůstatkovou tovární zárukou.",
    faqItems: [
      { question: "Jaké prémiové auto koupím do 500 000 Kč?", answer: "Za 500 000 Kč koupíte BMW 3 (F30, 2016-2018), Audi A4 (B9, 2016-2018), Mercedes C (W205, 2016-2018) nebo Volvo S60 (2019-2020) v dobré výbavě." },
      { question: "Je lepší nová Fabia nebo ojetá Octavia za 500 000 Kč?", answer: "Ojetá Octavia IV (2021) za 500 000 Kč nabídne výrazně více prostoru, výkonu a výbavy než nová Fabia. Navíc na CarMakler je každý ojetý vůz prověřený." },
      { question: "Mohu za 500 000 Kč koupit elektromobil?", answer: "Ano, za 500 000 Kč koupíte Renault Zoe (2020), Hyundai Ioniq Electric (2020), VW ID.3 (2021) nebo starší Nissan Leaf e+ s dobrým dojezdem." },
    ],
    aiSnippet: "Za 500 000 Kč koupíte nové nebo téměř nové ojeté auto s kompletní výbavou. Škoda Octavia IV, VW Golf 8, BMW 3 F30 nebo Audi A4 B9 — vozy s nájezdem pod 80 000 km a často se zůstatkovou zárukou. V tomto segmentu jsou dostupné i ojeté elektromobily jako VW ID.3 nebo Hyundai Ioniq.",
    quickFacts: [
      "Škoda Octavia IV (2021): od 450 000 Kč",
      "BMW 3 F30 (2016–2018): od 350 000 Kč",
      "Audi A4 B9 (2016–2018): od 350 000 Kč",
      "Elektromobily: VW ID.3, Hyundai Ioniq od 400 000 Kč",
      "Typický nájezd: pod 80 000 km",
    ],
  },
  {
    slug: "do-1000000",
    maxPrice: 1000000,
    label: "do 1 000 000 Kč",
    description: "V rozpočtu do 1 000 000 Kč máte přístup k prémiovým a téměř novým ojetým vozidlům. Na CarMakler nabízíme prověřené vozy jako BMW řady 5 (G30), Mercedes E-třídy (W213), Audi A6 (C8), Volvo XC60, Tesla Model 3 nebo Škoda Superb v nejvyšší výbavě. V tomto segmentu najdete vozy stáří 1-3 roky s minimálním nájezdem, plnou historií u autorizovaného servisu a často i zbytkovou tovární zárukou.",
    faqItems: [
      { question: "Jaký prémiový vůz koupím do milionu?", answer: "Za milion koupíte BMW 5 G30 (2019-2021), Mercedes E W213 (2019-2021), Audi A6 C8 (2019-2021), Volvo XC60 (2020-2022) nebo Tesla Model 3 Long Range (2021-2022)." },
      { question: "Vyplatí se kupovat téměř nové prémiové auto?", answer: "Prémiové vozy ztrácejí 30-40 % hodnoty za první 3 roky. Ojetý prémiový vůz za milion tak nabízí výbavu a kvalitu, která stála nová 1,5-2 miliony." },
      { question: "Nabízíte prověrku u nezávislého servisu?", answer: "Ano, u vozidel v tomto cenovém segmentu doporučujeme a zajistíme kontrolu u autorizovaného servisu dané značky. Náklady prověrky se vám mnohonásobně vrátí." },
    ],
    aiSnippet: "Za milion koupíte prémiový vůz stáří 1–3 roky s minimálním nájezdem. BMW 5 G30, Mercedes E W213, Audi A6 C8 nebo Tesla Model 3 Long Range — všechny s plnou servisní historií a často zbytkovou zárukou. Prémiové vozy ztrácejí 30–40 % hodnoty za první 3 roky, proto ojetý tříletý prémiový vůz stojí polovinu nového.",
    quickFacts: [
      "BMW 5 G30 (2019–2021): od 700 000 Kč",
      "Mercedes E W213 (2019–2021): od 750 000 Kč",
      "Tesla Model 3 LR (2021–2022): od 800 000 Kč",
      "Ztráta hodnoty prémia: 30–40 % za 3 roky",
      "Vozy s kompletní servisní historií a zbytkovou zárukou",
    ],
  },
];

export interface CityData {
  slug: string;
  name: string;
  inLocative: string;
  description: string;
  faqItems: FaqItem[];
  aiSnippet?: string;
  quickFacts?: string[];
}

export const CITIES: CityData[] = [
  {
    slug: "praha",
    name: "Praha",
    inLocative: "v Praze",
    description: "Praha je největší trh s ojetými vozy v České republice. Na CarMakler najdete prověřené vozy od certifikovaných makléřů přímo v Praze a okolí. Naši pražští makléři znají lokální trh a pomohou vám najít ideální vůz. Praha nabízí nejširší výběr značek a modelů — od ekonomických aut pro městský provoz přes rodinná SUV až po prémiové vozy. Nakupte bezpečně s CarMakler v Praze.",
    faqItems: [
      { question: "Kolik ojetých aut nabízíte v Praze?", answer: "V Praze a okolí máme desítky prověřených vozidel od certifikovaných makléřů. Nabídka se denně aktualizuje — nová vozidla přibývají každý den." },
      { question: "Mohu si auto prohlédnout osobně v Praze?", answer: "Samozřejmě. Náš makléř vám domluví osobní prohlídku na místě dle vašich časových možností. Prohlídka je zdarma a nezávazná." },
      { question: "Zajišťujete převod vozidla v Praze?", answer: "Ano, naši makléři zajistí kompletní převod včetně smlouvy, přepisu na registru vozidel a předání všech dokumentů." },
    ],
    aiSnippet: "Praha je největší trh s ojetými vozy v ČR s nejširším výběrem značek a modelů. Průměrná cena ojetého auta v Praze je o 5–10 % vyšší než v regionech (2026). CarMakler má v Praze a okolí síť certifikovaných makléřů, kteří zajistí prohlídku, prověrku CEBIA a kompletní administrativu nákupu.",
    quickFacts: [
      "Největší trh s ojetými vozy v ČR",
      "Ceny o 5–10 % vyšší než v regionech",
      "Nejširší výběr značek a modelů",
      "Osobní prohlídka makléřem zdarma",
      "Kompletní převod: smlouva + přepis + předání",
    ],
  },
  {
    slug: "brno",
    name: "Brno",
    inLocative: "v Brně",
    description: "Brno je druhý největší trh s ojetými vozy v České republice. Na CarMakler nabízíme prověřené ojeté vozy od certifikovaných makléřů v Brně a Jihomoravském kraji. Brněnský automobilový trh je živý a nabízí široký výběr značek — od populárních Škod a Volkswagenů přes korejské značky až po prémiové vozy. S CarMakler v Brně koupíte bezpečně a transparentně.",
    faqItems: [
      { question: "Máte makléře přímo v Brně?", answer: "Ano, v Brně a okolí máme certifikované makléře, kteří znají lokální trh a pomohou vám s výběrem i prohlídkou vozidla." },
      { question: "Jaká auta se nejčastěji prodávají v Brně?", answer: "V Brně jsou nejpopulárnější Škoda Octavia, VW Golf, Hyundai Tucson a Kia Sportage. Rostoucí zájem je i o elektromobily." },
      { question: "Nabízíte doručení auta v rámci Brna?", answer: "Ano, po dohodě s makléřem je možné doručení vozidla na vámi zvolenou adresu v Brně a okolí." },
    ],
    aiSnippet: "Brno je druhý největší trh s ojetými vozy v ČR. Nejpopulárnější ojeté vozy v Brně: Škoda Octavia, VW Golf, Hyundai Tucson a Kia Sportage. Ceny jsou srovnatelné s celorepublikovým průměrem. CarMakler má v Brně a Jihomoravském kraji certifikované makléře s doručením na adresu.",
    quickFacts: [
      "Druhý největší trh s ojetými vozy v ČR",
      "Nejprodávanější: Škoda Octavia, VW Golf",
      "Certifikovaní makléři v Brně a okolí",
      "Doručení vozidla na adresu v Brně",
      "Proces koupě: 3–7 dní od výběru po předání",
    ],
  },
  {
    slug: "ostrava",
    name: "Ostrava",
    inLocative: "v Ostravě",
    description: "Ostrava nabízí dynamický trh s ojetými vozy s výhodnými cenami. Na CarMakler najdete prověřené ojeté vozy od certifikovaných makléřů v Ostravě a Moravskoslezském kraji. Blízkost Polska přináší specifika trhu — naši makléři důkladně ověřují původ každého vozu. Ostravský trh nabízí atraktivní ceny zejména u SUV a užitkových vozidel.",
    faqItems: [
      { question: "Jsou auta v Ostravě levnější než v Praze?", answer: "Ceny ojetých aut v Ostravě bývají o 5-10 % nižší než v Praze. Záleží na značce a modelu, ale obecně je ostravský trh cenově výhodnější." },
      { question: "Jak ověřujete původ aut v Ostravě?", answer: "Každý vůz prochází kontrolou CEBIA, ověřením v registru vozidel a kontrolou, zda nebyl dovezen z ciziny bez řádného proclení." },
      { question: "Máte makléře v Ostravě a okolí?", answer: "Ano, naši certifikovaní makléři působí v Ostravě, Opavě, Frýdku-Místku a dalších městech Moravskoslezského kraje." },
    ],
    aiSnippet: "Ceny ojetých aut v Ostravě jsou o 5–10 % nižší než v Praze (2026). Blízkost Polska přináší specifika trhu — důkladné ověřování původu vozu je klíčové. CarMakler má makléře v Ostravě, Opavě a Frýdku-Místku. Ostravský trh nabízí atraktivní ceny u SUV a užitkových vozidel.",
    quickFacts: [
      "Ceny o 5–10 % nižší než v Praze",
      "Makléři v Ostravě, Opavě, Frýdku-Místku",
      "Důkladné ověřování původu (blízkost PL)",
      "Atraktivní ceny SUV a užitkových vozidel",
      "Kontrola CEBIA + registr vozidel u každého vozu",
    ],
  },
  {
    slug: "plzen",
    name: "Plzeň",
    inLocative: "v Plzni",
    description: "Plzeň je čtvrtým největším městem ČR s aktivním trhem ojetých vozidel. Na CarMakler nabízíme prověřené ojeté vozy od certifikovaných makléřů v Plzni a Plzeňském kraji. Blízkost Německa přináší zajímavé příležitosti — kvalitní německé ojetiny za výhodné ceny. Naši plzeňští makléři znají lokální trh a pomohou vám s bezpečným nákupem.",
    faqItems: [
      { question: "Nabízíte v Plzni i vozy dovezené z Německa?", answer: "Ano, v nabídce máme i kvalitní vozy dovezené z Německa s ověřenou historií. Každý dovozový vůz prochází stejně důkladnou kontrolou jako tuzemský." },
      { question: "Kolik stojí prověřené ojeté auto v Plzni?", answer: "Ceny jsou srovnatelné s celorepublikovým průměrem. Kvalitní ojetý vůz seženete od 150 000 Kč (kompakt) do 500 000 Kč (SUV/prémiový)." },
      { question: "Jak dlouho trvá proces koupě přes makléře?", answer: "Od výběru vozu po předání klíčů trvá proces obvykle 3-7 dní. Zahrnuje prověrku, financování, smlouvu a přepis." },
    ],
    aiSnippet: "Plzeň je 4. největší město ČR a blízkost Německa přináší kvalitní německé ojetiny za výhodné ceny. Každý dovozový vůz prochází stejně důkladnou kontrolou jako tuzemský. Kvalitní ojetý vůz v Plzni seženete od 150 000 Kč (kompakt) do 500 000 Kč (SUV/prémiový). Proces koupě přes makléře trvá 3–7 dní.",
    quickFacts: [
      "4. největší město ČR",
      "Blízkost DE: kvalitní německé ojetiny",
      "Kompaktní vůz: od 150 000 Kč",
      "SUV/prémiový: od 500 000 Kč",
      "Proces koupě: 3–7 dní (prověrka + smlouva + přepis)",
    ],
  },
  {
    slug: "liberec",
    name: "Liberec",
    inLocative: "v Liberci",
    description: "Liberec a Liberecký kraj nabízejí specifický trh ojetých vozidel s důrazem na vozy vhodné do horského terénu. Na CarMakler najdete prověřené ojeté vozy od certifikovaných makléřů v Liberci a okolí. V Libereckém kraji je zvýšená poptávka po SUV a vozech s pohonem 4x4 díky blízkosti Jizerských hor a Krkonoš. Naši makléři vám pomohou vybrat ideální vůz pro liberecké podmínky.",
    faqItems: [
      { question: "Jaké auto je vhodné pro Liberecko?", answer: "Pro Liberecko doporučujeme SUV s pohonem 4x4 nebo vozy s vyšší světlou výškou. Oblíbené jsou Škoda Kodiaq/Karoq, Hyundai Tucson a Subaru." },
      { question: "Máte makléře v Liberci?", answer: "Ano, v Liberci a okolí působí naši certifikovaní makléři, kteří znají specifika lokálního trhu a pomohou s výběrem." },
      { question: "Zajišťujete zimní přípravu vozu?", answer: "Naši makléři vám poradí s výběrem vozu vhodného do zimních podmínek a doporučí zimní pneumatiky a příslušenství." },
    ],
    aiSnippet: "V Libereckém kraji je zvýšená poptávka po SUV a vozech s pohonem 4x4 díky blízkosti Jizerských hor a Krkonoš. Doporučené vozy pro Liberecko: Škoda Kodiaq/Karoq, Hyundai Tucson nebo Subaru s AWD. CarMakler má certifikované makléře v Liberci a okolí, kteří znají specifika lokálního trhu.",
    quickFacts: [
      "Zvýšená poptávka po SUV a 4x4",
      "Blízkost Jizerských hor a Krkonoš",
      "Doporučené: Škoda Kodiaq, Hyundai Tucson, Subaru",
      "Certifikovaní makléři v Liberci a okolí",
      "Poradenství k zimní přípravě vozu",
    ],
  },
  {
    slug: "olomouc",
    name: "Olomouc",
    inLocative: "v Olomouci",
    description: "Olomouc nabízí příjemný trh s ojetými vozy v srdci Moravy. Na CarMakler najdete prověřené ojeté vozy od certifikovaných makléřů v Olomouci a Olomouckém kraji. Olomoucký trh se vyznačuje stabilními cenami a dobrou dostupností oblíbených značek. Naši makléři v Olomouci vám pomohou s kompletním procesem nákupu od výběru přes prověrku až po přepis.",
    faqItems: [
      { question: "Jaká je nabídka ojetých aut v Olomouci?", answer: "V Olomouci nabízíme prověřené vozy všech populárních značek. Nejprodávanější jsou Škoda, VW, Hyundai a Kia. Nabídka se denně aktualizuje." },
      { question: "Nabízíte dopravu vozu z jiného města do Olomouce?", answer: "Ano, pokud vás zaujme vůz z jiného města, můžeme zajistit jeho převoz do Olomouce pro osobní prohlídku." },
      { question: "Jak rychle vyřídíme koupi v Olomouci?", answer: "Celý proces od výběru po předání vozu trvá obvykle 3-5 pracovních dní. V urgentních případech i rychleji." },
    ],
    aiSnippet: "Olomouc nabízí stabilní trh s ojetými vozy v srdci Moravy se stabilními cenami. Nejprodávanější značky v Olomouci: Škoda, VW, Hyundai a Kia. CarMakler zajistí i převoz vozu z jiného města do Olomouce. Celý proces od výběru po předání vozu: 3–5 pracovních dní.",
    quickFacts: [
      "Stabilní ceny ojetých aut v Olomouckém kraji",
      "Nejprodávanější: Škoda, VW, Hyundai, Kia",
      "Převoz vozu z jiného města: možný",
      "Proces koupě: 3–5 pracovních dní",
      "Denní aktualizace nabídky",
    ],
  },
  {
    slug: "ceske-budejovice",
    name: "České Budějovice",
    inLocative: "v Českých Budějovicích",
    description: "České Budějovice jsou centrem jihočeského trhu s ojetými vozidly. Na CarMakler nabízíme prověřené ojeté vozy od certifikovaných makléřů v Českých Budějovicích a Jihočeském kraji. Blízkost Rakouska přináší možnost kvalitních dovozových vozidel. Naši budějovičtí makléři znají lokální trh a pomohou vám s bezpečným nákupem za férovou cenu.",
    faqItems: [
      { question: "Máte makléře v Českých Budějovicích?", answer: "Ano, v Českých Budějovicích a okolí působí naši certifikovaní makléři. Kontaktujte nás a domluríme osobní schůzku." },
      { question: "Jsou v jižních Čechách výhodné ceny ojetých aut?", answer: "Ceny v Českých Budějovicích jsou srovnatelné s celorepublikovým průměrem. Blízkost Rakouska může přinést zajímavé dovozové příležitosti." },
      { question: "Zajišťujete financování v Českých Budějovicích?", answer: "Ano, financování je dostupné po celé ČR. V Českých Budějovicích vyřídíme vše na místě — od žádosti po podpis smlouvy." },
    ],
    aiSnippet: "České Budějovice jsou centrem jihočeského trhu s ojetými vozidly. Blízkost Rakouska přináší možnost kvalitních dovozových vozidel. Ceny jsou srovnatelné s celorepublikovým průměrem. CarMakler zajistí financování přímo na místě — od žádosti po podpis smlouvy.",
    quickFacts: [
      "Centrum jihočeského automobilového trhu",
      "Blízkost Rakouska: kvalitní dovozové vozy",
      "Ceny srovnatelné s celorepublikovým průměrem",
      "Financování na místě v Českých Budějovicích",
      "Certifikovaní makléři v Jihočeském kraji",
    ],
  },
  {
    slug: "hradec-kralove",
    name: "Hradec Králové",
    inLocative: "v Hradci Králové",
    description: "Hradec Králové je důležitým centrem automobilového trhu ve východních Čechách. Na CarMakler nabízíme prověřené ojeté vozy od certifikovaných makléřů v Hradci Králové a Královéhradeckém kraji. Město je strategicky umístěné na křižovatce hlavních dopravních tahů, což přináší dobrou dostupnost vozidel z celé ČR. Naši makléři v Hradci vám pomohou najít ideální vůz.",
    faqItems: [
      { question: "Jaká je nabídka ojetých aut v Hradci Králové?", answer: "V Hradci a okolí nabízíme desítky prověřených vozidel. Populární jsou Škoda, VW, Hyundai a Ford. Nabídka se pravidelně rozšiřuje." },
      { question: "Mohu si auto v Hradci prohlédnout o víkendu?", answer: "Ano, naši makléři jsou flexibilní a prohlídku je možné domluvit i o víkendu dle vašich časových možností." },
      { question: "Mohu přes CarMakler prodat auto v Hradci Králové?", answer: "Ano, přes CarMakler můžete auto prodat snadno a rychle. Náš makléř vám pomůže s celým procesem prodeje." },
    ],
    aiSnippet: "Hradec Králové je důležité centrum automobilového trhu ve východních Čechách na křižovatce hlavních dopravních tahů. Nejpopulárnější značky: Škoda, VW, Hyundai a Ford. CarMakler zprostředkuje prodej auta za férovou cenu. Prohlídky možné i o víkendu.",
    quickFacts: [
      "Centrum automobilového trhu ve východních Čechách",
      "Strategická poloha na křižovatce hlavních tahů",
      "Nejprodávanější: Škoda, VW, Hyundai, Ford",
      "Prohlídky i o víkendu",
      "Zprostředkování prodeje za férovou cenu",
    ],
  },
];

// Model-specific data for top 12 models
export interface ModelData {
  brandSlug: string;
  brandName: string;
  slug: string;
  name: string;
  fullName: string;
  description: string;
  variants: string[];
  competitors: string[];
  faqItems: FaqItem[];
  /** GEO: Direct answer for AI featured snippet */
  aiSnippet: string;
  /** GEO: Quick facts with concrete numbers */
  quickFacts: string[];
  /** GEO: Price range for aggregate offer */
  priceRange: { low: number; high: number };
}

export const TOP_MODELS: ModelData[] = [
  {
    brandSlug: "skoda",
    brandName: "Škoda",
    slug: "octavia",
    name: "Octavia",
    fullName: "Škoda Octavia",
    description: "Škoda Octavia je nejprodávanější ojeté auto v České republice a jeden z nejpopulárnějších modelů v celé Evropě. Na CarMakler najdete prověřené ojeté Octavie od certifikovaných makléřů — od starších spolehlivých generací (Octavia II, III) po nejnovější Octavii IV. Octavia nabízí výjimečný poměr ceny, prostoru a spolehlivosti. K dispozici je jako liftback i kombi (Combi), s benzínovými i dieselovými motory a ve verzích od základní Active po sportovní RS. Octavia je ideální rodinné auto, služební vůz i ekonomická volba pro dojíždění.",
    variants: ["Liftback", "Combi", "Scout", "RS", "L&K"],
    competitors: ["VW Golf", "Hyundai i30", "Ford Focus", "Kia Ceed"],
    faqItems: [
      { question: "Jaká generace Škody Octavia je nejspolehlivější?", answer: "Octavia III (2013-2020) s motory 1.6 TDI a 1.4 TSI patří k nejspolehlivějším. Octavia II (2004-2013) je osvědčená a cenově dostupná. Octavia IV (2020+) přinesla moderní technologie." },
      { question: "Kolik stojí ojetá Škoda Octavia?", answer: "Octavia II od 80 000 Kč, Octavia III od 180 000 Kč, Octavia III FL od 280 000 Kč, Octavia IV od 450 000 Kč. Ceny se liší dle výbavy, motoru a nájezdu." },
      { question: "Jaký motor zvolit u ojeté Octavie?", answer: "Pro benzín doporučujeme 1.4 TSI (150 PS) nebo 2.0 TSI. Pro diesel 1.6 TDI (115 PS) nebo 2.0 TDI (150 PS). Vyvarujte se starších 1.2 TSI s řetězovým rozvodem." },
      { question: "Je ojetá Octavia Combi lepší než liftback?", answer: "Combi nabízí o 120 litrů větší kufr (640 vs 600 l) za příplatek 10-20 000 Kč. Pro rodiny a aktivní životní styl je Combi jasná volba." },
    ],
    aiSnippet: "Škoda Octavia je nejprodávanější ojeté auto v České republice. Průměrná cena ojeté Octavia III (2013–2020) se pohybuje od 180 000 do 380 000 Kč podle výbavy a stavu (2026). Nejžádanější variantou je Octavia Combi 2.0 TDI s manuální převodovkou. Kufr Combi pojme 640 litrů. Při koupi doporučujeme prověřit historii přes CEBIA a u automatických verzí zkontrolovat stav DSG převodovky.",
    quickFacts: [
      "Nejprodávanější ojeté auto v ČR (2026)",
      "Octavia II: od 80 000 Kč | Octavia III: od 180 000 Kč | Octavia IV: od 450 000 Kč",
      "Kufr: Liftback 600 l, Combi 640 l",
      "Nejspolehlivější motory: 1.4 TSI (150 PS), 1.6 TDI (115 PS), 2.0 TDI (150 PS)",
      "Varianty: Liftback, Combi, Scout, RS, L&K",
      "Spotřeba 1.6 TDI: 4,5–5,5 l/100 km (kombinovaná)",
    ],
    priceRange: { low: 80000, high: 700000 },
  },
  {
    brandSlug: "skoda",
    brandName: "Škoda",
    slug: "fabia",
    name: "Fabia",
    fullName: "Škoda Fabia",
    description: "Škoda Fabia je jedním z nejprodávanějších malých aut v Evropě a skvělá volba jako ojeté auto. Na CarMakler nabízíme prověřené ojeté Fabie od certifikovaných makléřů. Fabia nabízí překvapivý prostor v kompaktních rozměrech, nízké provozní náklady a českou spolehlivost. K dispozici jako hatchback i kombi, s úspornými motory MPI a TSI. Fabia je ideální městské auto, první vůz pro začátečníky a ekonomická volba pro dojíždění.",
    variants: ["Hatchback", "Combi", "Monte Carlo", "Style"],
    competitors: ["VW Polo", "Hyundai i20", "Kia Rio", "Toyota Yaris"],
    faqItems: [
      { question: "Je ojetá Škoda Fabia dobrá jako první auto?", answer: "Ano, Fabia je ideální první auto — kompaktní rozměry, nízká spotřeba (5-6 l/100 km), levné pojištění a snadná údržba. Doporučujeme Fabii III (2014+) s motorem 1.0 TSI." },
      { question: "Kolik stojí ojetá Škoda Fabia?", answer: "Fabia II (2007-2014) od 50 000 Kč, Fabia III (2014-2021) od 130 000 Kč, Fabia IV (2021+) od 300 000 Kč." },
      { question: "Jaký motor zvolit u ojeté Fabie?", answer: "Doporučujeme 1.0 TSI (95/110 PS) u Fabie III FL a IV. U starších Fabií je spolehlivý 1.2 MPI. Vyvarujte se tříválce 1.2 HTP se závadami na vstřikování." },
    ],
    aiSnippet: "Škoda Fabia je ideální první auto a městský vůz s nízkými provozními náklady. Průměrná cena ojeté Fabia III (2014–2021) se pohybuje od 130 000 do 250 000 Kč (2026). Fabia nabízí překvapivý prostor v kompaktních rozměrech a spotřebu 5–6 l/100 km. Nejnovější Fabia IV (2021+) přinesla výrazně větší rozměry a modernější technologie.",
    quickFacts: [
      "Fabia II (2007–2014): od 50 000 Kč",
      "Fabia III (2014–2021): od 130 000 Kč",
      "Fabia IV (2021+): od 300 000 Kč",
      "Spotřeba 1.0 TSI: 5–6 l/100 km",
      "Kufr: Hatchback 330 l, Combi 530 l",
      "Doporučený motor: 1.0 TSI (95/110 PS)",
    ],
    priceRange: { low: 50000, high: 400000 },
  },
  {
    brandSlug: "skoda",
    brandName: "Škoda",
    slug: "superb",
    name: "Superb",
    fullName: "Škoda Superb",
    description: "Škoda Superb je vlajková loď značky Škoda a nabízí prostor a komfort vyšší třídy za cenu střední třídy. Na CarMakler najdete prověřené ojeté Superby od certifikovaných makléřů. Superb je jedním z nejprostornějších aut ve své třídě — s kufrem 660 litrů (Combi) a prostorem pro zadní cestující jako v limuzínách. K dispozici jako liftback i Combi, s benzinovými i dieselovými motory od 150 do 280 PS.",
    variants: ["Liftback", "Combi", "L&K", "Sportline"],
    competitors: ["VW Passat", "Ford Mondeo", "Mazda 6", "Kia Optima"],
    faqItems: [
      { question: "Vyplatí se ojetý Škoda Superb?", answer: "Rozhodně. Superb nabízí prostor a výbavu srovnatelnou s Audi A6 za poloviční cenu. Ojetý Superb III (2015+) je jednou z nejlepších koupí na ojetém trhu." },
      { question: "Kolik stojí ojetý Škoda Superb?", answer: "Superb II (2008-2015) od 120 000 Kč, Superb III (2015-2019) od 300 000 Kč, Superb III FL (2019+) od 500 000 Kč." },
      { question: "Jaký motor je nejspolehlivější u Superbu?", answer: "Benzínový 1.4 TSI (150 PS) a 2.0 TSI (190/272 PS) jsou spolehlivé. Diesel 2.0 TDI (150/190 PS) nabízí skvělou spotřebu a výkon." },
    ],
    aiSnippet: "Škoda Superb nabízí prostor a komfort vyšší třídy za cenu střední třídy. Průměrná cena ojetého Superb III (2015–2019) je 300 000 – 550 000 Kč (2026). Kufr Combi pojme 660 litrů — jeden z největších v segmentu. Superb je přímý konkurent VW Passat se sdílenou platformou, ale za výhodnější cenu.",
    quickFacts: [
      "Superb II (2008–2015): od 120 000 Kč",
      "Superb III (2015–2019): od 300 000 Kč",
      "Superb III FL (2019+): od 500 000 Kč",
      "Kufr Combi: 660 l (největší v segmentu)",
      "Sdílí platformu MQB s VW Passat",
      "Doporučený motor: 2.0 TDI (150/190 PS)",
    ],
    priceRange: { low: 120000, high: 850000 },
  },
  {
    brandSlug: "skoda",
    brandName: "Škoda",
    slug: "kodiaq",
    name: "Kodiaq",
    fullName: "Škoda Kodiaq",
    description: "Škoda Kodiaq je velké 7místné SUV, které kombinuje praktičnost Škody s robustními rozměry. Na CarMakler nabízíme prověřené ojeté Kodiaqy od certifikovaných makléřů. Kodiaq nabízí až 7 míst, velkorysý kufr (835 l s 5 sedadly), pohon všech kol a moderní technologie. Je ideální pro velké rodiny, milovníky outdoorových aktivit i jako reprezentativní služební vůz. Ojetý Kodiaq nabízí prémiovou výbavu za rozumnou cenu.",
    variants: ["Ambition", "Style", "L&K", "Sportline", "RS"],
    competitors: ["VW Tiguan Allspace", "Hyundai Santa Fe", "Kia Sorento", "Ford Edge"],
    faqItems: [
      { question: "Je ojetý Škoda Kodiaq spolehlivý?", answer: "Kodiaq je velmi spolehlivý. Motor 2.0 TDI (150/190 PS) a 2.0 TSI (190 PS) jsou ověřené z Octavie a Superbu. Pohon 4x4 je robustní Haldex." },
      { question: "Kolik stojí ojetý Škoda Kodiaq?", answer: "Ojetý Kodiaq (2017-2019) od 400 000 Kč, facelift (2021+) od 650 000 Kč. Verze s 7 místy a 4x4 jsou o 50-100 000 Kč dražší." },
      { question: "Má Kodiaq opravdu 7 míst?", answer: "Ano, verze s třetí řadou sedadel nabízí 7 míst. Třetí řada je vhodná pro děti do 150 cm. S 5 sedadly má kufr 835 litrů." },
    ],
    aiSnippet: "Škoda Kodiaq je nejprostornější SUV od Škody s volitelným 7místným uspořádáním. Průměrná cena ojetého Kodiaq (2017–2019) je 400 000 – 650 000 Kč (2026). Kufr pojme 835 litrů s 5 sedadly. Kodiaq sdílí platformu MQB s VW Tiguan Allspace, ale nabízí více prostoru za nižší cenu.",
    quickFacts: [
      "Kodiaq (2017–2019): od 400 000 Kč",
      "Kodiaq FL (2021+): od 650 000 Kč",
      "Kufr: 835 l (5 sedadel) / 270 l (7 sedadel)",
      "Volitelné 7místné uspořádání",
      "Pohon 4x4: Haldex (příplatek cca 50–100 000 Kč)",
      "Doporučený motor: 2.0 TDI (150/190 PS)",
    ],
    priceRange: { low: 400000, high: 1000000 },
  },
  {
    brandSlug: "volkswagen",
    brandName: "Volkswagen",
    slug: "golf",
    name: "Golf",
    fullName: "Volkswagen Golf",
    description: "Volkswagen Golf je legenda mezi hatchbacky a měřítko kvality v kompaktním segmentu. Na CarMakler najdete prověřené ojeté Golfy od certifikovaných makléřů. Golf 7 a Golf 8 nabízejí vynikající zpracování, moderní technologie a příjemné jízdní vlastnosti. K dispozici jako hatchback i Variant (kombi), s motory od úsporného 1.0 TSI po sportovní GTI a R. Golf je auto pro ty, kdo chtějí německou kvalitu bez kompromisů.",
    variants: ["Hatchback", "Variant", "GTI", "R", "GTE"],
    competitors: ["Škoda Octavia", "Ford Focus", "Hyundai i30", "Mazda 3"],
    faqItems: [
      { question: "Je ojetý VW Golf lepší než Škoda Octavia?", answer: "Golf nabízí sportovnější jízdu a prestiž značky VW. Octavia nabídne více prostoru za nižší cenu. Technicky jsou velmi podobné — sdílejí platformu a motory." },
      { question: "Kolik stojí ojetý VW Golf?", answer: "Golf 7 (2013-2019) od 200 000 Kč, Golf 7.5 FL (2017-2019) od 300 000 Kč, Golf 8 (2020+) od 450 000 Kč." },
      { question: "Jaký motor zvolit u ojetého Golfu?", answer: "Doporučujeme 1.5 TSI (150 PS) — ideální poměr výkonu a spotřeby. Diesel 2.0 TDI (150 PS) pro hodně km. GTI 2.0 TSI (245 PS) pro sportovní jízdu." },
      { question: "Má ojetý Golf problémy s DSG převodovkou?", answer: "7stupňový DSG (DQ200) u starších Golfů 7 měl problémy s mechatronikou. Od roku 2015 je spolehlivější. 6stupňový DSG (DQ250) u TDI je bezproblémový." },
    ],
    aiSnippet: "Volkswagen Golf je etalonem kompaktních hatchbacků a nejprodávanějším modelem VW na ojetém trhu. Průměrná cena ojetého Golf 7 (2013–2019) je 200 000 – 400 000 Kč (2026). Golf 8 (2020+) startuje od 450 000 Kč. Golf sdílí platformu MQB se Škoda Octavia, ale nabízí sportovnější jízdní vlastnosti a prestiž značky VW.",
    quickFacts: [
      "Golf 7 (2013–2019): od 200 000 Kč",
      "Golf 7.5 FL (2017–2019): od 300 000 Kč",
      "Golf 8 (2020+): od 450 000 Kč",
      "GTI 2.0 TSI: 245 PS (od 400 000 Kč)",
      "Kufr: Hatchback 380 l, Variant 605 l",
      "Doporučený motor: 1.5 TSI (150 PS)",
    ],
    priceRange: { low: 200000, high: 800000 },
  },
  {
    brandSlug: "volkswagen",
    brandName: "Volkswagen",
    slug: "passat",
    name: "Passat",
    fullName: "Volkswagen Passat",
    description: "Volkswagen Passat je synonymem komfortního cestovního vozu střední třídy. Na CarMakler nabízíme prověřené ojeté Passaty od certifikovaných makléřů. Passat B8 nabízí prémiovou kvalitu interiéru, pokročilé asistenty řízení a prostorný interiér. Verze Variant (kombi) s kufrem 650 litrů je jedním z nejpraktičtějších cestovních aut. Passat je oblíbený jako služební vůz i rodinné auto pro náročné.",
    variants: ["Sedan", "Variant", "Alltrack", "GTE", "R-Line"],
    competitors: ["Škoda Superb", "Ford Mondeo", "Mazda 6", "Toyota Camry"],
    faqItems: [
      { question: "Je ojetý VW Passat B8 kvalitní auto?", answer: "Passat B8 (2014+) je vynikající auto s prémiovým interiérem, tichým chodem a komfortní jízdou. Kvalita zpracování odpovídá o třídu výše postaveným vozům." },
      { question: "Kolik stojí ojetý VW Passat?", answer: "Passat B7 (2010-2014) od 130 000 Kč, Passat B8 (2014-2019) od 300 000 Kč, Passat B8 FL (2019+) od 500 000 Kč." },
      { question: "Passat nebo Superb — co je lepší?", answer: "Oba sdílejí platformu a motory. Superb nabídne více prostoru vzadu a větší kufr. Passat má o něco kvalitnější materiály a je tišší. Cenově je Superb výhodnější." },
    ],
    aiSnippet: "Volkswagen Passat je synonymem komfortního cestovního vozu a jeden z nejoblíbenějších služebních aut v ČR. Průměrná cena ojetého Passat B8 (2014–2019) je 300 000 – 550 000 Kč (2026). Verze Variant (kombi) s kufrem 650 litrů je jedním z nejpraktičtějších cestovních aut. Passat sdílí platformu s Škoda Superb.",
    quickFacts: [
      "Passat B7 (2010–2014): od 130 000 Kč",
      "Passat B8 (2014–2019): od 300 000 Kč",
      "Passat B8 FL (2019+): od 500 000 Kč",
      "Kufr Variant: 650 l",
      "Alltrack: terénní verze s pohonem 4x4",
      "Doporučený motor: 2.0 TDI (150/190 PS)",
    ],
    priceRange: { low: 130000, high: 900000 },
  },
  {
    brandSlug: "bmw",
    brandName: "BMW",
    slug: "3-series",
    name: "3 Series",
    fullName: "BMW 3 Series",
    description: "BMW řady 3 je ikona sportovních sedanů a nejprodávanější prémiový model na světě. Na CarMakler najdete prověřené ojeté BMW řady 3 od certifikovaných makléřů. Řada 3 nabízí sportovní jízdní vlastnosti, prémiový interiér a pokročilé technologie. K dispozici jako sedan (G20) i Touring (kombi), s motory od úsporného 318d po výkonné M340i. Ojeté BMW 3 je vstupní branou do světa prémiových vozidel.",
    variants: ["Sedan", "Touring", "Sport Line", "Luxury Line", "M Sport"],
    competitors: ["Mercedes C-Třída", "Audi A4", "Volvo S60", "Alfa Romeo Giulia"],
    faqItems: [
      { question: "Je ojeté BMW řady 3 drahé na údržbu?", answer: "Údržba je dražší než u běžných značek, ale odpovídá prémiovému segmentu. Servisní interval je 2 roky/30 000 km. Náhradní díly jsou dostupné i od nezávislých dodavatelů." },
      { question: "Kolik stojí ojeté BMW 3?", answer: "BMW 3 F30 (2012-2018) od 250 000 Kč, BMW 3 G20 (2019+) od 550 000 Kč. Verze M Sport a xDrive jsou o 50-100 000 Kč dražší." },
      { question: "Jaký motor zvolit u ojetého BMW 3?", answer: "Benzín: 320i (184 PS) pro denní jízdu, 330i (258 PS) pro sportovní zážitek. Diesel: 320d (190 PS) — nejpopulárnější, úsporný a výkonný." },
    ],
    aiSnippet: "BMW řady 3 je nejprodávanější prémiový sedan na světě a ikona sportovních jízdních vlastností. Průměrná cena ojetého BMW 3 F30 (2012–2018) je 250 000 – 550 000 Kč (2026). Nová generace G20 (2019+) startuje od 550 000 Kč. BMW 320d je nejpopulárnější motorizace s kombinací výkonu 190 PS a spotřeby pod 6 l/100 km.",
    quickFacts: [
      "BMW 3 F30 (2012–2018): od 250 000 Kč",
      "BMW 3 G20 (2019+): od 550 000 Kč",
      "Nejpopulárnější motor: 320d (190 PS)",
      "M Sport pakety navyšují cenu o 50–100 000 Kč",
      "Servisní náklady: 25 000 – 45 000 Kč/rok",
      "Zůstatková hodnota po 5 letech: 42–52 %",
    ],
    priceRange: { low: 250000, high: 1200000 },
  },
  {
    brandSlug: "audi",
    brandName: "Audi",
    slug: "a4",
    name: "A4",
    fullName: "Audi A4",
    description: "Audi A4 je sofistikovaný prémiový sedan s pokročilou technologií a vynikajícím zpracováním. Na CarMakler nabízíme prověřené ojeté Audi A4 od certifikovaných makléřů. A4 generace B9 přinesla moderní digitální kokpit Virtual Cockpit, quattro pohon všech kol a komfortní jízdní vlastnosti. K dispozici jako sedan i Avant (kombi). A4 je ideální volba pro ty, kdo hledají prémiové auto s technologickým náskokem.",
    variants: ["Sedan", "Avant", "Allroad", "S-Line", "Design"],
    competitors: ["BMW 3 Series", "Mercedes C-Třída", "Volvo S60", "Lexus IS"],
    faqItems: [
      { question: "Vyplatí se ojeté Audi A4 B9?", answer: "A4 B9 (2016+) nabízí prémiovou kvalitu za rozumnou cenu na ojetém trhu. Technologie Virtual Cockpit, kvalitní materiály a quattro pohon dělají z A4 výbornou volbu." },
      { question: "Kolik stojí ojeté Audi A4?", answer: "Audi A4 B8 (2008-2015) od 150 000 Kč, A4 B9 (2016-2019) od 350 000 Kč, A4 B9 FL (2019+) od 550 000 Kč." },
      { question: "Jaký motor zvolit u ojetého A4?", answer: "Nejspolehlivější je 2.0 TFSI (190/252 PS) a 2.0 TDI (150/190 PS). Quattro verze s 2.0 TDI 190 PS jsou ideální kombinace výkonu a trakce." },
    ],
    aiSnippet: "Audi A4 je sofistikovaný prémiový sedan s pokročilou technologií Virtual Cockpit a pohonem quattro. Průměrná cena ojetého Audi A4 B9 (2016–2019) je 350 000 – 650 000 Kč (2026). A4 nabízí vynikající zpracování interiéru a pokročilé asistenční systémy. Verze Avant (kombi) je ideální kombinace praktičnosti a prémiovosti.",
    quickFacts: [
      "A4 B8 (2008–2015): od 150 000 Kč",
      "A4 B9 (2016–2019): od 350 000 Kč",
      "A4 B9 FL (2019+): od 550 000 Kč",
      "Virtual Cockpit: digitální přístrojový štít",
      "Quattro 4x4: příplatek cca 50–100 000 Kč",
      "Doporučený motor: 2.0 TFSI (190 PS), 2.0 TDI (150 PS)",
    ],
    priceRange: { low: 150000, high: 1000000 },
  },
  {
    brandSlug: "ford",
    brandName: "Ford",
    slug: "focus",
    name: "Focus",
    fullName: "Ford Focus",
    description: "Ford Focus je jedním z nejpopulárnějších hatchbacků v Evropě díky sportovním jízdním vlastnostem a dynamickému designu. Na CarMakler nabízíme prověřené ojeté Fordy Focus od certifikovaných makléřů. Focus MK4 (2018+) nabízí moderní technologie, prostorný interiér a vynikající podvozek. K dispozici jako hatchback, Combi a Active (crossover). Motory EcoBoost jsou úsporné a dynamické.",
    variants: ["Hatchback", "Combi", "Active", "ST", "ST-Line"],
    competitors: ["VW Golf", "Škoda Octavia", "Mazda 3", "Kia Ceed"],
    faqItems: [
      { question: "Je ojetý Ford Focus spolehlivý?", answer: "Focus MK4 (2018+) s motory EcoBoost 1.0 a 1.5 je spolehlivý. U MK3 se vyvarujte automatické převodovky PowerShift — manuál je bezproblémový." },
      { question: "Kolik stojí ojetý Ford Focus?", answer: "Focus MK3 (2011-2018) od 100 000 Kč, Focus MK3 FL (2014-2018) od 170 000 Kč, Focus MK4 (2018+) od 280 000 Kč." },
      { question: "Jaký motor zvolit u ojetého Focusu?", answer: "Benzín: 1.0 EcoBoost (125/155 PS) — úsporný a výkonný. Diesel: 1.5 EcoBlue (120 PS). U MK4 doporučujeme 1.0 EcoBoost mHEV." },
    ],
    aiSnippet: "Ford Focus patří mezi nejoblíbenější hatchbacky v Evropě díky sportovním jízdním vlastnostem. Průměrná cena ojetého Focus MK4 (2018+) je 280 000 – 450 000 Kč (2026). Focus MK3 (2011–2018) startuje od 100 000 Kč. Motory EcoBoost 1.0 nabízejí dynamiku a spotřebu pod 6 l/100 km. U MK3 se vyhněte automatické převodovce PowerShift.",
    quickFacts: [
      "Focus MK3 (2011–2018): od 100 000 Kč",
      "Focus MK3 FL (2014–2018): od 170 000 Kč",
      "Focus MK4 (2018+): od 280 000 Kč",
      "EcoBoost 1.0: 125/155 PS, spotřeba 5,5 l/100 km",
      "Pozor na PowerShift automat u MK3 (manuál OK)",
      "Focus ST 2.3 EcoBoost: 280 PS od 400 000 Kč",
    ],
    priceRange: { low: 100000, high: 600000 },
  },
  {
    brandSlug: "toyota",
    brandName: "Toyota",
    slug: "yaris",
    name: "Yaris",
    fullName: "Toyota Yaris",
    description: "Toyota Yaris je synonymem spolehlivosti v segmentu malých aut. Na CarMakler nabízíme prověřené ojeté Toyoty Yaris od certifikovaných makléřů. Yaris nabízí kompaktní rozměry ideální pro město, extrémně nízkou spotřebu (hybridní verze od 3,5 l/100 km) a legendární spolehlivost Toyoty. Nová generace (2020+) získala titul Auto roku 2021 v Evropě. Ojetý Yaris Hybrid je jedním z nejúspornějších a nejspolehlivějších malých aut na trhu.",
    variants: ["Hatchback", "Hybrid", "GR Sport", "Cross"],
    competitors: ["Škoda Fabia", "VW Polo", "Hyundai i20", "Honda Jazz"],
    faqItems: [
      { question: "Je ojetá Toyota Yaris spolehlivá?", answer: "Toyota Yaris je jedním z nejspolehlivějších malých aut vůbec. Hybridní pohon je bezúdržbový a vydrží stovky tisíc km. Poruchovost je minimální." },
      { question: "Kolik stojí ojetá Toyota Yaris?", answer: "Yaris III (2011-2020) od 100 000 Kč, Yaris III Hybrid od 150 000 Kč, Yaris IV (2020+) od 300 000 Kč, Yaris IV Hybrid od 350 000 Kč." },
      { question: "Vyplatí se Yaris Hybrid?", answer: "Rozhodně. Yaris Hybrid spotřebuje ve městě 3,5-4,5 l/100 km. Hybridní systém nevyžaduje žádnou speciální údržbu a baterie vydrží celou životnost vozu." },
    ],
    aiSnippet: "Toyota Yaris je synonymem spolehlivosti v segmentu malých aut s extrémně nízkou spotřebou hybridní verze. Průměrná cena ojeté Toyota Yaris III Hybrid je od 150 000 Kč (2026). Nová Yaris IV (2020+, Auto roku 2021) startuje od 300 000 Kč. Hybridní pohon Toyota spotřebuje ve městě jen 3,5–4,5 l/100 km a baterie vydrží celou životnost vozu.",
    quickFacts: [
      "Yaris III (2011–2020): od 100 000 Kč",
      "Yaris III Hybrid: od 150 000 Kč",
      "Yaris IV (2020+): od 300 000 Kč",
      "Yaris IV Hybrid: od 350 000 Kč",
      "Spotřeba Hybrid ve městě: 3,5–4,5 l/100 km",
      "Auto roku 2021 v Evropě",
    ],
    priceRange: { low: 100000, high: 450000 },
  },
  {
    brandSlug: "hyundai",
    brandName: "Hyundai",
    slug: "i30",
    name: "i30",
    fullName: "Hyundai i30",
    description: "Hyundai i30 je přímý konkurent VW Golf a nabízí skvělý poměr ceny a výbavy. Na CarMakler nabízíme prověřené ojeté Hyundai i30 od certifikovaných makléřů. Třetí generace (2017+) přinesla výrazně kvalitnější interiér, moderní designový jazyk a 5letou záruku. K dispozici jako hatchback, Fastback a Wagon (kombi). I30 nabízí jednu z nejlepších výbav v segmentu za nejnižší cenu.",
    variants: ["Hatchback", "Fastback", "Wagon", "N", "N-Line"],
    competitors: ["VW Golf", "Škoda Octavia", "Ford Focus", "Kia Ceed"],
    faqItems: [
      { question: "Je ojetý Hyundai i30 lepší volba než Golf?", answer: "I30 nabízí srovnatelnou kvalitu s Golfem za o 15-20 % nižší cenu. Výbava je bohatší v základu a 5letá záruka pokrývá i druhého majitele." },
      { question: "Kolik stojí ojetý Hyundai i30?", answer: "I30 GD (2012-2017) od 120 000 Kč, i30 PD (2017-2020) od 220 000 Kč, i30 PD FL (2020+) od 350 000 Kč." },
      { question: "Jaký motor zvolit u ojetého i30?", answer: "Benzín: 1.4 T-GDi (140 PS) — ideální poměr výkonu a spotřeby. Diesel: 1.6 CRDi (136 PS). Pro sportovní jízdu: i30 N 2.0 T-GDi (250/280 PS)." },
    ],
    aiSnippet: "Hyundai i30 je přímý konkurent VW Golf s nejlepším poměrem ceny a výbavy v segmentu a 5letou převoditelnou zárukou. Průměrná cena ojetého i30 PD (2017–2020) je 220 000 – 400 000 Kč (2026). I30 je o 15–20 % levnější než srovnatelný Golf se stejnou úrovní výbavy. Sportovní verze i30 N (250/280 PS) je jedním z nejlépe hodnocených hot-hatchbacků.",
    quickFacts: [
      "i30 GD (2012–2017): od 120 000 Kč",
      "i30 PD (2017–2020): od 220 000 Kč",
      "i30 PD FL (2020+): od 350 000 Kč",
      "O 15–20 % levnější než VW Golf",
      "5letá převoditelná záruka",
      "i30 N: 250/280 PS — nejlepší hot-hatch v segmentu",
    ],
    priceRange: { low: 120000, high: 550000 },
  },
  {
    brandSlug: "kia",
    brandName: "Kia",
    slug: "ceed",
    name: "Ceed",
    fullName: "Kia Ceed",
    description: "Kia Ceed je moderní hatchback navržený a vyráběný v Evropě s 7letou zárukou. Na CarMakler nabízíme prověřené ojeté Kia Ceed od certifikovaných makléřů. Třetí generace (2018+) přinesla atraktivní design, kvalitní interiér a bohatou výbavu. K dispozici jako hatchback, Sportswagon (kombi) a ProCeed (shooting brake). Ceed sdílí platformu s Hyundai i30, ale nabízí odlišný design a 7letou záruku.",
    variants: ["Hatchback", "Sportswagon", "GT", "GT-Line"],
    competitors: ["VW Golf", "Škoda Octavia", "Ford Focus", "Hyundai i30"],
    faqItems: [
      { question: "Platí 7letá záruka Kia i na ojetý Ceed?", answer: "Ano, 7letá záruka (nebo 150 000 km) je plně převoditelná na dalšího majitele. Podmínkou je dodržení servisních intervalů u autorizovaného servisu." },
      { question: "Kolik stojí ojetý Kia Ceed?", answer: "Ceed JD (2012-2018) od 100 000 Kč, Ceed CD (2018-2021) od 250 000 Kč, Ceed CD FL (2021+) od 380 000 Kč." },
      { question: "Jaký motor zvolit u ojetého Ceedu?", answer: "Benzín: 1.4 T-GDi (140 PS) — spolehlivý a úsporný. Diesel: 1.6 CRDi (136 PS). Pro sportovní jízdu: Ceed GT 1.6 T-GDi (204 PS)." },
    ],
    aiSnippet: "Kia Ceed je moderní evropský hatchback s nejdelší zárukou na trhu — 7 let. Průměrná cena ojetého Ceed CD (2018–2021) je 250 000 – 420 000 Kč (2026). Ceed sdílí platformu s Hyundai i30, ale nabízí odlišný design a unikátní verzi ProCeed (shooting brake). 7letá záruka je plně převoditelná na dalšího majitele.",
    quickFacts: [
      "Ceed JD (2012–2018): od 100 000 Kč",
      "Ceed CD (2018–2021): od 250 000 Kč",
      "Ceed CD FL (2021+): od 380 000 Kč",
      "7letá převoditelná záruka (150 000 km)",
      "ProCeed: unikátní shooting brake varianta",
      "Sdílí platformu s Hyundai i30",
    ],
    priceRange: { low: 100000, high: 550000 },
  },
];

// Parts categories data
export interface PartsCategoryData {
  slug: string;
  name: string;
  description: string;
  faqItems: FaqItem[];
}

export const PARTS_CATEGORIES: PartsCategoryData[] = [
  { slug: "motory", name: "Motory", description: "Náhradní motory a motorové díly pro všechny značky. Na CarMakler nabízíme použité i repasované motory od ověřených vrakovišť. Kompletní motory, hlavy válců, blok motoru, klikové hřídele a další motorové komponenty za výhodné ceny s garancí funkčnosti.", faqItems: [{ question: "Jsou použité motory spolehlivé?", answer: "Všechny motory od našich dodavatelů procházejí kontrolou funkčnosti. Na použité motory poskytujeme záruku 3 měsíce. Repasované motory mají záruku až 12 měsíců." }, { question: "Jak zjistím, jaký motor potřebuji?", answer: "Stačí zadat VIN kód vašeho vozu a náš systém automaticky identifikuje kompatibilní motory. Případně kontaktujte náš tým — poradíme vám." }] },
  { slug: "prevodovky", name: "Převodovky", description: "Náhradní převodovky — manuální i automatické — pro všechny značky. Použité i repasované převodovky od ověřených dodavatelů s garancí funkčnosti. DSG, automatické, manuální i CVT převodovky za zlomek ceny nových.", faqItems: [{ question: "Nabízíte i DSG převodovky?", answer: "Ano, v nabídce máme DSG, S-tronic i PDK převodovky. Všechny procházejí kontrolou a jsou dodávány s příslušenstvím." }, { question: "Jaká je záruka na použitou převodovku?", answer: "Na použité převodovky poskytujeme záruku 3 měsíce. Na repasované převodovky až 12 měsíců." }] },
  { slug: "brzdy", name: "Brzdy", description: "Brzdové komponenty — kotouče, destičky, třmeny, hadice i kompletní brzdové sestavy. Originální i aftermarket díly pro bezpečné brzdění vašeho vozu.", faqItems: [{ question: "Nabízíte originální brzdové díly?", answer: "Ano, nabízíme originální (OEM) i kvalitní aftermarket brzdové díly od značek jako Brembo, TRW, Bosch a ATE." }, { question: "Jak často měnit brzdové destičky?", answer: "Přední destičky obvykle vydrží 30 000-60 000 km, zadní 50 000-80 000 km. Záleží na stylu jízdy a hmotnosti vozu." }] },
  { slug: "karoserie", name: "Karoserie", description: "Karosářské díly — blatníky, kapoty, dveře, nárazníky, zrcátka a další. Originální díly z vrakovišť za zlomek ceny nových. Ideální pro opravy po nehodě nebo běžné opotřebení.", faqItems: [{ question: "Dodáváte karosářské díly ve správné barvě?", answer: "Díly dodáváme v originální barvě z dárcovského vozu. Pokud se barva neshoduje, doporučíme přelakování — i tak ušetříte oproti novému dílu." }, { question: "Jak rychle doručíte karosářský díl?", answer: "Běžné díly doručujeme do 2-5 pracovních dní. U rozměrnějších dílů (kapoty, dveře) zajistíme dopravu přepravní službou." }] },
  { slug: "podvozek", name: "Podvozek", description: "Díly podvozku — ramena, čepy, silentbloky, tlumiče, pružiny, stabilizátory a nápravy. Originální i aftermarket díly pro bezpečnou a komfortní jízdu.", faqItems: [{ question: "Nabízíte kompletní podvozkové sady?", answer: "Ano, nabízíme kompletní sady pro přední i zadní nápravu — ramena, čepy, silentbloky a stabilizátory v jednom balení za zvýhodněnou cenu." }, { question: "Jak poznám opotřebený podvozek?", answer: "Příznaky: klepání při přejezdu nerovností, nestabilita v zatáčkách, nerovnoměrné opotřebení pneumatik. Doporučujeme kontrolu každých 50 000 km." }] },
  { slug: "elektro", name: "Elektro", description: "Elektrické a elektronické díly — alternátory, startéry, řídící jednotky, kabelové svazky, senzory a moduly. Originální díly s ověřenou funkčností.", faqItems: [{ question: "Jsou použité řídící jednotky funkční?", answer: "Všechny řídící jednotky testujeme před prodejem. Dodáváme je s informací o kódování a případné potřebě přizpůsobení vašemu vozu." }, { question: "Nabízíte i nové aftermarket elektrodíly?", answer: "Ano, kromě použitých originálních dílů nabízíme i nové aftermarket alternátory, startéry a senzory za výhodné ceny." }] },
  { slug: "interier", name: "Interiér", description: "Interiérové díly — sedadla, palubní desky, volanty, obložení, čalounění a doplňky. Originální díly z vrakovišť v dobrém stavu pro renovaci interiéru.", faqItems: [{ question: "V jakém stavu jsou použitá sedadla?", answer: "Stav každého dílu je detailně popsán a nafocen. Nabízíme díly v různých stavech — od výborného po uspokojivý, vždy s reálnými fotkami." }, { question: "Nabízíte kožené interiéry?", answer: "Ano, v nabídce máme i kožená sedadla a kompletní kožené interiéry z prémiových vozů za zlomek ceny nového čalounění." }] },
  { slug: "kola", name: "Kola a pneumatiky", description: "Disky, pneumatiky a kompletní kola. Originální i aftermarket litá kola, ocelové disky, letní i zimní pneumatiky. Kompletní sady za zvýhodněné ceny.", faqItems: [{ question: "Nabízíte kompletní sady kol?", answer: "Ano, nabízíme kompletní sady 4 kol (disk + pneumatika) za zvýhodněnou cenu. Litá i ocelová kola s letními nebo zimními pneumatikami." }, { question: "Jak zjistím správnou velikost kol?", answer: "Zadejte VIN kód vašeho vozu a náš systém zobrazí kompatibilní velikosti. Nebo se podívejte na štítek ve dveřích řidiče." }] },
  { slug: "vyfuk", name: "Výfuky", description: "Výfukové systémy — katalyzátory, DPF filtry, výfuková potrubí, tlumiče a lambda sondy. Originální i aftermarket díly pro splnění emisních norem.", faqItems: [{ question: "Nabízíte DPF filtry?", answer: "Ano, nabízíme použité i repasované DPF filtry. Repasované DPF filtry jsou vyčištěné a otestované — fungují jako nové za zlomek ceny." }, { question: "Mohu vyměnit katalyzátor za aftermarket?", answer: "Ano, aftermarket katalyzátory splňují emisní normy Euro a jsou cenově výrazně výhodnější. Funkčně jsou srovnatelné s originálními." }] },
  { slug: "chlazeni", name: "Chlazení", description: "Chladicí systémy — chladiče, ventilátory, vodní pumpy, termostaty a expanzní nádoby. Originální i aftermarket díly pro spolehlivé chlazení motoru.", faqItems: [{ question: "Jak poznám problémy s chlazením?", answer: "Příznaky: přehřívání motoru, úbytek chladicí kapaliny, teplý vzduch z topení ve vozidle. Doporučujeme pravidelnou kontrolu hladiny a stavu kapaliny." }, { question: "Nabízíte chladiče pro konkrétní model?", answer: "Ano, všechny díly jsou katalogizovány podle VIN a modelu vozu. Zadejte údaje o vozidle a zobrazí se kompatibilní díly." }] },
  { slug: "palivo", name: "Palivový systém", description: "Palivové komponenty — vstřikovače, čerpadla, palivové filtry, regulátory tlaku a palivové nádrže. Originální díly s ověřenou funkčností.", faqItems: [{ question: "Jsou použité vstřikovače spolehlivé?", answer: "Použité vstřikovače testujeme na zkušebním stavu. Dodáváme je s protokolem o měření a zárukou funkčnosti 3 měsíce." }, { question: "Nabízíte i repasované vstřikovače?", answer: "Ano, repasované vstřikovače procházejí kompletní renovací — čištění, výměna těsnění, kalibrace. Záruka 12 měsíců." }] },
];

// Parts brands data
export const PARTS_BRANDS = [
  { slug: "skoda", name: "Škoda" },
  { slug: "volkswagen", name: "Volkswagen" },
  { slug: "bmw", name: "BMW" },
  { slug: "audi", name: "Audi" },
  { slug: "ford", name: "Ford" },
  { slug: "toyota", name: "Toyota" },
  { slug: "hyundai", name: "Hyundai" },
  { slug: "opel", name: "Opel" },
];

// Parts models data — #87b 3-segment routing seed.
// Used by /dily/znacka/[brand]/[model] + /dily/znacka/[brand]/[model]/[rok] generateStaticParams.
// Stub data only — full FAQ + long-form description přijde s #87c (SeoContent + AI gen).
export interface PartsModelGeneration {
  /** Display name, e.g. "3. generace (5E)" */
  name: string;
  yearFrom: number;
  yearTo: number;
}

export interface PartsModelData {
  slug: string;
  name: string;
  brandSlug: string;
  generations: PartsModelGeneration[];
  /** Years to pre-build via SSG (default [2015, 2018, 2020]) */
  topYears?: number[];
}

export const PARTS_MODELS_BY_BRAND: Record<string, PartsModelData[]> = {
  skoda: [
    {
      slug: "octavia",
      name: "Octavia",
      brandSlug: "skoda",
      generations: [
        { name: "2. generace (1Z)", yearFrom: 2004, yearTo: 2013 },
        { name: "3. generace (5E)", yearFrom: 2013, yearTo: 2020 },
        { name: "4. generace (NX)", yearFrom: 2020, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "fabia",
      name: "Fabia",
      brandSlug: "skoda",
      generations: [
        { name: "2. generace (5J)", yearFrom: 2007, yearTo: 2014 },
        { name: "3. generace (NJ)", yearFrom: 2014, yearTo: 2021 },
        { name: "4. generace (PJ)", yearFrom: 2021, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "superb",
      name: "Superb",
      brandSlug: "skoda",
      generations: [
        { name: "2. generace (3T)", yearFrom: 2008, yearTo: 2015 },
        { name: "3. generace (3V)", yearFrom: 2015, yearTo: 2024 },
      ],
      topYears: [2015, 2018, 2020],
    },
  ],
  volkswagen: [
    {
      slug: "golf",
      name: "Golf",
      brandSlug: "volkswagen",
      generations: [
        { name: "Golf 6", yearFrom: 2008, yearTo: 2013 },
        { name: "Golf 7", yearFrom: 2012, yearTo: 2020 },
        { name: "Golf 8", yearFrom: 2020, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "passat",
      name: "Passat",
      brandSlug: "volkswagen",
      generations: [
        { name: "Passat B7", yearFrom: 2010, yearTo: 2014 },
        { name: "Passat B8", yearFrom: 2014, yearTo: 2023 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "tiguan",
      name: "Tiguan",
      brandSlug: "volkswagen",
      generations: [
        { name: "1. generace (5N)", yearFrom: 2007, yearTo: 2016 },
        { name: "2. generace (AD1)", yearFrom: 2016, yearTo: 2024 },
      ],
      topYears: [2015, 2018, 2020],
    },
  ],
  bmw: [
    {
      slug: "rada-3",
      name: "Řada 3",
      brandSlug: "bmw",
      generations: [
        { name: "E90/E91/E92/E93", yearFrom: 2005, yearTo: 2013 },
        { name: "F30/F31/F34", yearFrom: 2012, yearTo: 2019 },
        { name: "G20/G21", yearFrom: 2019, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "rada-5",
      name: "Řada 5",
      brandSlug: "bmw",
      generations: [
        { name: "F10/F11", yearFrom: 2010, yearTo: 2017 },
        { name: "G30/G31", yearFrom: 2017, yearTo: 2024 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "x5",
      name: "X5",
      brandSlug: "bmw",
      generations: [
        { name: "E70", yearFrom: 2006, yearTo: 2013 },
        { name: "F15", yearFrom: 2013, yearTo: 2018 },
        { name: "G05", yearFrom: 2018, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
  ],
  audi: [
    {
      slug: "a4",
      name: "A4",
      brandSlug: "audi",
      generations: [
        { name: "B8", yearFrom: 2007, yearTo: 2015 },
        { name: "B9", yearFrom: 2015, yearTo: 2024 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "a6",
      name: "A6",
      brandSlug: "audi",
      generations: [
        { name: "C7", yearFrom: 2011, yearTo: 2018 },
        { name: "C8", yearFrom: 2018, yearTo: 2024 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "q5",
      name: "Q5",
      brandSlug: "audi",
      generations: [
        { name: "8R", yearFrom: 2008, yearTo: 2017 },
        { name: "FY", yearFrom: 2017, yearTo: 2024 },
      ],
      topYears: [2015, 2018, 2020],
    },
  ],
  ford: [
    {
      slug: "focus",
      name: "Focus",
      brandSlug: "ford",
      generations: [
        { name: "Mk2", yearFrom: 2004, yearTo: 2011 },
        { name: "Mk3", yearFrom: 2011, yearTo: 2018 },
        { name: "Mk4", yearFrom: 2018, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "mondeo",
      name: "Mondeo",
      brandSlug: "ford",
      generations: [
        { name: "Mk4", yearFrom: 2007, yearTo: 2014 },
        { name: "Mk5", yearFrom: 2014, yearTo: 2022 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "kuga",
      name: "Kuga",
      brandSlug: "ford",
      generations: [
        { name: "Mk1", yearFrom: 2008, yearTo: 2012 },
        { name: "Mk2", yearFrom: 2012, yearTo: 2019 },
        { name: "Mk3", yearFrom: 2019, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
  ],
  toyota: [
    {
      slug: "corolla",
      name: "Corolla",
      brandSlug: "toyota",
      generations: [
        { name: "E150", yearFrom: 2006, yearTo: 2012 },
        { name: "E170", yearFrom: 2013, yearTo: 2018 },
        { name: "E210", yearFrom: 2018, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "yaris",
      name: "Yaris",
      brandSlug: "toyota",
      generations: [
        { name: "XP90", yearFrom: 2005, yearTo: 2011 },
        { name: "XP130", yearFrom: 2011, yearTo: 2020 },
        { name: "XP210", yearFrom: 2020, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "rav4",
      name: "RAV4",
      brandSlug: "toyota",
      generations: [
        { name: "XA30", yearFrom: 2005, yearTo: 2012 },
        { name: "XA40", yearFrom: 2012, yearTo: 2018 },
        { name: "XA50", yearFrom: 2018, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
  ],
  hyundai: [
    {
      slug: "i30",
      name: "i30",
      brandSlug: "hyundai",
      generations: [
        { name: "FD", yearFrom: 2007, yearTo: 2012 },
        { name: "GD", yearFrom: 2012, yearTo: 2017 },
        { name: "PD", yearFrom: 2017, yearTo: 2024 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "tucson",
      name: "Tucson",
      brandSlug: "hyundai",
      generations: [
        { name: "ix35 (LM)", yearFrom: 2010, yearTo: 2015 },
        { name: "TL", yearFrom: 2015, yearTo: 2020 },
        { name: "NX4", yearFrom: 2020, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "kona",
      name: "Kona",
      brandSlug: "hyundai",
      generations: [
        { name: "OS", yearFrom: 2017, yearTo: 2023 },
        { name: "SX2", yearFrom: 2023, yearTo: 2026 },
      ],
      topYears: [2018, 2020, 2022],
    },
  ],
  opel: [
    {
      slug: "astra",
      name: "Astra",
      brandSlug: "opel",
      generations: [
        { name: "Astra J", yearFrom: 2009, yearTo: 2015 },
        { name: "Astra K", yearFrom: 2015, yearTo: 2021 },
        { name: "Astra L", yearFrom: 2021, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "insignia",
      name: "Insignia",
      brandSlug: "opel",
      generations: [
        { name: "A", yearFrom: 2008, yearTo: 2017 },
        { name: "B", yearFrom: 2017, yearTo: 2022 },
      ],
      topYears: [2015, 2018, 2020],
    },
    {
      slug: "mokka",
      name: "Mokka",
      brandSlug: "opel",
      generations: [
        { name: "1. generace", yearFrom: 2012, yearTo: 2019 },
        { name: "2. generace", yearFrom: 2020, yearTo: 2026 },
      ],
      topYears: [2015, 2018, 2020],
    },
  ],
};

/** Vrátí všechny roky v rozsahu generations daného modelu. */
export function getValidYearsForModel(brandSlug: string, modelSlug: string): number[] {
  const model = (PARTS_MODELS_BY_BRAND[brandSlug] || []).find((m) => m.slug === modelSlug);
  if (!model) return [];
  const allYears = new Set<number>();
  for (const gen of model.generations) {
    for (let y = gen.yearFrom; y <= gen.yearTo; y++) allYears.add(y);
  }
  return Array.from(allYears).sort();
}

// Slugs for route resolution
export const ALL_BRAND_SLUGS = BRANDS.map((b) => b.slug);
export const ALL_BODY_TYPE_SLUGS = BODY_TYPES.map((b) => b.slug);
export const ALL_PRICE_RANGE_SLUGS = PRICE_RANGES.map((p) => p.slug);
export const ALL_CITY_SLUGS = CITIES.map((c) => c.slug);

export type SlugType = "brand" | "bodyType" | "priceRange" | "city" | "unknown";

export function resolveSlugType(slug: string): SlugType {
  if (ALL_BRAND_SLUGS.includes(slug)) return "brand";
  if (ALL_BODY_TYPE_SLUGS.includes(slug)) return "bodyType";
  if (ALL_PRICE_RANGE_SLUGS.includes(slug)) return "priceRange";
  if (ALL_CITY_SLUGS.includes(slug)) return "city";
  return "unknown";
}
