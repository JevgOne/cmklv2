import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/components/web/FAQ";
import { pageCanonical } from "@/lib/canonical";
import {
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  generateArticleJsonLd,
  generateHowToJsonLd,
} from "@/lib/seo";
import { BASE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Jak prodat auto v roce 2026 | Kompletní průvodce — CarMakler",
  description:
    "Kompletní průvodce prodejem auta v roce 2026. Příprava vozu, stanovení ceny, inzerce, fotografie, prohlídky, smlouva a daňové povinnosti.",
  openGraph: {
    title: "Jak prodat auto — kompletní průvodce 2026",
    description:
      "7 kroků k úspěšnému prodeji auta. Od přípravy vozu po daňové přiznání.",
  },
  alternates: pageCanonical("/jak-prodat-auto"),
};

const faqItems = [
  {
    question: "Jak dlouho trvá prodej auta?",
    answer:
      "Průměrná doba prodeje ojetého auta je 2-6 týdnů. S makléřem CarMakler se doba zkracuje na 1-3 týdny díky profesionální prezentaci a síti kontaktů.",
  },
  {
    question: "Musím platit daň z prodeje auta?",
    answer:
      "Pokud vlastníte auto déle než 1 rok (od 2025 prodlouženo z 5 let), příjem z prodeje je osvobozen od daně. Při kratší době vlastnictví se příjem daní jako ostatní příjem.",
  },
  {
    question: "Co potřebuji k prodeji auta?",
    answer:
      "Velký a malý technický průkaz, platné STK a emisní kontrolu, servisní knížku (pokud máte), klíče (všechny sady) a doklad totožnosti.",
  },
  {
    question: "Jak stanovit správnou cenu ojetého auta?",
    answer:
      "Porovnejte ceny podobných vozidel na inzertních portálech, využijte online kalkulačky nebo nechte auto ocenit makléřem CarMakler zdarma.",
  },
  {
    question: "Je bezpečné prodávat auto přes makléře?",
    answer:
      "Ano, prodej přes ověřeného makléře CarMakler je bezpečný. Makléř zajistí kupní smlouvu, ověří kupujícího a dohlédne na bezpečnou platbu.",
  },
];

const howToSteps = [
  {
    name: "Příprava vozidla",
    text: "Vyčistěte auto zvenku i zevnitř. Odstraňte osobní věci, doplňte provozní kapaliny. Nechte auto umýt včetně interiéru a motorového prostoru.",
  },
  {
    name: "Stanovení ceny",
    text: "Zjistěte aktuální tržní cenu porovnáním s podobnými vozy na inzertních portálech. Využijte kalkulačku CarMakler nebo nechte auto ocenit makléřem zdarma.",
  },
  {
    name: "Inzerce a prezentace",
    text: "Vytvořte kvalitní inzerát s detailním popisem a profesionálními fotografiemi. Na CarMakler můžete vložit inzerát zdarma nebo využít služeb makléře.",
  },
  {
    name: "Kvalitní fotografie",
    text: "Foťte za denního světla, z více úhlů. Zahrňte exteriér ze všech stran, interiér, palubní desku, motor a detaily opotřebení. Minimum 15 fotografií.",
  },
  {
    name: "Prohlídky a komunikace",
    text: "Buďte vstřícní k zájemcům, odpovídejte rychle. Při prohlídce buďte upřímní ohledně stavu vozu. Umožněte zkušební jízdu s vaší přítomností.",
  },
  {
    name: "Kupní smlouva",
    text: "Použijte písemnou kupní smlouvu s identifikací obou stran, popisem vozu, cenou a stavem tachometru. Nejbezpečnější je nechat smlouvu připravit makléřem.",
  },
  {
    name: "Daně a administrativa",
    text: "Zajistěte přepis na registru vozidel do 10 dnů. Pokud vlastníte auto méně než 1 rok, příjem z prodeje musíte uvést v daňovém přiznání.",
  },
];

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Domů", url: BASE_URL },
  { name: "Jak prodat auto", url: `${BASE_URL}/jak-prodat-auto` },
]);

const faqJsonLd = generateFaqJsonLd(faqItems);

const articleJsonLd = generateArticleJsonLd({
  headline: "Jak prodat auto v roce 2026 — kompletní průvodce",
  description: "Kompletní průvodce prodejem auta. 7 kroků od přípravy vozu po daňové povinnosti.",
  url: `${BASE_URL}/jak-prodat-auto`,
  datePublished: "2026-01-15",
  dateModified: "2026-03-20",
});

const howToJsonLd = generateHowToJsonLd({
  name: "Jak prodat auto",
  description: "Kompletní průvodce prodejem ojetého automobilu v České republice.",
  steps: howToSteps,
});

