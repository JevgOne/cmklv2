import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApplyForm } from "@/components/web/marketplace/ApplyForm";

export const metadata: Metadata = {
  title: "Marketplace | Investicni platforma pro flipping aut | CarMakler",
  description:
    "Investujte do aut a vydelejte 15-25% rocne. Overeni dealeri nabizi prilezitosti, overeni investori financuji. Bezpecne pres Carmakler.",
};

const howItWorks = [
  {
    step: 1,
    icon: "🔍",
    title: "Dealer najde auto",
    desc: "Overeny dealer najde auto s potencialem — podcenene, po leasingu, nebo na opravu.",
  },
  {
    step: 2,
    icon: "💰",
    title: "Investor financuje",
    desc: "Investori financuji nakup a opravu. Minimalni investice 10 000 Kc.",
  },
  {
    step: 3,
    icon: "🔧",
    title: "Oprava a priprava",
    desc: "Dealer auto opravi, pripraví a naforti pro prodej. Vse pod dohledem Carmakler.",
  },
  {
    step: 4,
    icon: "🎉",
    title: "Prodej a deleni zisku",
    desc: "Auto se proda za trzni cenu. Zisk se deli: 40% investor, 40% dealer, 20% Carmakler.",
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
    q: "Je to bezpecne?",
    a: "Ano. Kazde auto se kupuje na firmu Carmakler, ktera rucí za celou transakci. Investori nezodpovidaji za technicke vady ani pravni problemy.",
  },
  {
    q: "Jaka je minimalni investice?",
    a: "Minimalni investice do jednoho flipu je 10 000 Kc. Muzete investovat do vice aut soucasne.",
  },
  {
    q: "Jak dlouho trva flip?",
    a: "Typicky 30-90 dni od financovani po prodej. Zalezi na rozsahu opravy a poptavce na trhu.",
  },
  {
    q: "Jak se deli zisk?",
    a: "Zisk se deli v pomeru 40% investor, 40% dealer, 20% Carmakler. Pomer je fixni pro vsechny flipy.",
  },
  {
    q: "Co kdyz se auto neproda?",
    a: "Carmakler garantuje odkup za minimalní cenu po 120 dnech. Investor nikdy neprijde o vice nez 10% investice.",
  },
  {
    q: "Jak se stanu dealerem nebo investorem?",
    a: "Vyplnte formular zadosti nize. Vas profil proverime a ozveme se do 48 hodin.",
  },
];

const guarantees = [
  { icon: "🏢", title: "Auto na firmu Carmakler", desc: "Kazde auto se kupuje na nasi firmu. Minimalizace rizika." },
  { icon: "🔒", title: "Smlouva s kazdym investorem", desc: "Jasne podminky, prava a povinnosti. Zadne prekvapení." },
  { icon: "✅", title: "Overeni dealeri", desc: "Kazdy dealer prochazi overovacim procesem a ma historii flipu." },
  { icon: "📊", title: "Transparentni kalkulace", desc: "Vsechny naklady a zisky jsou viditelne. Zadne skryte poplatky." },
];

export default function MarketplacePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-orange-500/20 text-orange-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                Investicni platforma
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Investujte do aut,{" "}
                <span className="text-orange-500">vydelejte 15-25%</span> rocne
              </h1>
              <p className="text-lg text-white/60 mt-5 leading-relaxed max-w-lg">
                Overeni dealeri nachazeji prilezitosti. Vy investujete. Auto se opravi, proda a zisk se deli ferove.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="#apply" className="no-underline">
                  <Button variant="primary" size="lg">
                    Chci investovat
                  </Button>
                </Link>
                <Link href="#apply" className="no-underline">
                  <Button
                    variant="outline"
                    size="lg"
                    className="!border-2 !border-white/30 !text-white !bg-transparent !shadow-none hover:!bg-white/10"
                  >
                    Jsem dealer
                  </Button>
                </Link>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10">
                <div>
                  <div className="text-2xl font-extrabold text-orange-500">127</div>
                  <div className="text-sm text-white/50">Dokoncených flipu</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-orange-500">21%</div>
                  <div className="text-sm text-white/50">Prumerny ROI</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-orange-500">48 dni</div>
                  <div className="text-sm text-white/50">Prumerna doba</div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="aspect-square bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-3xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">📈</div>
                    <div className="text-3xl font-extrabold text-white mb-2">+21%</div>
                    <div className="text-white/60">Prumerny rocni vynos</div>
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
            <p className="text-gray-500 mt-2">4 jednoduche kroky od nalezeni auta po vyplatu zisku</p>
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
              Priklady zhodnoceni
            </h2>
            <p className="text-gray-500 mt-2">Realne priklady flipu a jejich vynosnost</p>
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
                  <p className="text-sm text-gray-400">{ex.year}</p>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nakupni cena</span>
                      <span className="font-semibold">{ex.purchase.toLocaleString("cs-CZ")} Kc</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Naklady na opravu</span>
                      <span className="font-semibold">{ex.repair.toLocaleString("cs-CZ")} Kc</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Prodejni cena</span>
                      <span className="font-semibold text-success-500">{ex.sale.toLocaleString("cs-CZ")} Kc</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-400 uppercase font-semibold">Zisk investora</div>
                        <div className="text-xl font-extrabold text-success-500">{investorProfit.toLocaleString("cs-CZ")} Kc</div>
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
              Bezpecnost na prvnim miste
            </h2>
            <p className="text-gray-500 mt-2">Kazdy flip je zabezpecen pres firmu Carmakler</p>
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
              Casto kladene otazky
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

      {/* Apply CTA */}
      <section id="apply" className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Pripojte se k platforme
            </h2>
            <p className="text-gray-500 mt-2">Vyplnte formular a zacnete vydelavat</p>
          </div>

          <ApplyForm />
        </div>
      </section>
    </main>
  );
}
