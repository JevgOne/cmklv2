/**
 * Seed script: Register all known pages in SeoPageMeta WITH default titles/descriptions.
 *
 * Usage: npx tsx scripts/seed-seo-pages.ts
 *
 * Uses upsert — updates title/description ONLY if currently NULL (never overwrites manual edits).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  BRANDS,
  BODY_TYPES,
  PRICE_RANGES,
  CITIES,
  PARTS_CATEGORIES,
  PARTS_BRANDS,
  PARTS_MODELS_BY_BRAND,
} from "../lib/seo-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface PageDef {
  pagePath: string;
  pageType: string;
  section: string;
  title: string;
  description: string;
  ogTitle?: string;
}

const PAGES: PageDef[] = [
  // ── Home ──
  {
    pagePath: "/",
    pageType: "STATIC",
    section: "home",
    title: "CarMakléř — prodej aut přes ověřené makléře",
    description: "Prodejte auto za nejvyšší cenu přes síť certifikovaných makléřů. Prověřená vozidla, bezpečný nákup, profesionální servis po celé ČR.",
  },

  // ── Vehicles ──
  {
    pagePath: "/nabidka",
    pageType: "DYNAMIC_LIST",
    section: "vehicles",
    title: "Nabídka vozidel — prověřená ojetá auta",
    description: "Prohlédněte si nabídku prověřených ojetých vozidel od ověřených makléřů CarMakléř. Každé auto prochází důkladnou kontrolou.",
  },
  {
    pagePath: "/chci-prodat",
    pageType: "STATIC",
    section: "vehicles",
    title: "Prodat auto za nejvyšší cenu — CarMakléř",
    description: "Prodejte své auto rychle a za férovou cenu. Makléř se postará o vše — fotky, inzerci, prohlídky i papíry. Provize 5 % z prodejní ceny.",
  },
  {
    pagePath: "/nabidka/porovnani",
    pageType: "STATIC",
    section: "vehicles",
    title: "Porovnání vozidel — CarMakléř",
    description: "Porovnejte si vybraná vozidla vedle sebe. Srovnejte parametry, ceny a výbavu na jednom místě.",
  },

  // ── Brokers ──
  {
    pagePath: "/makleri",
    pageType: "DYNAMIC_LIST",
    section: "brokers",
    title: "Ověření automakléři po celé ČR — CarMakléř",
    description: "Najděte ověřeného automakléře ve vašem městě. Profesionální přístup, prověřená vozidla a bezpečný prodej.",
  },
  {
    pagePath: "/pro-maklere",
    pageType: "STATIC",
    section: "brokers",
    title: "Staňte se makléřem CarMakléř",
    description: "Přidejte se k síti profesionálních automakléřů. Získejte přístup k moderním nástrojům, školením a proviznímu systému.",
  },

  // ── Blog ──
  {
    pagePath: "/blog",
    pageType: "DYNAMIC_LIST",
    section: "blog",
    title: "Blog — magazín o autech a prodeji",
    description: "Tipy pro prodej i nákup aut, novinky z automobilového světa a rady od profesionálních makléřů.",
  },

  // ── STK ──
  {
    pagePath: "/stk",
    pageType: "DYNAMIC_LIST",
    section: "stk",
    title: "STK stanice v ČR — termíny a recenze",
    description: "Najděte nejbližší STK stanici, zjistěte otevírací dobu a přečtěte si recenze od ostatních řidičů.",
  },

  // ── Services ──
  {
    pagePath: "/autoservisy",
    pageType: "DYNAMIC_LIST",
    section: "services",
    title: "Autoservisy — ověřené recenze",
    description: "Najděte nejlepší autoservis ve vašem okolí. Ověřené recenze, otevírací doba a kontakty na jednom místě.",
  },
  {
    pagePath: "/sluzby",
    pageType: "STATIC",
    section: "services",
    title: "Služby CarMakléř — kompletní servis",
    description: "Prověrka vozidla, financování, pojištění a další služby pro bezpečný nákup a prodej auta.",
  },
  {
    pagePath: "/sluzby/proverka",
    pageType: "STATIC",
    section: "services",
    title: "Prověrka vozidla — kontrola historie auta",
    description: "Kompletní prověrka historie vozidla — nehody, servisní záznamy, stočený tachometr, zástavy a exekuce.",
  },
  {
    pagePath: "/sluzby/financovani",
    pageType: "STATIC",
    section: "services",
    title: "Financování vozidel — výhodné úvěry",
    description: "Výhodné financování nákupu auta. Porovnejte nabídky bank a leasingových společností na jednom místě.",
  },
  {
    pagePath: "/sluzby/pojisteni",
    pageType: "STATIC",
    section: "services",
    title: "Pojištění vozidel — povinné ručení i havarijní",
    description: "Srovnejte nabídky pojištění aut. Povinné ručení, havarijní pojištění a další produkty od prověřených pojišťoven.",
  },

  // ── Parts ──
  {
    pagePath: "/dily",
    pageType: "DYNAMIC_LIST",
    section: "parts",
    title: "Autodíly — levnější než nové, se zárukou",
    description: "Kvalitní použité i nové autodíly přímo z ověřených vrakovišť. Doručení do 24 hodin, záruka 6 měsíců.",
  },
  {
    pagePath: "/dily/katalog",
    pageType: "DYNAMIC_LIST",
    section: "parts",
    title: "Katalog autodílů — CarMakléř Shop",
    description: "Procházejte kompletní katalog autodílů podle značky, modelu a kategorie. Použité i nové díly se zárukou.",
  },
  {
    pagePath: "/shop",
    pageType: "DYNAMIC_LIST",
    section: "parts",
    title: "Shop autodíly — CarMakléř",
    description: "E-shop s autodíly z ověřených vrakovišť. Motory, převodovky, karoserie a další díly se zárukou 6 měsíců.",
  },
  {
    pagePath: "/shop/katalog",
    pageType: "DYNAMIC_LIST",
    section: "parts",
    title: "Katalog autodílů — CarMakléř Shop",
    description: "Kompletní katalog autodílů. Vyhledávejte podle VIN, značky nebo kategorie. Rychlé doručení po celé ČR.",
  },

  // ── Listings ──
  {
    pagePath: "/inzerce",
    pageType: "STATIC",
    section: "listings",
    title: "Inzerce aut zdarma — vložte inzerát za minutu",
    description: "Podejte inzerát na prodej auta zdarma. Oslovte tisíce kupujících na CarMakléř. Jednoduché vložení, profesionální prezentace.",
  },
  {
    pagePath: "/inzerce/katalog",
    pageType: "DYNAMIC_LIST",
    section: "listings",
    title: "Katalog inzerátů — auta na prodej",
    description: "Prohlédněte si inzeráty na prodej aut od soukromých prodejců a autobazarů. Filtrujte podle značky, ceny a lokality.",
  },

  // ── Marketplace ──
  {
    pagePath: "/marketplace",
    pageType: "STATIC",
    section: "marketplace",
    title: "Marketplace — investiční příležitosti v autech",
    description: "Uzavřená investiční platforma pro flipping aut. Ověření dealeři nabízí příležitosti, investoři financují.",
  },
  {
    pagePath: "/marketplace/apply",
    pageType: "STATIC",
    section: "marketplace",
    title: "Přihláška do Marketplace — CarMakléř",
    description: "Přihlaste se jako investor nebo dealer do uzavřené investiční platformy CarMakléř Marketplace.",
  },

  // ── Info ──
  {
    pagePath: "/kontakt",
    pageType: "STATIC",
    section: "info",
    title: "Kontakt — CarMakléř",
    description: "Kontaktujte nás. Jsme tu pro vás — ať chcete prodat auto, koupit prověřené vozidlo nebo se stát makléřem.",
  },
  {
    pagePath: "/o-nas",
    pageType: "STATIC",
    section: "info",
    title: "O nás — CarMakléř",
    description: "CarMakléř — nová éra prodeje aut v Česku. Ověření makléři, prověřená vozidla, spokojení klienti.",
  },
  {
    pagePath: "/kariera",
    pageType: "STATIC",
    section: "info",
    title: "Kariéra u CarMakléř — pracovní nabídky",
    description: "Přidejte se k týmu CarMakléř. Hledáme motivované lidi, kteří chtějí měnit trh s ojetými auty v Česku.",
  },
  {
    pagePath: "/recenze",
    pageType: "STATIC",
    section: "info",
    title: "Recenze klientů — CarMakléř",
    description: "Přečtěte si zkušenosti klientů s prodejem a nákupem aut přes CarMakléř. Skutečné recenze od skutečných lidí.",
  },
  {
    pagePath: "/cenik",
    pageType: "STATIC",
    section: "info",
    title: "Ceník služeb — CarMakléř",
    description: "Transparentní ceník. Provize 5 % z prodejní ceny (min. 25 000 Kč). Žádné skryté poplatky, platíte jen z úspěšného prodeje.",
  },
  {
    pagePath: "/jak-prodat-auto",
    pageType: "STATIC",
    section: "info",
    title: "Jak prodat auto rychle a za dobrou cenu",
    description: "Kompletní průvodce prodejem auta. Tipy od profesionálních makléřů — jak připravit auto, nastavit cenu a vyřídit přepis.",
  },
  {
    pagePath: "/kolik-stoji-moje-auto",
    pageType: "STATIC",
    section: "info",
    title: "Kolik stojí moje auto — odhad ceny zdarma",
    description: "Zjistěte tržní hodnotu svého auta zdarma. Zadejte základní údaje a náš algoritmus odhadne reálnou prodejní cenu.",
  },
  {
    pagePath: "/jak-to-funguje",
    pageType: "STATIC",
    section: "info",
    title: "Jak to funguje — prodej auta přes makléře",
    description: "Jednoduchý proces ve 3 krocích. Poptáte makléře, on se postará o vše a vy jen podepíšete a inkasujete.",
  },

  // ── Legal ──
  {
    pagePath: "/obchodni-podminky",
    pageType: "STATIC",
    section: "legal",
    title: "Obchodní podmínky — CarMakléř",
    description: "Obchodní podmínky platformy CarMakléř. Pravidla pro prodejce, kupující a makléře.",
    ogTitle: "Obchodní podmínky",
  },
  {
    pagePath: "/ochrana-osobnich-udaju",
    pageType: "STATIC",
    section: "legal",
    title: "Ochrana osobních údajů — CarMakléř",
    description: "Zásady ochrany osobních údajů. Jak zpracováváme a chráníme vaše data na platformě CarMakléř.",
    ogTitle: "Ochrana osobních údajů",
  },
  {
    pagePath: "/zasady-cookies",
    pageType: "STATIC",
    section: "legal",
    title: "Zásady cookies — CarMakléř",
    description: "Informace o používání cookies na webu CarMakléř. Jaké cookies používáme a proč.",
    ogTitle: "Zásady cookies",
  },
  {
    pagePath: "/reklamacni-rad",
    pageType: "STATIC",
    section: "legal",
    title: "Reklamační řád — CarMakléř",
    description: "Reklamační řád platformy CarMakléř. Postup při reklamaci zboží a služeb.",
    ogTitle: "Reklamační řád",
  },
  {
    pagePath: "/shop/vraceni-zbozi",
    pageType: "STATIC",
    section: "legal",
    title: "Vrácení zboží — CarMakléř Shop",
    description: "Informace o vrácení zboží zakoupeného v e-shopu CarMakléř. 14 dní na vrácení bez udání důvodu.",
    ogTitle: "Vrácení zboží",
  },
  {
    pagePath: "/shop/reklamace",
    pageType: "STATIC",
    section: "legal",
    title: "Reklamace — CarMakléř Shop",
    description: "Postup při reklamaci autodílů zakoupených v e-shopu CarMakléř. Záruka 6 měsíců na všechny díly.",
    ogTitle: "Reklamace",
  },

  // ── LP: Brand pages ──
  ...BRANDS.map((b) => ({
    pagePath: `/nabidka/${b.slug}`,
    pageType: "LP",
    section: "vehicles",
    title: `${b.name} — ojetá vozidla | CarMakléř`,
    description: `Prověřená ojetá vozidla ${b.name} od ověřených makléřů. Každé auto prochází kontrolou historie, stavu i dokumentace.`,
  })),

  // ── LP: City pages ──
  ...CITIES.map((c) => ({
    pagePath: `/nabidka/${c.slug}`,
    pageType: "LP",
    section: "vehicles",
    title: `Ojetá auta ${c.name} — prověřená vozidla`,
    description: `Nabídka prověřených ojetých vozidel v okolí ${c.name}. Profesionální makléři, bezpečný nákup i prodej.`,
  })),

  // ── LP: Body types ──
  ...BODY_TYPES.map((bt) => ({
    pagePath: `/nabidka/${bt.slug}`,
    pageType: "LP",
    section: "vehicles",
    title: `${bt.name} — ojetá vozidla | CarMakléř`,
    description: `Prověřená ojetá vozidla typu ${bt.name.toLowerCase()}. Filtrujte podle značky, ceny a dalších parametrů.`,
  })),

  // ── LP: Price ranges ──
  ...PRICE_RANGES.map((pr) => ({
    pagePath: `/nabidka/${pr.slug}`,
    pageType: "LP",
    section: "vehicles",
    title: `Auta ${pr.label} — prověřená vozidla | CarMakléř`,
    description: `Ojetá vozidla v cenové kategorii ${pr.label.toLowerCase()}. Ověřená historie a profesionální makléřský servis.`,
  })),

  // ── LP: Parts categories ──
  ...PARTS_CATEGORIES.map((cat) => ({
    pagePath: `/dily/kategorie/${cat.slug}`,
    pageType: "LP",
    section: "parts",
    title: `${cat.name} — autodíly se zárukou | CarMakléř`,
    description: `Kvalitní ${cat.name.toLowerCase()} pro všechny značky aut. Použité i nové díly z ověřených vrakovišť se zárukou 6 měsíců.`,
  })),

  // ── LP: Parts brands ──
  ...PARTS_BRANDS.map((brand) => ({
    pagePath: `/dily/znacka/${brand.slug}`,
    pageType: "LP",
    section: "parts",
    title: `Díly ${brand.name} — náhradní díly se zárukou`,
    description: `Náhradní díly pro ${brand.name}. Motory, převodovky, karoserie a další díly z ověřených vrakovišť. Doručení do 24h.`,
  })),

  // ── LP: Parts brand+model ──
  ...PARTS_BRANDS.flatMap((brand) =>
    (PARTS_MODELS_BY_BRAND[brand.slug] || []).map((model) => ({
      pagePath: `/dily/znacka/${brand.slug}/${model.slug}`,
      pageType: "LP",
      section: "parts",
      title: `Díly ${brand.name} ${model.name} — náhradní díly`,
      description: `Náhradní díly pro ${brand.name} ${model.name}. Použité i nové díly z ověřených vrakovišť se zárukou 6 měsíců.`,
    })),
  ),
];

async function main() {
  console.log(`Seeding ${PAGES.length} SeoPageMeta records...`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const page of PAGES) {
    const existing = await prisma.seoPageMeta.findUnique({
      where: { pagePath: page.pagePath },
    });

    if (!existing) {
      // New page — create with all data
      await prisma.seoPageMeta.create({ data: page });
      created++;
    } else if (!existing.title && !existing.description) {
      // Existing but empty — fill in defaults
      await prisma.seoPageMeta.update({
        where: { pagePath: page.pagePath },
        data: {
          title: page.title,
          description: page.description,
          ogTitle: page.ogTitle || null,
        },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Done: ${created} created, ${updated} updated (was empty), ${skipped} skipped (already has data).`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