export default function JakProdatAutoPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: howToJsonLd }} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-1.5 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-orange-500 transition-colors no-underline text-gray-500">Domů</Link></li>
            <li className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <span className="text-gray-900 font-medium">Jak prodat auto</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900">
            Jak prodat auto — kompletní průvodce 2026
          </h1>
          <p className="text-lg text-gray-500 mt-3 max-w-2xl">
            7 kroků k úspěšnému prodeji vašeho vozidla. Od přípravy až po daňové povinnosti.
          </p>
        </div>
      </section>

      {/* Chapters */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {howToSteps.map((step, index) => (
          <article key={index} className="mb-12">
            <div className="flex items-start gap-4 mb-4">
              <span className="flex-shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                {index + 1}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 pt-1">
                {step.name}
              </h2>
            </div>
            <div className="ml-14 prose prose-gray prose-p:text-gray-600 prose-p:leading-relaxed">
              <p>{step.text}</p>
              {index === 0 && (
                <p>
                  Profesionální příprava vozu může zvýšit prodejní cenu o 5-15 %. Investice do detailního
                  mytí (1 500-3 000 Kč) se vám vrátí mnohonásobně. Drobné opravy — výměna žárovek,
                  stěračů nebo oprava drobných škrábanců — rovněž zvyšují hodnotu vozu v očích kupujícího.
                  Připravte si veškerou dokumentaci: velký a malý technický průkaz, servisní knížku,
                  faktury za opravy a všechny sady klíčů.
                </p>
              )}
              {index === 1 && (
                <p>
                  Správná cena je klíčová pro rychlý prodej. Příliš vysoká cena odradí zájemce,
                  příliš nízká znamená ztrátu peněz. Na CarMakler nabízíme bezplatné ocenění vozu
                  ověřeným makléřem, který zná aktuální tržní ceny ve vašem regionu.
                  Makléř zohlední značku, model, rok, nájezd, výbavu a celkový stav vozu.
                </p>
              )}
              {index === 2 && (
                <p>
                  Kvalitní inzerát obsahuje: kompletní specifikace vozu, historii servisu a oprav,
                  informaci o STK a emisích, výbavu a příslušenství, a samozřejmě kvalitní fotografie.
                  Na CarMakler můžete vložit inzerát zdarma nebo využít služeb ověřeného makléře,
                  který vytvoří profesionální prezentaci a zajistí propagaci vašeho vozu.
                </p>
              )}
              {index === 3 && (
                <p>
                  Fotografie jsou nejdůležitější součástí inzerátu. Foťte za denního světla, nejlépe
                  v podvečer pro měkké světlo. Vůz by měl být čistý a na neutrálním pozadí.
                  Zahrňte: celkový pohled ze 4 stran, detail přední a zadní části, interiér z obou stran,
                  palubní desku, motor, kufr, disky a pneumatiky, a případné poškození.
                </p>
              )}
              {index === 4 && (
                <p>
                  Při prohlídkách buďte profesionální a upřímní. Přiznání drobných nedostatků buduje
                  důvěru. Připravte si odpovědi na časté otázky: důvod prodeje, historie oprav,
                  spotřeba paliva. Umožněte zkušební jízdu — je to standard a odmítnutí budí podezření.
                  Pro maximální bezpečnost doporučujeme prohlídky přes ověřeného makléře.
                </p>
              )}
              {index === 5 && (
                <p>
                  Kupní smlouva musí obsahovat: identifikaci prodávajícího a kupujícího (jméno, adresa,
                  rodné číslo/IČO), identifikaci vozidla (VIN, SPZ, značka, model, rok), kupní cenu
                  slovem i číslem, stav tachometru, prohlášení o známých vadách a podpisy obou stran.
                  Ověřený makléř CarMakler připraví právně bezchybnou smlouvu.
                </p>
              )}
              {index === 6 && (
                <p>
                  Od roku 2025 platí nová pravidla: příjem z prodeje auta je osvobozen od daně,
                  pokud jste auto vlastnili déle než 1 rok (dříve 5 let). Při kratší době vlastnictví
                  se příjem daní jako ostatní příjem se sazbou 15 % (23 % nad 1 935 552 Kč). Přepis
                  na registru vozidel musíte provést do 10 dnů od prodeje. Správní poplatek je 800 Kč.
                </p>
              )}
            </div>

            {/* CTA after each chapter */}
            <div className="ml-14 mt-6">
              <Link
                href="/chci-prodat"
                className="inline-flex items-center gap-2 py-2.5 px-5 bg-orange-50 text-orange-600 font-semibold rounded-full hover:bg-orange-100 transition-colors no-underline text-sm"
              >
                Chci prodat auto s makléřem
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FAQ items={faqItems} variant="divider" title="Často kladené otázky" />
      </div>

      {/* Související články a nástroje */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Související články a nástroje
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/kolik-stoji-moje-auto" className="inline-flex items-center py-2.5 px-5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline">
            Ocenění vozidla
          </Link>
          <Link href="/sluzby/proverka" className="inline-flex items-center py-2.5 px-5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline">
            Prověrka vozidla
          </Link>
          <Link href="/sluzby/financovani" className="inline-flex items-center py-2.5 px-5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline">
            Financování
          </Link>
          <Link href="/nabidka" className="inline-flex items-center py-2.5 px-5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline">
            Katalog ojetých vozidel
          </Link>
          <Link href="/makleri" className="inline-flex items-center py-2.5 px-5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline">
            Najít makléře
          </Link>
          <Link href="/sluzby/pojisteni" className="inline-flex items-center py-2.5 px-5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-orange-50 hover:text-orange-600 transition-colors no-underline">
            Pojištění vozidla
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Nechcete se o nic starat?
            </h2>
            <p className="text-orange-100 mb-8 text-lg">
              Ověřený makléř CarMakler prodá vaše auto za vás. Kompletní servis od ocenění po přepis.
            </p>
            <Link
              href="/chci-prodat"
              className="inline-flex items-center gap-2 py-4 px-8 bg-white text-orange-600 font-bold rounded-full shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 no-underline text-[17px]"
            >
              Prodat auto s makléřem
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
