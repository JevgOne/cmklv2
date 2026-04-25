import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://zen@localhost:5432/carmakler";
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

const sampleArticles = [
  {
    title: "Jak správně vybrat ojetinu v roce 2026",
    slug: "jak-spravne-vybrat-ojetinu-v-roce-2026",
    categorySlug: "rady-a-tipy",
    excerpt: "Kompletní průvodce nákupem ojetého vozu — na co si dát pozor, jak prověřit historii a kdy raději odejít.",
    readTime: 7,
    seoTitle: "Jak vybrat ojetinu 2026 — kompletní průvodce | CarMakléř",
    seoDescription: "Praktický průvodce výběrem ojetého auta v roce 2026. Tipy na prověření historie, kontrolu stavu a vyjednávání ceny.",
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
    excerpt: "Testovali jsme novou Škodu Superb čtvrté generace. Jak si vedla na českých silnicích?",
    readTime: 9,
    seoTitle: "Škoda Superb 4 recenze 2026 — test a první dojmy | CarMakléř",
    seoDescription: "Detailní recenze nové Škody Superb 4. generace. Test na českých silnicích, spotřeba, výbava a srovnání s konkurencí.",
    content: `<h2>Nová éra vlajkové lodi</h2>
<p>Škoda Superb čtvrté generace přišla na trh s ambicí redefinovat, co může česká automobilka nabídnout ve vyšší střední třídě. Po týdnu intenzivního testování můžeme říct: mise splněna, i když s drobnými výhradami.</p>

<h2>Design a zpracování</h2>
<p>Nový Superb je vizuálně výrazně odlišný od předchůdce. Ostřejší linie, nový světelný podpis a propracované detaily dávají autu prémiový vzhled. Interiér překvapí kvalitou materiálů — měkké plasty, prošívané sedačky a minimalistická palubní deska s 13" displejem infotainmentu.</p>
<p>Zavazadlový prostor zůstává královskou disciplínou — 645 litrů v základu, až 1 800 se sklopenými sedadly. To je o 20 litrů více než u předchůdce.</p>

<h2>Motorizace a jízdní vlastnosti</h2>
<p>Testovali jsme verzi 2.0 TDI EVO s výkonem 150 koní a 7stupňovým DSG. Motor je kultivovaný, tichý a překvapivě úsporný — průměrná spotřeba na našem testu činila 5,2 l/100 km, přičemž na dálnici jsme se dostali na 5,8 l/100 km.</p>

<h3>Jízdní komfort</h3>
<p>Podvozek s adaptivními tlumiči (příplatkový DCC) skvěle filtruje nerovnosti. Na českých silnicích, které nejsou vždy v nejlepším stavu, je to znát. Řízení je přesné, ale ne příliš sportovní — Superb je komfortní cestovní vůz a tomu odpovídá naladění.</p>

<h2>Technologie</h2>
<p>Head-up displej, matrix LED světlomety, 3-zónová klimatizace a celá řada asistentů jsou dostupné již ve výbavě Selection. Infotainment běží svižně a konečně podporuje bezdrátový Android Auto i Apple CarPlay bez výpadků.</p>

<h2>Ceny a konkurence</h2>
<p>Základní cena startuje na 899 900 Kč za verzi 1.5 TSI Selection. Testovaná verze 2.0 TDI v plné výbavě L&K vyjde na 1 249 900 Kč. Ve srovnání s VW Passatem (který sdílí platformu) nabízí Superb více prostoru za nižší cenu. Oproti Toyotě Camry zase lepší jízdní dynamiku.</p>

<h2>Verdikt</h2>
<p>Škoda Superb 4 je nejlepší Superb, jaký kdy vznikl. Nabízí prémiový komfort, obrovský prostor a rozumnou spotřebu. Pokud hledáte rodinný vůz nebo komfortního dálničního cruisera, Superb by měl být na vašem short listu. Body strháváme za příplatkovou výbavu, která může cenu vyšroubovat nad 1,3 milionu.</p>

<p><strong>Hodnocení: 8,5/10</strong></p>`,
  },
  {
    title: "Trh s ojetinami v ČR: trendy a predikce",
    slug: "trh-s-ojetinami-v-cr-trendy-a-predikce",
    categorySlug: "trzni-analyzy",
    excerpt: "Analýza aktuálního stavu trhu s ojetými vozy v České republice — co ovlivňuje ceny a kam směřují trendy.",
    readTime: 6,
    seoTitle: "Trh s ojetinami ČR 2026 — trendy, ceny, predikce | CarMakléř",
    seoDescription: "Podrobná analýza českého trhu s ojetinami v roce 2026. Vývoj cen, nejprodávanější modely a výhled do budoucna.",
    content: `<h2>Stav trhu na začátku roku 2026</h2>
<p>Český trh s ojetými vozidly zaznamenal v prvním čtvrtletí roku 2026 meziroční nárůst transakcí o 8,3 %. Převody vozidel na registrech dosáhly 187 000 za Q1, což je nejvyšší číslo od roku 2019. Trh se zotavuje z post-covidového období a cenové korekce, která probíhala celý rok 2025.</p>

<h2>Vývoj cen</h2>
<p>Průměrná cena ojetého vozidla v ČR činí aktuálně 289 000 Kč, což představuje pokles o 4,2 % oproti vrcholu z konce roku 2024. Nejvýrazněji klesly ceny u vozů starších 10 let (−7,1 %), zatímco mladé ojetiny do 3 let si drží hodnotu díky stále omezenému přísunu nových aut do trhu.</p>

<h3>Nejprodávanější značky ojetin v ČR</h3>
<ul>
<li>Škoda — 31,2 % podíl (dominance Octavia, Fabia, Superb)</li>
<li>Volkswagen — 12,8 % (Golf, Passat, Tiguan)</li>
<li>Ford — 7,4 % (Focus, Mondeo)</li>
<li>Hyundai — 6,9 % (i30, Tucson)</li>
<li>Toyota — 5,1 % (Yaris, Corolla, RAV4)</li>
</ul>

<h2>Elektromobily na trhu ojetin</h2>
<p>Podíl elektrických vozů na trhu ojetin roste, ale zůstává marginální — 2,3 % všech transakcí. Hlavní brzdou je nejistota ohledně stavu baterií a absence standardizovaného „battery health" certifikátu. Průměrná cena ojetého elektromobilu je 420 000 Kč, přičemž nejžádanější jsou Tesla Model 3 a Škoda Enyaq.</p>

<h2>Dovozy ze zahraničí</h2>
<p>Dovozy tvoří 18,4 % trhu, přičemž dominuje Německo (62 %), následované Rakouskem (11 %) a nově Dubajem (4,2 %). Právě dovozy z Dubaje zaznamenaly meziročně nárůst o 340 %, a to díky příznivým cenám prémiových vozů a rostoucí síti specializovaných dovozců.</p>

<h2>Predikce pro zbytek roku 2026</h2>
<p>Očekáváme pokračující mírný pokles cen u starších ojetin (−3 až −5 % do konce roku) a stabilizaci u mladých ojetin. Podíl elektromobilů by měl vzrůst na 3,5–4 % díky prvním leasingovým návratům Enyaqů a Modelů 3 z let 2023–2024. Dovozy z Dubaje budou nadále růst, ale regulace EU (nové celní poplatky od Q3) mohou tempo zpomalit.</p>

<h2>Co to znamená pro kupující</h2>
<p>Pro kupující je aktuální situace příznivá — ceny klesají, výběr roste a online nástroje pro prověření vozu jsou dostupnější než kdy dřív. Doporučujeme neodkládat nákup u mladých ojetin, kde se ceny stabilizují, a naopak vyčkat u starších vozů, kde je prostor pro další pokles.</p>`,
  },
];

async function main() {
  console.log("🌱 Seeding blog categories...");

  for (const cat of categories) {
    await prisma.articleCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, description: cat.description },
      create: cat,
    });
    console.log(`  ✓ ${cat.icon} ${cat.name}`);
  }

  console.log("\n📝 Creating sample articles...");

  // Get first admin user as author
  let author = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!author) {
    author = await prisma.user.findFirst({
      select: { id: true, firstName: true, lastName: true },
    });
  }

  if (!author) {
    console.log("  ⚠ No users found, skipping sample articles");
    return;
  }

  console.log(`  Using author: ${author.firstName} ${author.lastName}`);

  for (const article of sampleArticles) {
    const category = await prisma.articleCategory.findUnique({
      where: { slug: article.categorySlug },
    });

    if (!category) {
      console.log(`  ⚠ Category ${article.categorySlug} not found, skipping ${article.title}`);
      continue;
    }

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        readTime: article.readTime,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        categoryId: category.id,
      },
      create: {
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        readTime: article.readTime,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        categoryId: category.id,
        authorId: author.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
        views: Math.floor(Math.random() * 500) + 50,
      },
    });
    console.log(`  ✓ ${article.title}`);
  }

  console.log("\n✅ Blog seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
