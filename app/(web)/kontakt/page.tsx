import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { ContactPageForm } from "@/components/web/ContactPageForm";
import { companyInfo } from "@/lib/company-info";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    `Kontaktujte ${companyInfo.name}. ${companyInfo.address.city}. Telefon ${companyInfo.contact.phone}, e-mail ${companyInfo.contact.email}.`,
  openGraph: {
    title: "Kontakt | CarMakléř",
    description:
      `Kontaktujte nás. ${companyInfo.address.city}. Telefon ${companyInfo.contact.phone}.`,
  },
  alternates: pageCanonical("/kontakt"),
};

const branches = companyInfo.branches;

const contactInfo = [
  { icon: "📍", label: "Adresa", value: companyInfo.address.full },
  { icon: "📞", label: "Telefon", value: companyInfo.contact.phone },
  { icon: "✉️", label: "E-mail", value: companyInfo.contact.email },
  { icon: "🕐", label: "Otevírací doba", value: companyInfo.hours },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: companyInfo.name,
  url: companyInfo.web.url,
  telephone: companyInfo.contact.phoneJsonLd,
  email: companyInfo.contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: companyInfo.address.street,
    addressLocality: companyInfo.address.city,
    postalCode: companyInfo.address.zip,
    addressCountry: "CZ",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: companyInfo.hoursSpec.dayOfWeek,
    opens: companyInfo.hoursSpec.opens,
    closes: companyInfo.hoursSpec.closes,
  },
};

export default function KontaktPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Kontakt" },
        ]}
      />
      {/* Map */}
      <section className="h-[250px] sm:h-[300px] md:h-[400px]">
        <iframe
          src="https://frame.mapy.cz/zakladni?x=14.4244&y=50.0793&z=16&source=addr&id=8942598"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          title="Mapa — CarMakléř Praha, Školská 660/3"
          allowFullScreen
        />
      </section>

      {/* Contact info + form */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left — info */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
                Ozvěte se nám
              </h1>
              <p className="text-gray-500 leading-relaxed mb-8">
                Chcete prodat auto, hledáte makléře nebo máte dotaz k našim službám?
                Zavolejte, napište nebo vyplňte formulář — odpovídáme do 30 minut v pracovní dny.
              </p>

              <div className="flex flex-col gap-5">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        {item.label}
                      </div>
                      <div className="text-gray-900 font-medium mt-0.5">
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <ContactPageForm />
          </div>
        </div>
      </section>

      {/* Branches */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-gray-900">
              Naše pobočky
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {branches.map((branch) => (
              <Card key={branch.city} hover className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">
                    📍
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{branch.city}</h3>
                    <span className="text-xs font-semibold text-orange-500">
                      {branch.type}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <p>{branch.address}</p>
                  <p className="font-medium text-gray-900">{branch.phone}</p>
                  <p>{branch.hours}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-6">
            Rychlé odkazy
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/nabidka" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Prohlédnout nabídku vozidel
            </Link>
            <Link href="/chci-prodat" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Prodat auto přes makléře
            </Link>
            <Link href="/makleri" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Najít makléře v okolí
            </Link>
            <Link href="/sluzby/financovani" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Financování auta na splátky
            </Link>
            <Link href="/recenze" className="no-underline px-5 py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors">
              Přečíst recenze klientů
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
