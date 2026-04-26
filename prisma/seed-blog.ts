import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Novinky z autosvěta", slug: "novinky", icon: "📰", description: "Aktuality ze světa automobilů — nové modely, technologie a události." },
  { name: "Rady a tipy", slug: "rady-a-tipy", icon: "💡", description: "Praktické rady pro nákup, prodej a údržbu vozidel." },
  { name: "Recenze vozů", slug: "recenze", icon: "⭐", description: "Nezávislé recenze a testy populárních modelů aut." },
  { name: "Tržní analýzy", slug: "trzni-analyzy", icon: "📊", description: "Analýzy trhu s ojetinami, cen a trendů v ČR." },
  { name: "CarMakléř novinky", slug: "carmakler-novinky", icon: "🚀", description: "Novinky a aktualizace z platformy CarMakléř." },
  { name: "Dovozy z Dubaje", slug: "dovozy-z-dubaje", icon: "🌴", description: "Vše o dovozu aut z Dubaje — příležitosti, rizika a tipy." },
  { name: "Dovozy z USA", slug: "dovozy-z-usa", icon: "🇺🇸", description: "Kompletní průvodce dovozem aut z USA na český trh." },
];

const tags = [
  { name: "Ojetiny", slug: "ojetiny" },
  { name: "Údržba", slug: "udrzba" },
  { name: "STK", slug: "stk" },
  { name: "Ceny aut", slug: "ceny-aut" },
  { name: "Elektromobily", slug: "elektromobily" },
  { name: "Financování", slug: "financovani" },
  { name: "Pojištění", slug: "pojisteni" },
  { name: "Dovozy", slug: "dovozy" },
];

interface ArticleSeed {
  title: string;
  slug: string;
  categorySlug: string;
  tagSlugs: string[];
  excerpt: string;
  readTime: number;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  views: number;
  publishedDaysAgo: number;
  content: string;
}

