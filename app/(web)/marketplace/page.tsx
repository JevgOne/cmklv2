import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { getMarketplaceStats } from "@/lib/stats";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Marketplace | Investiční platforma pro flipping aut",
  description:
    "Investujte do aut a vydělejte 15-25 % ročně. Ověření realizátoři nabízí příležitosti, ověření investoři financují. Bezpečně přes CarMakléř.",
  openGraph: {
    title: "Marketplace — investice do aut | CarMakléř",
    description:
      "Investujte do aut a vydělejte 15-25 % ročně. Ověření realizátoři, bezpečné transakce přes CarMakléř.",
  },
  alternates: pageCanonical("/marketplace"),
};

const howItWorks = [
  {
    step: 1,
    icon: "🔍",
    title: "Realizátor najde auto",
    desc: "Ověřený realizátor najde auto s potenciálem — podceněné, po leasingu, nebo na opravu.",
  },
  {
    step: 2,
    icon: "💰",
    title: "Investor financuje",
    desc: "Investoři financují nákup a opravu. Minimální investice 10 000 Kč.",
  },
  {
    step: 3,
    icon: "🔧",
    title: "Oprava a příprava",
    desc: "Realizátor auto opraví, připraví a nafotí pro prodej. Vše pod dohledem CarMakléř.",
  },
  {
    step: 4,
    icon: "🎉",
    title: "Prodej a dělení zisku",
    desc: "Auto se prodá za tržní cenu. Zisk se dělí: 40 % investor, 40 % realizátor, 20 % CarMakléř.",
  },
];

const roiExamples = [
  {
    car: "Skoda Octavia III 1.6 TDI",
    year: 2016,
    purchase: 180000,
    repair: 45000,
    sale: 299000,
  },
  {
    car: "VW Golf VII 1.4 TSI",
    year: 2017,
    purchase: 165000,
    repair: 30000,
    sale: 259000,
  },
  {
    car: "BMW 320d F30",
    year: 2015,
    purchase: 220000,
    repair: 65000,
    sale: 389000,
  },
];

const faqs = [
  {
    q: "Je to bezpečné?",
    a: "Ano. Každé auto se kupuje na firmu CarMakléř, která ručí za celou transakci. Investoři nezodpovídají za technické vady ani právní problémy.",
  },
  {
    q: "Jaká je minimální investice?",
    a: "Minimální investice do jednoho flipu je 10 000 Kč. Můžete investovat do více aut současně.",
  },
  {
    q: "Jak dlouho trvá flip?",
    a: "Typicky 30-90 dní od financování po prodej. Záleží na rozsahu opravy a poptávce na trhu.",
  },
  {
    q: "Jak se dělí zisk?",
    a: "Zisk se dělí v poměru 40 % investor, 40 % realizátor, 20 % CarMakléř. Poměr je fixní pro všechny flipy.",
  },
  {
    q: "Co když se auto neprodá?",
    a: "CarMakléř garantuje odkup za minimální cenu po 120 dnech. Investor nikdy nepřijde o více než 10 % investice.",
  },
  {
    q: "Jak se stanu dealerem nebo investorem?",
    a: "Vyplňte formulář žádosti níže. Váš profil prověříme a ozveme se do 48 hodin.",
  },
  {
    q: "Co je realizátor?",
    a: "Realizátor je ověřený odborník, který najde vhodné auto, zajistí jeho nákup, opravu a přípravu k prodeji. Je to člověk, který celý deal realizuje od A do Z.",
  },
];

