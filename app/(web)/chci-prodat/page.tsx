import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SellCarForm } from "@/components/web/SellCarForm";
import { FAQ } from "@/components/web/FAQ";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { getBrokerStats } from "@/lib/stats";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Chci prodat auto",
  description:
    "Prodáme vaše auto rychleji a za lepší cenu. Nechte to na ověřeném makléři CarMakléř.",
  openGraph: {
    title: "Prodejte auto přes makléře | CarMakléř",
    description:
      "Prodáme vaše auto rychleji a za lepší cenu. Nechte to na ověřeném makléři CarMakléř.",
  },
  alternates: pageCanonical("/chci-prodat"),
};

const steps = [
  {
    number: 1,
    icon: "📝",
    title: "Vyplňte formulář",
    description: "Stačí pár základních údajů o vašem voze",
  },
  {
    number: 2,
    icon: "📞",
    title: "Makléř vás kontaktuje",
    description: "Do 30 minut se vám ozve ověřený makléř",
  },
  {
    number: 3,
    icon: "🎉",
    title: "Auto je prodané",
    description: "Makléř zajistí vše — od fotek po převod",
  },
];

const benefits = [
  {
    icon: "⏱️",
    title: "Průměrná doba prodeje 20 dní",
    description:
      "Auto prodáme rychleji díky kvalitní inzerci na všech portálech v ČR",
  },
  {
    icon: "💰",
    title: "Férová tržní cena",
    description:
      "Žádné podbízení. Náš makléř prodá auto za maximální reálnou cenu",
  },
  {
    icon: "📸",
    title: "Profesionální inzerce",
    description:
      "Profesionální fotky, popis i umístění na Sauto, TipCars a dalších portálech",
  },
  {
    icon: "🛡️",
    title: "Kompletní servis",
    description:
      "Smlouvy, převod, STK, pojištění — o nic se nemusíte starat",
  },
];

const faqItems = [
  {
    question: "Kolik stojí prodej přes CarMakléř?",
    answer:
      "Provize činí 5 % z prodejní ceny, minimálně 25 000 Kč. Provizi platíte pouze v případě úspěšného prodeje.",
  },
  {
    question: "Jak dlouho trvá prodej auta?",
    answer:
      "Průměrná doba prodeje je 20 dní. Záleží na typu vozidla, ceně a lokalitě.",
  },
  {
    question: "Musím řešit papírování?",
    answer:
      "Ne. Veškerou administrativu — kupní smlouvu, převod na úřadech, odhlášení pojištění — zajistí váš makléř.",
  },
  {
    question: "Můžu si to kdykoliv rozmyslet?",
    answer:
      "Ano. Smlouva s makléřem je nezávazná a můžete ji kdykoliv ukončit bez sankcí.",
  },
  {
    question: "Jak probíhá ocenění vozu?",
    answer:
      "Makléř provede analýzu trhu a navrhne optimální prodejní cenu. Finální cenu vždy odsouhlasíte vy.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export const revalidate = 3600; // 1 hodina

export default async function ChciProdatPage() {
  const stats = await getBrokerStats();
  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-16 md:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Prodat auto přes makléře" },
        ]}
      />
      {/* SECTION 1: Hero */}
      <section className="max-w-6xl mx-auto w-full px-4 pt-8 md:pt-12">
        <div className="bg-orange-50 rounded-2xl p-5 sm:p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-6 sm:gap-8 lg:gap-16">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Prodáme vaše auto{" "}
              <span className="text-orange-500">
                rychleji a za lepší cenu
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Nechte to na našem makléři. Vy se nemusíte o nic starat.
            </p>
            <div className="flex flex-wrap gap-6 md:gap-10">
              <div>
                <div className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  {stats.avgSaleDays > 0 ? `${stats.avgSaleDays} dní` : "–"}
                </div>
                <div className="text-sm text-gray-500">
                  průměrná doba prodeje
                </div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  {stats.soldVehicles > 0 ? stats.soldVehicles.toLocaleString("cs-CZ") : "–"}
                </div>
                <div className="text-sm text-gray-500">prodaných vozidel</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "–"}
                </div>
                <div className="text-sm text-gray-500">hodnocení</div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 hidden lg:flex items-center justify-center w-64 h-64 bg-orange-100 rounded-2xl">
            <span className="text-8xl">🚗</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: Jak to funguje — 3 kroky */}
      <section className="max-w-6xl mx-auto w-full px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-4">
          Jak to funguje
        </h2>
        <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Prodej auta přes CarMakléř je jednoduchý — stačí 3 kroky
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <Card key={step.number} className="p-8 text-center relative">
              <div className="absolute top-4 left-4 text-6xl font-extrabold text-gray-100 select-none">
                {step.number}
              </div>
              <div className="text-4xl mb-4 relative">{step.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 relative">
                {step.title}
              </h3>
              <p className="text-[15px] text-gray-500 relative">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 3: Formulář */}
      <section className="max-w-2xl mx-auto w-full px-4" id="formular">
        <SellCarForm />
      </section>

      {/* SECTION 4: Proč prodat přes CarMakléř */}
      <section className="max-w-6xl mx-auto w-full px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-4">
          Proč prodat přes CarMakléř
        </h2>
        <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
          S námi prodáte auto rychleji, za lepší cenu a bez starostí
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit) => (
            <Card key={benefit.title} hover className="p-8 flex gap-5">
              <div className="text-3xl flex-shrink-0">{benefit.icon}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {benefit.title}
                </h3>
                <p className="text-[15px] text-gray-500 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 5: Testimonial */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <Card className="p-8 md:p-12 text-center bg-gray-50">
          <div className="text-orange-500 text-4xl mb-6">&ldquo;</div>
          <blockquote className="text-lg md:text-xl text-gray-800 font-medium leading-relaxed mb-6 max-w-2xl mx-auto">
            Prodej proběhl hladce. Auto bylo prodané za 12 dní za cenu, která
            mě příjemně překvapila. Makléř se o všechno postaral.
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              JK
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Jana K., Praha</div>
              <div className="text-yellow-500 text-sm tracking-wider">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* SECTION 6: FAQ */}
      <section className="max-w-3xl mx-auto w-full px-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-4">
          Časté dotazy
        </h2>
        <p className="text-gray-500 text-center mb-10">
          Odpovědi na nejčastější otázky o prodeji přes CarMakléř
        </p>
        <FAQ items={faqItems} />
      </section>

      {/* SECTION 7: Nejste si jistí? — alternativy */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">
            Nejste si jistí?
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Prohlédněte si více informací, než se rozhodnete
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/jak-to-funguje" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Jak prodej funguje
          </Link>
          <Link href="/recenze" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Recenze klientů
          </Link>
          <Link href="/makleri" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Najít makléře v okolí
          </Link>
        </div>
      </section>
    </div>
  );
}
