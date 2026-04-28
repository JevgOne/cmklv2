import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SellCarForm } from "@/components/web/SellCarForm";
import { FAQ } from "@/components/web/FAQ";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { getBrokerStats } from "@/lib/stats";
import { prisma } from "@/lib/prisma";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Prodat auto za nejvyšší cenu",
  description:
    "Váš makléř zajistí fotky, inzerci na všech portálech, prohlídky i smlouvu. Vy jen inkasujete. Průměrně za 20 dní, provize 5 %.",
  openGraph: {
    title: "Prodat auto za nejvyšší cenu | CarMakléř",
    description:
      "Váš makléř se postará o kompletní prodej — od fotek po přepis. Průměrně za 20 dní.",
  },
  alternates: pageCanonical("/chci-prodat"),
};

const steps = [
  {
    number: 1,
    icon: "📝",
    title: "Řeknete nám o autě",
    description: "Vyplňte krátký formulář — značka, model, rok, stav. Trvá to minutu.",
  },
  {
    number: 2,
    icon: "📞",
    title: "Makléř se ozve do 30 minut",
    description: "Přiřadíme vám makléře ve vašem okolí. Dohodne si prohlídku vozu.",
  },
  {
    number: 3,
    icon: "🎉",
    title: "Vy jen podepíšete a inkasujete",
    description: "Makléř zajistí fotky, inzerci, prohlídky, smlouvu i přepis na úřadě.",
  },
];

const benefits = [
  {
    icon: "⏱️",
    title: "Prodáno průměrně za 20 dní",
    description:
      "Kvalitní fotky a profesionální inzerce na všech portálech v ČR znamenají víc zájemců a rychlejší prodej.",
  },
  {
    icon: "💰",
    title: "Vyšší cena než v bazaru",
    description:
      "Bazar vám nabídne výkupní cenu. Makléř prodá za tržní cenu koncovému kupujícímu. Rozdíl bývá desítky tisíc.",
  },
  {
    icon: "📸",
    title: "Profesionální prezentace vozu",
    description:
      "Makléř nafotí auto, napíše atraktivní popis a zveřejní na Sauto, TipCars, Facebook Marketplace a dalších.",
  },
  {
    icon: "🛡️",
    title: "Papíry? To je na nás.",
    description:
      "Kupní smlouva, přepis na úřadě, odhlášení pojištění, protokol o předání — vše zajistí makléř.",
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
  const [stats, featuredReview] = await Promise.all([
    getBrokerStats(),
    prisma.review.findFirst({
      where: { isPublished: true, isFeatured: true, type: "SELLER" },
      orderBy: { createdAt: "desc" },
    }).catch(() => null),
  ]);
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
              Prodejte auto{" "}
              <span className="text-orange-500">
                za nejvyšší cenu
              </span>{" "}
              bez jediné starosti
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Váš makléř zajistí vše — od profesionálních fotek po přepis na úřadě. Vy jen podepíšete a inkasujete.
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
          3 kroky a máte prodáno
        </h2>
        <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Žádné shánění zájemců, focení, odpovídání na dotazy ani běhání po úřadech
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
          Proč prodat přes makléře, ne přes bazar
        </h2>
        <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Bazar vám nabídne výkupní cenu. Makléř prodá za tržní cenu přímo kupujícímu — rozdíl je v desítkách tisíc.
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
      {featuredReview && (
      <section className="max-w-4xl mx-auto w-full px-4">
        <Card className="p-8 md:p-12 text-center bg-gray-50">
          <div className="text-orange-500 text-4xl mb-6">&ldquo;</div>
          <blockquote className="text-lg md:text-xl text-gray-800 font-medium leading-relaxed mb-6 max-w-2xl mx-auto">
            {featuredReview.text}
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              {featuredReview.authorName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">
                {featuredReview.authorName}{featuredReview.authorCity ? `, ${featuredReview.authorCity}` : ""}
              </div>
              <div className="text-yellow-500 text-sm tracking-wider">
                {"★".repeat(featuredReview.rating)}
              </div>
            </div>
          </div>
        </Card>
      </section>
      )}

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
            Chcete vědět víc?
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            Přečtěte si, jak přesně prodej funguje, nebo se podívejte na zkušenosti ostatních
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/kolik-stoji-moje-auto" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Kolik stojí moje auto?
          </Link>
          <Link href="/jak-to-funguje" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Jak prodej přes makléře funguje
          </Link>
          <Link href="/jak-prodat-auto" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Kompletní průvodce prodejem
          </Link>
          <Link href="/recenze" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Co říkají naši klienti
          </Link>
          <Link href="/makleri" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Najít makléře ve vašem městě
          </Link>
          <Link href="/sluzby/proverka" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Prověrka vozidla před prodejem
          </Link>
          <Link href="/nabidka" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
            Chci naopak koupit auto
          </Link>
        </div>
      </section>
    </div>
  );
}