const guarantees = [
  { icon: "🏢", title: "Auto na firmu CarMakléř", desc: "Každé auto se kupuje na naši firmu. Minimalizace rizika." },
  { icon: "🔒", title: "Smlouva s každým investorem", desc: "Jasné podmínky, práva a povinnosti. Žádné překvapení." },
  { icon: "✅", title: "Ověření realizátoři", desc: "Každý realizátor prochází ověřovacím procesem a má historii flipů." },
  { icon: "📊", title: "Transparentní kalkulace", desc: "Všechny náklady a zisky jsou viditelné. Žádné skryté poplatky." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

// Landing má searchParams → nesmí mít revalidate (jinak Next.js static prerender se pokoušel cache invaidovat na každé query change). Necháme dynamic.

type MarketplacePageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const { reason } = await searchParams;
  const stats = await getMarketplaceStats();
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Marketplace" },
        ]}
      />

      {reason === "not_authorized" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Alert variant="warning">
            <span className="text-sm leading-relaxed">
              <strong className="block mb-1">Vaše role nemá přístup k detailům marketplace</strong>
              Pokud máte zájem o investování nebo nabízení flip příležitostí, vyplňte{" "}
              <Link href="/marketplace/apply" className="underline font-semibold">
                žádost o rozšíření role
              </Link>
              .
            </span>
          </Alert>
        </div>
      )}
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-orange-500/20 text-orange-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                Investiční platforma
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Investujte do aut,{" "}
                <span className="text-orange-500">vydělejte 15-25 %</span> ročně
              </h1>
              <p className="text-lg text-white/60 mt-5 leading-relaxed max-w-lg">
                Ověření realizátoři nacházejí příležitosti. Vy investujete. Auto se opraví, prodá a zisk se dělí férově.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/marketplace/apply?role=investor" className="no-underline">
                  <Button variant="primary" size="lg">
                    Chci investovat
                  </Button>
                </Link>
                <Link href="/marketplace/apply?role=dealer" className="no-underline">
                  <Button
                    variant="outline"
                    size="lg"
                    className="!border-2 !border-white/30 !text-white !bg-transparent !shadow-none hover:!bg-white/10"
                  >
                    Jsem realizátor
                  </Button>
                </Link>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10">
                <div>
                  <div className="text-2xl font-extrabold text-orange-500">
                    {stats.completedFlips > 0 ? stats.completedFlips : "–"}
                  </div>
                  <div className="text-sm text-white/50">Dokončených flipů</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-orange-500">
                    {stats.avgROI > 0 ? `${stats.avgROI}%` : "–"}
                  </div>
                  <div className="text-sm text-white/50">Průměrný ROI</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-orange-500">
                    {stats.avgFlipDays > 0 ? `${stats.avgFlipDays} dní` : "–"}
                  </div>
                  <div className="text-sm text-white/50">Průměrná doba</div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-3xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">📈</div>
                    <div className="text-3xl font-extrabold text-white mb-2">+21%</div>
                    <div className="text-white/60">Průměrný roční výnos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jak to funguje */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Jak to funguje
            </h2>
            <p className="text-gray-500 mt-2">4 jednoduché kroky od nalezení auta po výplatu zisku</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item) => (
              <Card key={item.step} hover className="p-6 text-center relative">
                <div className="absolute top-4 right-4 text-[40px] font-extrabold text-gray-100">
                  {item.step}
                </div>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-[32px] mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Priklady ROI */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Příklady zhodnocení
            </h2>
            <p className="text-gray-500 mt-2">Reálné příklady flipů a jejich výnosnost</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roiExamples.map((ex) => {
              const totalCost = ex.purchase + ex.repair;
              const profit = ex.sale - totalCost;
              const roi = ((profit / totalCost) * 100).toFixed(0);
              const investorProfit = Math.round(profit * 0.4);

              return (
                <Card key={ex.car} hover className="p-6">
                  <h3 className="font-bold text-gray-900">{ex.car}</h3>
                  <p className="text-sm text-gray-500">{ex.year}</p>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nákupní cena</span>
                      <span className="font-semibold">{ex.purchase.toLocaleString("cs-CZ")} Kč</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Náklady na opravu</span>
                      <span className="font-semibold">{ex.repair.toLocaleString("cs-CZ")} Kč</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Prodejní cena</span>
                      <span className="font-semibold text-success-500">{ex.sale.toLocaleString("cs-CZ")} Kč</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold">Zisk investora</div>
                        <div className="text-xl font-extrabold text-success-500">{investorProfit.toLocaleString("cs-CZ")} Kč</div>
                      </div>
                      <div className="bg-orange-100 text-orange-600 font-extrabold text-lg px-4 py-2 rounded-xl">
                        +{roi}%
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bezpecnostni zaruky */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Bezpečnost na prvním místě
            </h2>
            <p className="text-gray-500 mt-2">Každý flip je zabezpečen přes firmu CarMakléř</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {guarantees.map((g) => (
              <Card key={g.title} hover className="p-6">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mb-4">
                  {g.icon}
                </div>
                <h3 className="font-bold text-gray-900">{g.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{g.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Často kladené otázky
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q} className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA — linkuje na dedikovanou /marketplace/apply stránku */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-orange-50 to-orange-100/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
            Připojte se k platformě
          </h2>
          <p className="text-gray-600 mt-3 mb-8 max-w-xl mx-auto leading-relaxed">
            Marketplace je VIP platforma — přístup mají jen ověření dealeři a investoři.
            Vyplňte žádost a my vás do 48 hodin prověříme.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/marketplace/apply?role=investor" className="no-underline">
              <Button variant="primary" size="lg">
                💰 Chci investovat
              </Button>
            </Link>
            <Link href="/marketplace/apply?role=dealer" className="no-underline">
              <Button variant="outline" size="lg">
                🚗 Jsem realizátor
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Už máte účet?{" "}
            <Link href="/prihlaseni" className="text-orange-500 hover:underline font-semibold">
              Přihlaste se
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
