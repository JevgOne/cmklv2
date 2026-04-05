import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";

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
  alternates: {
    canonical: `${BASE_URL}/jak-to-funguje`,
  },
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
    title: "Vyplňte formulář",
    description: "Zadejte základní údaje o voze — značku, model, rok a stav.",
  },
  {
    number: 2,
    icon: "📞",
    title: "Makléř vás kontaktuje",
    description:
      "Do 30 minut se vám ozve certifikovaný makléř a dohodne si prohlídku.",
  },
  {
    number: 3,
    icon: "📸",
    title: "Profesionální prezentace",
    description:
      "Makléř nafotí auto, vytvoří inzerát a zveřejní ho na všech portálech.",
  },
  {
    number: 4,
    icon: "🎉",
    title: "Auto je prodané",
    description:
      "Makléř zajistí prohlídky, kupní smlouvu i přepis na dopravním úřadě.",
  },
];

const buyingSteps = [
  {
    number: 1,
    icon: "🔍",
    title: "Prohlédněte si nabídku",
    description: "V katalogu najdete prověřená vozidla od makléřů i soukromých prodejců.",
  },
  {
    number: 2,
    icon: "✅",
    title: "Prověřené auto",
    description:
      "Každé auto od makléře má prověřenou historii, VIN kontrolu a hodnocení důvěryhodnosti.",
  },
  {
    number: 3,
    icon: "🤝",
    title: "Bezpečný nákup",
    description:
      "Makléř vás provede celým procesem — od prohlídky po převod vlastnictví.",
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
            CarMakléř je ekosystém pro prodej a nákup vozidel i autodílů.
            Vyberte si službu, která vás zajímá.
          </p>
        </div>

        {/* Sekce 1: Prodej auta přes makléře */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            Prodej auta přes makléře
          </h2>
          <p className="text-gray-500 mb-8">
            Svěřte prodej certifikovanému makléři. Vy nemusíte řešit nic — makléř zajistí vše od
            fotek po přepis. Provize jen 5 % z prodejní ceny.
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
            Nákup prověřeného auta
          </h2>
          <p className="text-gray-500 mb-8">
            V naší nabídce najdete vozidla prověřená makléři i inzeráty od soukromých prodejců
            a autobazarů. Každé auto od makléře má hodnocení důvěryhodnosti.
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

        {/* CTA */}
        <section className="bg-orange-50 border border-orange-200 rounded-2xl p-8 md:p-10 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
            Máte otázky?
          </h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Rádi vám poradíme. Napište nám nebo zavolejte a pomůžeme s prodejem, nákupem
            nebo výběrem dílů.
          </p>
          <Link
            href="/kontakt"
            className="inline-block bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors no-underline"
          >
            Kontaktujte nás
          </Link>
        </section>
      </div>
    </>
  );
}