const articles: ArticleSeed[] = [
  {
    title: "Jak správně vybrat ojetinu v roce 2026",
    slug: "jak-spravne-vybrat-ojetinu-v-roce-2026",
    categorySlug: "rady-a-tipy",
    tagSlugs: ["ojetiny", "ceny-aut"],
    excerpt: "Kompletní průvodce nákupem ojetého vozu — na co si dát pozor, jak prověřit historii a kdy raději odejít.",
    readTime: 7,
    coverImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=1200&h=675&fit=crop",
    seoTitle: "Jak vybrat ojetinu 2026 — kompletní průvodce | CarMakléř",
    seoDescription: "Praktický průvodce výběrem ojetého auta v roce 2026. Tipy na prověření historie, kontrolu stavu a vyjednávání ceny.",
    views: 4820,
    publishedDaysAgo: 5,
    content: `<h2>Proč je výběr ojetiny v roce 2026 jiný</h2>
<p>Trh s ojetými vozy prošel v posledních letech zásadní proměnou. Čipová krize sice odezněla, ale její dozvuky stále ovlivňují ceny a dostupnost kvalitních ojetin. Průměrný věk vozidel na českém trhu se zvýšil na 15,3 roku a s ním rostou i nároky na důkladnou kontrolu před nákupem.</p>

<h2>1. Stanovte si rozpočet — ale realisticky</h2>
<p>K ceně vozu přičtěte minimálně 15–20 % na povinné ručení, STK, případné opravy a první servis. Vůz za 200 000 Kč vás reálně vyjde na 230 000–240 000 Kč. Nezapomeňte na převod vozidla, který stojí 800 Kč na registru.</p>

<h2>2. Prověřte historii vozu</h2>
<p>V roce 2026 už není důvod kupovat „zajíce v pytli". Služby jako CEBIA odhalí stočený tachometr, pojistné události i zástavy. Vyžádejte si VIN kód a prověřte ho ještě před prohlídkou. Pokud prodávající odmítá VIN sdělit, je to vážný varovný signál.</p>

<h3>Na co se zaměřit:</h3>
<ul>
<li>Historie servisních zásahů — ideálně v autorizovaném servisu</li>
<li>Počet předchozích majitelů — méně je lépe</li>
<li>Shoda najetých kilometrů se servisní knihou</li>
<li>Původ vozu — dovoz z ciziny může skrývat problémy</li>
</ul>

<h2>3. Fyzická prohlídka je základ</h2>
<p>Nikdy nekupujte auto jen podle fotek. Prohlédněte lak měřičem tloušťky, zkontrolujte spáry mezi díly, hledejte stopy po opravách. Motor by měl startovat na první pokus i za studena. Projížďka musí zahrnovat dálnici i město — poslouchejte neobvyklé zvuky.</p>

<h2>4. Kdy využít makléře</h2>
<p>Pokud si nevěříte na technickou kontrolu nebo nemáte čas objíždět desítky inzerátů, zvažte služby automobilového makléře. Profesionál prověří vůz za vás, vyjedná lepší cenu a pohlídá celý převod. U CarMakléř platíte provizi až z úspěšného prodeje, takže riskujete minimum.</p>

<h2>Shrnutí</h2>
<p>Výběr ojetiny vyžaduje trpělivost a systematický přístup. Nenechte se tlačit do rychlého rozhodnutí, vždy si nechte prostor na rozmyšlenou. A pokud máte pochybnosti — raději odejděte. Další příležitost přijde.</p>`,
  },
  {
    title: "Škoda Superb 4 — první dojmy a recenze",
    slug: "skoda-superb-4-prvni-dojmy-a-recenze",
    categorySlug: "recenze",
    tagSlugs: ["ojetiny"],
    excerpt: "Testovali jsme novou Škodu Superb čtvrté generace. Jak si vedla na českých silnicích?",
    readTime: 9,
    coverImage: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&h=675&fit=crop",
    seoTitle: "Škoda Superb 4 recenze 2026 — test a první dojmy | CarMakléř",
    seoDescription: "Detailní recenze nové Škody Superb 4. generace. Test na českých silnicích, spotřeba, výbava a srovnání s konkurencí.",
    views: 3210,
    publishedDaysAgo: 12,
    content: `<h2>Nová éra vlajkové lodi</h2>
<p>Škoda Superb čtvrté generace přišla na trh s ambicí redefinovat, co může česká automobilka nabídnout ve vyšší střední třídě. Po týdnu intenzivního testování můžeme říct: mise splněna, i když s drobnými výhradami.</p>

<h2>Design a zpracování</h2>
<p>Nový Superb je vizuálně výrazně odlišný od předchůdce. Ostřejší linie, nový světelný podpis a propracované detaily dávají autu prémiový vzhled. Interiér překvapí kvalitou materiálů — měkké plasty, prošívané sedačky a minimalistická palubní deska s 13" displejem infotainmentu.</p>
<p>Zavazadlový prostor zůstává královskou disciplínou — 645 litrů v základu, až 1 800 se sklopenými sedadly.</p>

<h2>Motorizace a jízdní vlastnosti</h2>
<p>Testovali jsme verzi 2.0 TDI EVO s výkonem 150 koní a 7stupňovým DSG. Motor je kultivovaný, tichý a překvapivě úsporný — průměrná spotřeba na našem testu činila 5,2 l/100 km.</p>

<h3>Jízdní komfort</h3>
<p>Podvozek s adaptivními tlumiči skvěle filtruje nerovnosti. Na českých silnicích, které nejsou vždy v nejlepším stavu, je to znát. Řízení je přesné, ale ne příliš sportovní — Superb je komfortní cestovní vůz.</p>

<h2>Technologie</h2>
<p>Head-up displej, matrix LED světlomety, 3-zónová klimatizace a celá řada asistentů jsou dostupné již ve výbavě Selection. Infotainment běží svižně a konečně podporuje bezdrátový Android Auto i Apple CarPlay bez výpadků.</p>

<h2>Verdikt</h2>
<p>Škoda Superb 4 je nejlepší Superb, jaký kdy vznikl. Nabízí prémiový komfort, obrovský prostor a rozumnou spotřebu. <strong>Hodnocení: 8,5/10</strong></p>`,
  },
  {
    title: "Trh s ojetinami v ČR: trendy a predikce pro rok 2026",
    slug: "trh-s-ojetinami-v-cr-trendy-a-predikce-2026",
    categorySlug: "trzni-analyzy",
    tagSlugs: ["ojetiny", "ceny-aut", "elektromobily"],
    excerpt: "Analýza aktuálního stavu trhu s ojetými vozy v České republice — co ovlivňuje ceny a kam směřují trendy.",
    readTime: 6,
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop",
    seoTitle: "Trh s ojetinami ČR 2026 — trendy, ceny, predikce | CarMakléř",
    seoDescription: "Podrobná analýza českého trhu s ojetinami v roce 2026. Vývoj cen, nejprodávanější modely a výhled do budoucna.",
    views: 2780,
    publishedDaysAgo: 18,
    content: `<h2>Stav trhu na začátku roku 2026</h2>
<p>Český trh s ojetými vozidly zaznamenal v prvním čtvrtletí roku 2026 meziroční nárůst transakcí o 8,3 %. Převody vozidel na registrech dosáhly 187 000 za Q1, což je nejvyšší číslo od roku 2019.</p>

<h2>Vývoj cen</h2>
<p>Průměrná cena ojetého vozidla v ČR činí aktuálně 289 000 Kč, což představuje pokles o 4,2 % oproti vrcholu z konce roku 2024. Nejvýrazněji klesly ceny u vozů starších 10 let (−7,1 %), zatímco mladé ojetiny do 3 let si drží hodnotu.</p>

<h3>Nejprodávanější značky ojetin v ČR</h3>
<ul>
<li>Škoda — 31,2 % podíl (dominance Octavia, Fabia, Superb)</li>
<li>Volkswagen — 12,8 % (Golf, Passat, Tiguan)</li>
<li>Ford — 7,4 % (Focus, Mondeo)</li>
<li>Hyundai — 6,9 % (i30, Tucson)</li>
<li>Toyota — 5,1 % (Yaris, Corolla, RAV4)</li>
</ul>

<h2>Elektromobily na trhu ojetin</h2>
<p>Podíl elektrických vozů na trhu ojetin roste, ale zůstává marginální — 2,3 % všech transakcí. Hlavní brzdou je nejistota ohledně stavu baterií. Průměrná cena ojetého elektromobilu je 420 000 Kč, přičemž nejžádanější jsou Tesla Model 3 a Škoda Enyaq.</p>

<h2>Predikce pro zbytek roku 2026</h2>
<p>Očekáváme pokračující mírný pokles cen u starších ojetin (−3 až −5 % do konce roku) a stabilizaci u mladých ojetin. Podíl elektromobilů by měl vzrůst na 3,5–4 % díky prvním leasingovým návratům Enyaqů a Modelů 3 z let 2023–2024.</p>

<h2>Co to znamená pro kupující</h2>
<p>Pro kupující je aktuální situace příznivá — ceny klesají, výběr roste a online nástroje pro prověření vozu jsou dostupnější než kdy dřív. Doporučujeme neodkládat nákup u mladých ojetin, kde se ceny stabilizují.</p>`,
  },
  {
    title: "Dovoz auta z Dubaje: kompletní průvodce 2026",
    slug: "dovoz-auta-z-dubaje-kompletni-pruvodce-2026",
    categorySlug: "dovozy-z-dubaje",
    tagSlugs: ["dovozy", "ceny-aut"],
    excerpt: "Vše, co potřebujete vědět o dovozu auta z Dubaje — od výběru vozu přes celní řízení až po registraci v ČR.",
    readTime: 11,
    coverImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&h=675&fit=crop",
    seoTitle: "Dovoz auta z Dubaje 2026 — kompletní průvodce krok za krokem | CarMakléř",
    seoDescription: "Jak dovézt auto z Dubaje do ČR v roce 2026. Celní poplatky, DPH, homologace, dokumenty a kalkulace celkových nákladů.",
    views: 5120,
    publishedDaysAgo: 8,
    content: `<h2>Proč dovážet z Dubaje?</h2>
<p>Dubaj se stal jedním z nejatraktivnějších zdrojů prémiových ojetin pro český trh. Důvodů je několik: nízké ceny (žádná DPH v UAE), nízké nájezdy (auta se v Dubaji používají primárně na krátké vzdálenosti s klimatizací), a široký výběr luxusních a sportovních vozů.</p>

<h2>Cenová výhoda — je reálná?</h2>
<p>BMW X5 M50i ročník 2023 s 20 000 km stojí v Dubaji přibližně 45 000 USD (cca 1 020 000 Kč). Stejný vůz v ČR se prodává za 1 450 000–1 600 000 Kč. I po připočtení všech nákladů (doprava, clo, DPH, homologace) vychází úspora 150 000–250 000 Kč.</p>

<h3>Kalkulace nákladů dovozu</h3>
<ul>
<li>Doprava kontejnerem: 35 000–55 000 Kč (4–6 týdnů)</li>
<li>Clo 6,5 % z hodnoty vozu + dopravy</li>
<li>DPH 21 % z (hodnota + clo + doprava)</li>
<li>Homologace a STK: 15 000–25 000 Kč</li>
<li>Zprostředkování: 20 000–40 000 Kč</li>
</ul>

<h2>Na co si dát pozor</h2>
<p>Vozy z Dubaje mohou mít specifické problémy: písek v těsněních a filtrace, UV degradace interiérových plastů, a specifikace pro místní trh (jiný infotainment, absence zimního balíčku). Vždy si nechte udělat nezávislou inspekci před koupí.</p>

<h2>Krok za krokem</h2>
<p>1. Výběr vozu přes ověřeného dealera nebo platformu (dubizzle, CarSwitch). 2. Nezávislá inspekce. 3. Platba přes escrow účet. 4. Export z UAE — deregistrace + export certifikát. 5. Námořní přeprava. 6. Celní řízení v ČR. 7. Homologace + STK. 8. Registrace na registru.</p>

<h2>Závěr</h2>
<p>Dovoz z Dubaje se vyplatí u prémiových vozů nad 1 milion Kč, kde je cenová úspora nejvýraznější. U levnějších aut náklady na dopravu a clo výhodu eliminují. Vždy počítejte se 6–10 týdny od objednávky po registraci v ČR.</p>`,
  },
  {
    title: "Příprava na STK 2026: co zkontrolovat předem",
    slug: "priprava-na-stk-2026-co-zkontrolovat-predem",
    categorySlug: "rady-a-tipy",
    tagSlugs: ["stk", "udrzba"],
    excerpt: "Nechcete propadnout na STK? Připravili jsme seznam věcí, které si můžete zkontrolovat sami ještě před návštěvou stanice.",
    readTime: 5,
    coverImage: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&h=675&fit=crop",
    seoTitle: "Příprava na STK 2026 — co zkontrolovat | CarMakléř",
    seoDescription: "Kompletní checklist přípravy na STK. Zkontrolujte si auto sami a projděte na první pokus.",
    views: 3890,
    publishedDaysAgo: 22,
    content: `<h2>STK nemusí být stres</h2>
<p>Každoročně propadne na STK přibližně 18 % vozidel. Přitom většina závad je snadno odhalitelná i bez speciálního vybavení. Stačí si auto projít systematicky a nejčastější problémy vyřešit předem.</p>

<h2>Exteriér a světla</h2>
<p>Zkontrolujte funkčnost všech světel — potkávací, dálková, obrysová, brzdová, zpětná, mlhová a blinkry. Vyměňte prasknuté kryty a nefunkční žárovky. Ověřte stav pneumatik — hloubka dezénu musí být minimálně 1,6 mm (doporučujeme 3+ mm). Zkontrolujte viditelné praskliny na čelním skle v zorném poli řidiče.</p>

<h2>Brzdy a podvozek</h2>
<p>Vyzkoušejte brzdný účinek — auto musí brzdit rovnoměrně bez stáčení. Poslouchejte pískání nebo drhnutí. Zkontrolujte únik brzdové kapaliny. Projděte spodek vozu — hledejte korozní body na nosných prvcích podvozku, netěsnosti výfukového systému.</p>

<h2>Motor a emise</h2>
<p>U benzínových motorů zkontrolujte, zda nesvítí kontrolka motoru (check engine). U dieselů ověřte funkčnost DPF filtru — pokud svítí regenerace, odjeďte delší trasu na dálnici. Hladina oleje a chladicí kapaliny musí být v normě.</p>

<h2>Dokumenty</h2>
<p>Nezapomeňte na velký technický průkaz (osvědčení o registraci), platné povinné ručení a doklad totožnosti. Bez těchto dokumentů vás na STK nepustí.</p>

<h2>Tipy na závěr</h2>
<p>Objednejte se na STK včas — zejména na konci měsíce bývá nápor. Pokud máte pochybnosti o stavu vozu, zajděte nejdřív do servisu na předSTK kontrolu. Stojí obvykle 500–800 Kč a ušetří vám nervozitu i případné opakování STK.</p>`,
  },
  {
    title: "Elektromobily jako ojetiny: vyplatí se v roce 2026?",
    slug: "elektromobily-jako-ojetiny-vyplati-se-v-roce-2026",
    categorySlug: "trzni-analyzy",
    tagSlugs: ["elektromobily", "ojetiny", "ceny-aut"],
    excerpt: "Na trhu přibývá ojetých elektromobilů. Podíváme se na reálné náklady, stav baterií a zda se vyplatí koupit ojetý elektromobil.",
    readTime: 8,
    coverImage: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&h=675&fit=crop",
    seoTitle: "Ojetý elektromobil 2026 — vyplatí se? | CarMakléř",
    seoDescription: "Analýza trhu s ojetými elektromobily v ČR. Stav baterií, reálná spotřeba, náklady na provoz a nejlepší modely k nákupu.",
    views: 2340,
    publishedDaysAgo: 30,
    content: `<h2>Ojeté elektromobily konečně dávají smysl</h2>
<p>Rok 2026 přináší zlom na trhu ojetých elektromobilů. Na trh se dostávají první vlny leasingových návratů populárních modelů — Škoda Enyaq, Tesla Model 3 a Hyundai Ioniq 5. Ceny klesly o 20–35 % oproti novým a nabídka se konečně rozšiřuje.</p>

<h2>Stav baterie — klíčová otázka</h2>
<p>Největší obavou při koupi ojetého elektromobilu je stav baterie. Dobrou zprávou je, že moderní baterie degradují pomaleji, než se čekalo. Průměrný 3letý elektromobil s 60 000 km má stále 92–95 % původní kapacity. Tesla Model 3 z roku 2023 typicky ukazuje SOH (State of Health) kolem 94 %.</p>

<h3>Jak ověřit stav baterie</h3>
<ul>
<li>Vyžádejte si diagnostiku u autorizovaného servisu</li>
<li>U Tesly použijte aplikace jako TeslaFi nebo Recurrent</li>
<li>Zkontrolujte reálný dojezd vs. udávaný — pokles nad 15 % signalizuje problém</li>
<li>Zjistěte, zda bylo auto pravidelně rychlonabíjeno (nad 80 % DC nabíjení zrychluje degradaci)</li>
</ul>

<h2>Nejlepší ojeté elektromobily v ČR</h2>
<p>Škoda Enyaq 60 (2023) — od 590 000 Kč, reálný dojezd 300 km. Tesla Model 3 Standard (2022) — od 650 000 Kč, dojezd 350 km. Hyundai Ioniq 5 (2023) — od 680 000 Kč, rychlonabíjení 18 min 10–80 %. VW ID.4 (2022) — od 550 000 Kč, prostorný SUV s 320 km dojezdem.</p>

<h2>Provozní náklady</h2>
<p>Elektromobil ušetří průměrně 2 500–3 500 Kč měsíčně na palivu (při 1 500 km/měsíc). Servisní náklady jsou o 40–60 % nižší — žádné výměny oleje, řemenů, výfuků. Pojištění je srovnatelné s benzinovými vozy stejné třídy.</p>

<h2>Verdikt</h2>
<p>Pokud máte možnost domácího nabíjení a jezdíte převážně do 250 km denně, ojetý elektromobil v roce 2026 dává ekonomický i ekologický smysl. Klíčové je ověřit stav baterie a vybrat model s dobrou servisní sítí v ČR.</p>`,
  },
  {
    title: "Dovoz ojetiny z USA: je to stále výhodné?",
    slug: "dovoz-ojetiny-z-usa-je-to-stale-vyhodne",
    categorySlug: "dovozy-z-usa",
    tagSlugs: ["dovozy", "ceny-aut", "ojetiny"],
    excerpt: "Americké ojetiny lákají cenou, ale celní poplatky a homologace mohou výhodu smazat. Kdy se dovoz z USA vyplatí?",
    readTime: 8,
    coverImage: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=675&fit=crop",
    seoTitle: "Dovoz auta z USA 2026 — vyplatí se? Kompletní kalkulace | CarMakléř",
    seoDescription: "Kompletní průvodce dovozem auta z USA do ČR. Celní poplatky, DPH, homologace, aukce Copart/IAAI a reálné kalkulace.",
    views: 4150,
    publishedDaysAgo: 15,
    content: `<h2>Americký trh — jiný svět</h2>
<p>Spojené státy mají největší trh s ojetými vozy na světě — ročně se prodá přes 40 milionů kusů. Díky aukcím jako Copart a IAAI se k vozům dostanete za velkoobchodní ceny, často výrazně pod evropskou tržní hodnotou. Ale pozor — ne všechno, co vypadá jako skvělý deal, jím skutečně je.</p>

<h2>Kde hledat vozy</h2>
<p>Hlavní platformy jsou Copart (poškozená i nepoškozená vozidla) a IAAI (Insurance Auto Auctions). Pro nepoškozené vozy pak Manheim a ADESA. Registrace na aukcích vyžaduje dealer licenci — většina českých dovozců to řeší přes amerického partnera.</p>

<h2>Kalkulace celkových nákladů</h2>
<p>Příklad: Ford Mustang GT 2022, cena na aukci 28 000 USD</p>
<ul>
<li>Cena vozu: 28 000 USD (634 000 Kč)</li>
<li>Aukční poplatky: 1 200 USD (27 000 Kč)</li>
<li>Vnitrozemská přeprava: 800 USD (18 000 Kč)</li>
<li>Námořní přeprava: 1 800 USD (41 000 Kč)</li>
<li>Clo 6,5 %: 46 800 Kč</li>
<li>DPH 21 %: 161 000 Kč</li>
<li>Homologace + úpravy: 35 000 Kč</li>
<li><strong>Celkem: cca 963 000 Kč</strong></li>
</ul>
<p>Stejný Mustang GT v ČR: 1 300 000–1 500 000 Kč. Úspora: 340 000–540 000 Kč.</p>

<h2>Rizika a úskalí</h2>
<p>Hlavní riziko představují vozy s Salvage title (totální škoda) — vyžadují opravu a mohou mít skryté strukturální poškození. Americká auta mají také odlišné specifikace: míle místo km na tachometru, jiné osvětlení (oranžové blinkry vzadu), a často chybí DPF u starších dieselů.</p>

<h2>Kdy se dovoz vyplatí</h2>
<p>Dovoz z USA se vyplatí primárně u amerických značek (Ford, Chevrolet, Dodge, RAM) a prémiových vozů nad 1 milion Kč (BMW, Mercedes, Porsche). U evropských značek malých vozů (Golf, Octavia) nedává smysl — cenový rozdíl nepokryje náklady na dopravu a homologaci.</p>`,
  },
  {
    title: "Pojištění ojetého auta: jak ušetřit a nepřijít o peníze",
    slug: "pojisteni-ojeteho-auta-jak-usetrit",
    categorySlug: "rady-a-tipy",
    tagSlugs: ["pojisteni", "ojetiny", "financovani"],
    excerpt: "Povinné ručení i havarijní pojištění se liší cenou i rozsahem. Poradíme, jak vybrat správně a kde ušetřit.",
    readTime: 6,
    coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=675&fit=crop",
    seoTitle: "Pojištění ojetého auta 2026 — jak ušetřit | CarMakléř",
    seoDescription: "Jak vybrat nejlepší pojištění pro ojeté auto. Srovnání povinného ručení a havarijka, tipy na úsporu a časté chyby.",
    views: 1950,
    publishedDaysAgo: 35,
    content: `<h2>Povinné ručení — základ</h2>
<p>Povinné ručení (pojištění odpovědnosti z provozu vozidla) je ze zákona povinné. Ceny se v roce 2026 pohybují od 2 500 Kč ročně za malý vůz do 12 000 Kč za výkonné SUV. Rozdíly mezi pojišťovnami mohou činit i 100 % — srovnání se vždy vyplatí.</p>

<h2>Havarijní pojištění — kdy ano, kdy ne</h2>
<p>U ojetin do 150 000 Kč se havarijní pojištění většinou nevyplatí. Roční pojistné (8 000–15 000 Kč) plus spoluúčast (5 000–10 000 Kč) mohou převýšit hodnotu pojistného plnění. U dražších ojetin (nad 300 000 Kč) nebo leasingových vozů je havarijko rozumná investice.</p>

<h3>Na co si dát pozor</h3>
<ul>
<li>Spoluúčast — nižší spoluúčast = vyšší pojistné, a naopak</li>
<li>Amortizace — pojišťovny snižují plnění o stáří dílů (až 50 %)</li>
<li>Územní platnost — některé levné tarify kryjí jen ČR</li>
<li>Asistenční služby — zahrnuje odtah? Náhradní vůz?</li>
</ul>

<h2>Jak ušetřit na pojištění</h2>
<p>Přepočítejte bonus za bezeškodný průběh — při přestupu k jiné pojišťovně ho často ztratíte, ale můžete vyjednat zachování. Využijte sezónní slevy (leden, únor). Kombinujte povinné ručení s havarijkem u jedné pojišťovny pro balíčkovou slevu. A hlavně — srovnávejte každý rok, loajalita se u pojišťoven nevyplácí.</p>

<h2>Časté chyby</h2>
<p>Nejčastější chybou je podpojištění — uvedení nižší hodnoty vozu sníží pojistné, ale při totální škodě dostanete méně. Druhá častá chyba je opomenutí připojištění čelního skla — výměna stojí 8 000–25 000 Kč, připojištění 200–500 Kč ročně.</p>`,
  },
  {
    title: "CarMakléř spouští AI asistenta pro makléře",
    slug: "carmakler-spousti-ai-asistenta-pro-maklere",
    categorySlug: "carmakler-novinky",
    tagSlugs: [],
    excerpt: "Představujeme nového AI asistenta v makléřské aplikaci — pomůže s popisky, cenovými odhady a komunikací s klienty.",
    readTime: 4,
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=675&fit=crop",
    seoTitle: "CarMakléř AI asistent — nová funkce pro makléře | CarMakléř",
    seoDescription: "CarMakléř představuje AI asistenta pro automobilové makléře. Generování popisků, cenové odhady a automatizace komunikace.",
    views: 1580,
    publishedDaysAgo: 3,
    content: `<h2>AI, který rozumí autům</h2>
<p>S radostí oznamujeme spuštění AI asistenta přímo v makléřské aplikaci CarMakléř. Nový nástroj využívá pokročilý jazykový model Claude od Anthropic, speciálně vyladěný pro automobilový trh.</p>

<h2>Co AI asistent umí</h2>
<p>Asistent pomáhá makléřům v několika klíčových oblastech. Generuje profesionální popisky vozidel na základě fotografií a technických dat. Odhaduje tržní cenu vozu na základě stavu, výbavy a aktuálních dat z trhu. Navrhuje odpovědi na dotazy klientů a pomáhá s vyjednáváním.</p>

<h3>Klíčové funkce</h3>
<ul>
<li>Generování popisků — stačí nahrát fotky a zadat základní údaje</li>
<li>Cenový odhad — AI analyzuje srovnatelné nabídky na trhu</li>
<li>Komunikační šablony — profesionální odpovědi na časté dotazy</li>
<li>VIN dekódování — automatické rozpoznání modelu a výbavy</li>
</ul>

<h2>Jak začít</h2>
<p>AI asistent je dostupný všem makléřům od úrovně ⭐⭐ v sekci „AI asistent" v hlavním menu aplikace. Makléři na úrovni ⭐ mohou využít omezenou verzi s 10 dotazy denně.</p>

<h2>Co chystáme dál</h2>
<p>V příštích měsících přidáme automatické rozpoznávání závad z fotografií, predikci doby prodeje a integraci s komunikačními kanály (WhatsApp, email). Vaše zpětná vazba nám pomůže AI dále vylepšovat.</p>`,
  },
  {
    title: "Financování ojetého auta: leasing, úvěr nebo hotovost?",
    slug: "financovani-ojeteho-auta-leasing-uver-hotovost",
    categorySlug: "rady-a-tipy",
    tagSlugs: ["financovani", "ojetiny"],
    excerpt: "Srovnání tří způsobů financování ojetiny. Kdy se vyplatí leasing, kdy úvěr a kdy platit cash?",
    readTime: 7,
    coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=675&fit=crop",
    seoTitle: "Financování ojetého auta 2026 — leasing vs úvěr vs hotovost | CarMakléř",
    seoDescription: "Kompletní srovnání způsobů financování ojetiny. Leasing, autoúvěr, spotřebitelský úvěr a platba v hotovosti — výhody a nevýhody.",
    views: 3450,
    publishedDaysAgo: 42,
    content: `<h2>Tři cesty ke stejnému cíli</h2>
<p>Při koupi ojetého auta máte v zásadě tři možnosti financování: leasing (operativní nebo finanční), úvěr (autoúvěr nebo spotřebitelský) a platba v hotovosti. Každá varianta má své výhody a nevýhody — a správná volba závisí na vaší konkrétní situaci.</p>

<h2>Platba v hotovosti</h2>
<p>Nejjednodušší a nejlevnější varianta. Neplatíte žádné úroky, pojištění není podmínkou financující instituce a auto je okamžitě vaše. Nevýhodou je jednorázové zatížení rozpočtu. Vyplatí se u aut do 300 000 Kč, kde úroky z úvěru tvoří nezanedbatelnou část ceny.</p>

<h2>Autoúvěr</h2>
<p>Banky a leasingové společnosti nabízejí účelové úvěry na auto s úroky od 4,9 % p.a. Auto slouží jako zástava, což snižuje úrok oproti spotřebitelskému úvěru. Typická doba splácení je 36–72 měsíců. Výhoda: auto je od začátku psané na vás.</p>

<h3>Na co si dát pozor u úvěru</h3>
<ul>
<li>RPSN (roční procentní sazba nákladů) — porovnávejte RPSN, ne jen úrokovou sazbu</li>
<li>Poplatky za předčasné splacení — některé banky účtují až 1 % z nesplacené jistiny</li>
<li>Podmínka havarijního pojištění — může zvýšit celkové náklady o 10 000–20 000 Kč ročně</li>
<li>Akontace — obvykle 10–30 % z ceny vozu</li>
</ul>

<h2>Leasing</h2>
<p>Finanční leasing se u ojetin používá méně často, ale má smysl u dražších vozů pro OSVČ a firmy díky daňové uznatelnosti. Operativní leasing u ojetin prakticky neexistuje. Pozor — během leasingu je auto majetkem leasingové společnosti.</p>

<h2>Doporučení</h2>
<p>Do 200 000 Kč → hotovost. 200 000–500 000 Kč → hotovost nebo krátký úvěr (24–36 měsíců). Nad 500 000 Kč → autoúvěr s rozumnou akontací (20–30 %). OSVČ/firma → zvažte finanční leasing pro daňovou optimalizaci. A hlavně — nikdy si neberte auto na spotřebitelský úvěr s úrokem nad 10 % p.a.</p>`,
  },
];

