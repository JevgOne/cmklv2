import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { prisma } from "@/lib/prisma";
import { companyInfo } from "@/lib/company-info";
import { pageCanonical } from "@/lib/canonical";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "O nás",
  description:
    "CarMakléř — nová éra prodeje aut v Česku. Ověření makléři, prověřená vozidla, spokojení klienti.",
  openGraph: {
    title: "O nás | CarMakléř",
    description:
      "Ověření makléři, prověřená vozidla, spokojení klienti. Poznejte náš příběh.",
  },
  alternates: pageCanonical("/o-nas"),
};

async function getStats() {
  try {
    const [brokerCount, vehicleCount, soldCount] = await Promise.all([
      prisma.user.count({ where: { role: "BROKER", status: "ACTIVE" } }),
      prisma.vehicle.count({ where: { status: "ACTIVE" } }),
      prisma.vehicle.count({ where: { status: "SOLD" } }),
    ]);
    return [
      { value: brokerCount.toLocaleString("cs-CZ"), label: "makléřů" },
      { value: vehicleCount.toLocaleString("cs-CZ"), label: "vozidel" },
      { value: soldCount.toLocaleString("cs-CZ"), label: "prodaných vozidel" },
    ];
  } catch {
    return [
      { value: "—", label: "makléřů" },
      { value: "—", label: "vozidel" },
      { value: "—", label: "prodaných vozidel" },
    ];
  }
}

async function getTeamMembers() {
  try {
    return await prisma.teamMember.findMany({
      where: { isPublic: true },
      orderBy: { order: "asc" },
    });
  } catch {
    return [];
  }
}

const values = [
  {
    icon: "🔍",
    title: "Transparentnost",
    desc: "Víte přesně, co se děje, kolik to stojí a proč. Žádné skryté poplatky, žádná překvapení.",
  },
  {
    icon: "🛡️",
    title: "Bezpečnost na prvním místě",
    desc: "Prověřujeme historii každého vozidla. Chráníme prodejce i kupující před podvody a nepříjemnostmi.",
  },
  {
    icon: "💰",
    title: "Férové podmínky",
    desc: "Provizi platíte jen z úspěšného prodeje. Makléř prodá za tržní cenu, ne za výkupní. Rozdíl jde vám.",
  },
  {
    icon: "🤝",
    title: "Osobní přístup",
    desc: "Žádné call centrum. Váš makléř vás zná jménem, přijede k vám a provede vás celým procesem.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: companyInfo.name,
  url: companyInfo.web.url,
  logo: companyInfo.web.logo,
  description:
    "CarMakléř je moderní platforma pro prodej a nákup vozidel přes síť ověřených makléřů v celé České republice.",
  foundingDate: "2024",
  address: {
    "@type": "PostalAddress",
    streetAddress: companyInfo.address.street,
    addressLocality: companyInfo.address.city,
    postalCode: companyInfo.address.zip,
    addressCountry: "CZ",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: companyInfo.contact.phoneJsonLd,
    contactType: "customer service",
    areaServed: "CZ",
    availableLanguage: "Czech",
  },
};

export default async function ONasPage() {
  const [stats, team] = await Promise.all([getStats(), getTeamMembers()]);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "O nás" },
        ]}
      />
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-12 sm:py-16 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Pomáháme lidem prodat auto za nejvíc a koupit bezpečně
          </h1>
          <p className="text-white/60 mt-5 text-lg max-w-2xl mx-auto">
            Jsme tým profesionálních automakléřů po celé ČR. Každý den pomáháme lidem, kteří nechtějí řešit inzeráty, podvodníky a papírování.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 mb-6">
            Proč CarMakléř existuje
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Prodej auta v Česku je noční můra. Focení na parkovišti, desítky zpráv od spekulantů, nekonečné jednání o ceně a pak ještě běhání po úřadech s přepisem. A nákup? Stočené tachometry, zatajené nehody, nejistota na každém kroku.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            A pak tu máte autobazary. Vykoupí vaše auto za zlomek ceny, pár tisíc investují do leštění a prodají za dvojnásobek. Vy přijdete o peníze, kupující dostane přikrášlenou realitu. Všichni prohrávají — kromě bazaráka.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Proto jsme vytvořili CarMakléř. Tým profesionálních makléřů, kteří stojí na vaší straně. Nejsme překupníci, nic nevykupujeme ani neprodáváme za sebe. Makléř zastupuje vaše zájmy — ne svoje. Prodejcům zajistíme profesionální prezentaci a prodej za nejvyšší možnou cenu. Kupujícím nabídneme prověřená vozidla s kompletní historií.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Věříme, že férovost a transparentnost se vyplatí. Proto u nás víte přesně, kolik co stojí, kdo komu co platí a proč. Žádné skryté poplatky, žádné triky, žádné &bdquo;to je normální&ldquo;. Platíte jen z úspěšného prodeje — 5 % z prodejní ceny, minimum 25 000 Kč. To je vše.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Jsme firma, která chce změnit trh s ojetými auty v Česku. Poctivě, otevřeně a s respektem ke každému klientovi. Protože prodat nebo koupit auto by nemělo být stresující — mělo by to být v pohodě.
          </p>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6 text-center">
                <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-br from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-500 mt-2">
                  {stat.label}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Náš tým
            </h2>
            <p className="text-gray-500 mt-2">Lidé, kteří stojí za CarMakléř</p>
          </div>

          {team.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((person) => (
                <Card key={person.id} hover className="p-6 text-center">
                  {person.photoUrl ? (
                    <img
                      src={person.photoUrl}
                      alt={person.name}
                      className="w-20 h-20 rounded-xl object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl font-extrabold text-white mx-auto">
                      {person.initials}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 mt-4">{person.name}</h3>
                  <p className="text-sm text-orange-500 font-semibold mt-1">
                    {person.position}
                  </p>
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                    {person.bio}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">Tým se připravuje.</p>
          )}
        </div>
      </section>

      {/* Values */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Naše hodnoty
            </h2>
            <p className="text-gray-500 mt-2">Na čem stavíme každý den</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} hover className="p-6">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-[28px] mb-4">
                  {value.icon}
                </div>
                <h3 className="font-bold text-gray-900">{value.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {value.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-linking */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900 mb-6">
            Jak vám můžeme pomoci?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/nabidka" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Prohlédnout nabídku vozidel
            </Link>
            <Link href="/chci-prodat" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Prodat auto přes makléře
            </Link>
            <Link href="/makleri" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Najít ověřeného makléře
            </Link>
            <Link href="/recenze" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Přečíst recenze klientů
            </Link>
            <Link href="/kontakt" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Kontaktovat nás
            </Link>
            <Link href="/kariera" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Kariéra u CarMakléř
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
