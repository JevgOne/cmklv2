import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ceník | Carmakler",
  description:
    "Prodej vozu přes Carmakler za jednoduchou provizi 5 % z prodejní ceny. Žádné skryté poplatky, vše v ceně.",
};

const included = [
  {
    icon: "📸",
    title: "Profesionální fotografie",
    desc: "Makléř nafotí vůz podle našich standardů — kvalitní prezentace prodává.",
  },
  {
    icon: "📝",
    title: "Inzerce na všech portálech",
    desc: "Zveřejníme vůz na Carmakler.cz i dalších inzertních platformách.",
  },
  {
    icon: "🤝",
    title: "Kompletní servis při prodeji",
    desc: "Komunikace se zájemci, prohlídky, testovací jízdy — vše řeší makléř.",
  },
  {
    icon: "📄",
    title: "Smlouvy a administrativa",
    desc: "Kupní smlouva, přepis vozu, předávací protokol — vše zařídíme.",
  },
  {
    icon: "💰",
    title: "Bezpečná platba",
    desc: "Peníze obdržíte bezpečně na účet po dokončení prodeje.",
  },
  {
    icon: "🔍",
    title: "Ocenění vozu",
    desc: "AI asistent pomoha makléři stanovit optimální prodejní cenu na základě trhu.",
  },
];

export default function CenikPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Jednoduchý a férový ceník
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Žádné balíčky, žádné skryté poplatky. Platíte pouze provizi z
            úspěšného prodeje.
          </p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 py-10 sm:px-10 sm:py-12 text-center text-white">
            <p className="text-sm font-semibold uppercase tracking-widest opacity-80 mb-2">
              Provize z prodeje
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl sm:text-7xl font-extrabold">5</span>
              <span className="text-3xl sm:text-4xl font-bold">%</span>
            </div>
            <p className="text-orange-100 mt-2 text-sm sm:text-base">
              z konečné prodejní ceny vozidla
            </p>
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10 text-center border-b border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Minimální provize</p>
            <p className="text-3xl font-extrabold text-gray-900">
              25 000 Kč
            </p>
            <p className="text-gray-400 text-xs mt-1">
              vč. DPH
            </p>
          </div>

          <div className="px-6 py-6 sm:px-10 bg-green-50 text-center">
            <p className="text-green-700 font-semibold text-sm">
              Neprodá se? Neplatíte nic.
            </p>
            <p className="text-green-600 text-xs mt-1">
              Provize se platí pouze z úspěšně dokončeného prodeje.
            </p>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">
          Co je v ceně
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {included.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <span className="text-2xl block mb-3">{item.icon}</span>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">
            Příklad výpočtu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-sm text-gray-500 mb-1">Prodejní cena vozu</p>
              <p className="text-2xl font-extrabold text-gray-900">
                350 000 Kč
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-6">
              <p className="text-sm text-gray-500 mb-1">Provize 5 %</p>
              <p className="text-2xl font-extrabold text-orange-500">
                25 000 Kč
              </p>
              <p className="text-xs text-gray-400 mt-1">
                (minimum 25 000 Kč)
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-6">
              <p className="text-sm text-gray-500 mb-1">Obdržíte</p>
              <p className="text-2xl font-extrabold text-green-600">
                325 000 Kč
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-sm text-gray-500 mb-1">Prodejní cena vozu</p>
              <p className="text-2xl font-extrabold text-gray-900">
                800 000 Kč
              </p>
            </div>
            <div className="bg-orange-50 rounded-xl p-6">
              <p className="text-sm text-gray-500 mb-1">Provize 5 %</p>
              <p className="text-2xl font-extrabold text-orange-500">
                40 000 Kč
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-6">
              <p className="text-sm text-gray-500 mb-1">Obdržíte</p>
              <p className="text-2xl font-extrabold text-green-600">
                760 000 Kč
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
          Chcete prodat svůj vůz?
        </h2>
        <p className="text-gray-500 mb-6 max-w-lg mx-auto">
          Kontaktujte nás a makléř ve vašem regionu se vám ozve do 24 hodin.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/kontakt"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors"
          >
            Chci prodat auto
          </Link>
          <Link
            href="/jak-to-funguje"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
          >
            Jak to funguje?
          </Link>
        </div>
      </section>
    </div>
  );
}