async function main() {
  console.log("🌱 Seeding blog data...\n");

  // --- Categories ---
  console.log("📁 Categories:");
  for (const cat of categories) {
    await prisma.articleCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, description: cat.description },
      create: cat,
    });
    console.log(`  ✓ ${cat.icon} ${cat.name}`);
  }

  // --- Tags ---
  console.log("\n🏷️  Tags:");
  for (const tag of tags) {
    await prisma.articleTag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    });
    console.log(`  ✓ ${tag.name}`);
  }

  // --- Author ---
  let author = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!author) {
    author = await prisma.user.findFirst({
      where: { role: "BROKER" },
      select: { id: true, firstName: true, lastName: true },
    });
  }
  if (!author) {
    author = await prisma.user.findFirst({
      select: { id: true, firstName: true, lastName: true },
    });
  }
  if (!author) {
    console.log("\n⚠ No users found — skipping articles.");
    await prisma.$disconnect();
    return;
  }
  console.log(`\n👤 Author: ${author.firstName} ${author.lastName}`);

  // --- Articles ---
  console.log("\n📝 Articles:");
  const now = Date.now();

  for (const a of articles) {
    const category = await prisma.articleCategory.findUnique({
      where: { slug: a.categorySlug },
    });
    if (!category) {
      console.log(`  ⚠ Category "${a.categorySlug}" not found — skipping "${a.title}"`);
      continue;
    }

    const existing = await prisma.article.findUnique({
      where: { slug: a.slug },
      select: { id: true },
    });
    if (existing) {
      console.log(`  ⏭ "${a.title}" already exists`);
      continue;
    }

    const publishedAt = new Date(now - a.publishedDaysAgo * 86400000);

    const article = await prisma.article.create({
      data: {
        title: a.title,
        slug: a.slug,
        content: a.content,
        excerpt: a.excerpt,
        coverImage: a.coverImage,
        readTime: a.readTime,
        seoTitle: a.seoTitle,
        seoDescription: a.seoDescription,
        categoryId: category.id,
        authorId: author.id,
        status: "PUBLISHED",
        publishedAt,
        views: a.views,
      },
    });

    // Link tags
    if (a.tagSlugs.length > 0) {
      const tagRecords = await Promise.all(
        a.tagSlugs.map((slug) =>
          prisma.articleTag.findUnique({ where: { slug }, select: { id: true } })
        )
      );
      const validTagIds = tagRecords
        .filter((t): t is { id: string } => t !== null)
        .map((t) => t.id);

      if (validTagIds.length > 0) {
        await prisma.articleTagLink.createMany({
          data: validTagIds.map((tagId) => ({ articleId: article.id, tagId })),
          skipDuplicates: true,
        });
      }
    }

    console.log(`  ✓ "${a.title}" (${a.tagSlugs.join(", ") || "no tags"})`);
  }

  console.log("\n✅ Blog seed complete!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
