import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";
import { pageCanonical } from "@/lib/canonical";

export const revalidate = 3600; // ISR: 1 hodina

export const metadata: Metadata = {
  title: "Jak to funguje",
  description:
    "Zjistěte, jak funguje CarMakléř — prodej auta přes makléře, nákup prověřených ojetin, e-shop s autodíly a investiční marketplace.",
  openGraph: {
    title: "Jak to funguje | CarMakléř",
    description:
      "Zjistěte, jak funguje CarMakléř — prodej auta přes makléře, nákup prověřených ojetin, e-shop s autodíly a investiční marketplace.",
  },
  alternates: pageCanonical("/jak-to-funguje"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Jak to funguje — CarMakléř",
  url: `${BASE_URL}/jak-to-funguje`,
  description:
    "Zjistěte, jak funguje CarMakléř — prodej auta přes makléře, nákup prověřených ojetin, e-shop s autodíly.",
  isPartOf: {
    "@type": "WebSite",
    name: "CarMakléř",
    url: BASE_URL,
  },
};

const sellingSteps = [
  {
    number: 1,
    icon: "📝",
    title: "Řeknete nám o autě",
    description: "Vyplníte krátký formulář — značka, model, rok výroby, stav. Trvá to minutu.",
  },
  {
    number: 2,
    icon: "📞",
    title: "Makléř se ozve do 30 minut",
    description:
      "Přiřadíme vám certifikovaného makléře ve vašem okolí. Dohodne si prohlídku vozu.",
  },
  {
    number: 3,
    icon: "📸",
    title: "Makléř zajistí vše",
    description:
      "Profesionální fotky, atraktivní popis, inzerce na Sauto, TipCars, Facebook a dalších portálech.",
  },
  {
    number: 4,
    icon: "🎉",
    title: "Vy jen podepíšete a inkasujete",
    description:
      "Makléř domluví prohlídky, připraví kupní smlouvu a zajistí přepis na úřadě. Hotovo.",
  },
];

const buyingSteps = [
  {
    number: 1,
    icon: "🔍",
    title: "Vyberte si z prověřených aut",
    description: "V katalogu najdete vozidla s kompletní historií — nehody, stočení km, zástavy, servis.",
  },
  {
    number: 2,
    icon: "✅",
    title: "Zkontrolujeme ho za vás",
    description:
      "Každé auto od makléře prochází prověrkou VIN, technického stavu a právní čistoty.",
  },
  {
    number: 3,
    icon: "🤝",
    title: "Makléř vás provede celým nákupem",
    description:
      "Od prohlídky přes financování a pojištění až po kupní smlouvu a přepis na úřadě.",
  },
];

const partsSteps = [
  {
    number: 1,
    icon: "🔧",
    title: "Najděte díl podle vozu",
    description: "Zadejte značku, model nebo VIN a najděte kompatibilní díly.",
  },
  {
    number: 2,
    icon: "🛒",
    title: "Objednejte online",
    description:
      "Nové i použité díly z vrakovišť. Přidejte do košíku a zvolte dopravu.",
  },
  {
    number: 3,
    icon: "📦",
    title: "Doručení domů",
    description:
      "Díly doručíme přes Zásilkovnu, PPL nebo Českou poštu. Záruka 12–24 měsíců.",
  },
];

export default function JakToFungujePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Jak to funguje" },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Jak to funguje
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Pomáháme lidem prodat auto za nejvyšší cenu a koupit bezpečně. Váš makléř se postará o všechno — vy nemusíte řešit nic.
          </p>
        </div>

        {/* Sekce 1: Prodej auta přes makléře */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            Chci prodat auto
          </h2>
          <p className="text-gray-500 mb-8">
            Proč se trápit s inzerováním, odpovídáním na dotazy a běháním po úřadech? Váš makléř zajistí profesionální fotky, inzerci na všech portálech, prohlídky se zájemci, kupní smlouvu i přepis. Vy jen podepíšete a inkasujete. Provize 5 % z prodejní ceny — a to jen při úspěšném prodeji.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sellingSteps.map((step) => (
              <Card key={step.number} className="p-6 text-center">
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="text-xs font-bold text-orange-500 mb-1">
                  Krok {step.number}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/chci-prodat"
              className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 no-underline"
            >
              Chci prodat auto
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>

        {/* Sekce 2: Nákup prověřeného auta */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            Chci koupit auto bezpečně
          </h2>
          <p className="text-gray-500 mb-8">
            Kupovat ojeté auto naslepo je risk. U nás má každé vozidlo prověřenou historii — nehody, stočení km, zástavy, servisní záznamy. Makléř vás provede od výběru po přepis.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {buyingSteps.map((step) => (
              <Card key={step.number} className="p-6 text-center">
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="text-xs font-bold text-orange-500 mb-1">
                  Krok {step.number}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/nabidka"
              className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 no-underline"
            >
              Prohlédnout nabídku vozidel
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>

        {/* Sekce 3: E-shop s autodíly */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            E-shop s autodíly
          </h2>
          <p className="text-gray-500 mb-8">
            Nové aftermarket díly i použité originální díly z vrakovišť. Hledejte podle
            vozu nebo VIN — garantujeme kompatibilitu.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {partsSteps.map((step) => (
              <Card key={step.number} className="p-6 text-center">
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="text-xs font-bold text-orange-500 mb-1">
                  Krok {step.number}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/dily/katalog"
              className="inline-flex items-center gap-2 text-orange-600 font-semibold hover:text-orange-700 no-underline"
            >
              Prohlédnout autodíly
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </section>

        {/* Related links */}
        <section className="mb-16">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6 text-center">
            Další užitečné stránky
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/makleri" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Najít makléře ve vašem městě
            </Link>
            <Link href="/sluzby/proverka" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Prověrka vozidla
            </Link>
            <Link href="/sluzby/financovani" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Financování na míru
            </Link>
            <Link href="/sluzby/pojisteni" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Pojištění vozidla
            </Link>
            <Link href="/jak-prodat-auto" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Kompletní průvodce prodejem
            </Link>
            <Link href="/recenze" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Recenze klientů
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-orange-50 border border-orange-200 rounded-2xl p-8 md:p-10 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
            Máte otázky? Ozvěte se nám.
          </h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Rádi vám poradíme s prodejem, nákupem nebo čímkoliv kolem auta. Volejte, pište, nebo vyplňte formulář.
          </p>
          <Link
            href="/kontakt"
            className="inline-block bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors no-underline"
          >
            Kontaktovat nás
          </Link>
        </section>
      </div>
    </>
  );
}
