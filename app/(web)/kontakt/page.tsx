import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { ContactPageForm } from "@/components/web/ContactPageForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktujte CarMakléř. Centrála Praha, pobočky Brno a Ostrava. Telefon +420 800 123 456, e-mail info@carmakler.cz.",
  openGraph: {
    title: "Kontakt | CarMakléř",
    description:
      "Kontaktujte nás. Centrála Praha, pobočky Brno a Ostrava. Telefon +420 800 123 456.",
  },
};

/* ------------------------------------------------------------------ */
/*  Dummy data                                                         */
/* ------------------------------------------------------------------ */

const branches = [
  {
    city: "Praha",
    type: "Centrála",
    address: "Vinohradská 123, 120 00 Praha 2",
    phone: "+420 800 123 456",
    hours: "Po-Pá 8:00-18:00",
  },
  {
    city: "Brno",
    type: "Pobočka",
    address: "Masarykova 45, 602 00 Brno",
    phone: "+420 800 123 457",
    hours: "Po-Pá 9:00-17:00",
  },
  {
    city: "Ostrava",
    type: "Pobočka",
    address: "Nádražní 12, 702 00 Ostrava",
    phone: "+420 800 123 458",
    hours: "Po-Pá 9:00-17:00",
  },
];

const contactInfo = [
  { icon: "📍", label: "Adresa", value: "Vinohradská 123, 120 00 Praha 2" },
  { icon: "📞", label: "Telefon", value: "+420 800 123 456" },
  { icon: "✉️", label: "E-mail", value: "info@carmakler.cz" },
  { icon: "🕐", label: "Otevírací doba", value: "Po-Pá 8:00-18:00" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function KontaktPage() {
  return (
    <main>
      {/* Map placeholder */}
      <section className="bg-gray-200 flex items-center justify-center h-[250px] sm:h-[300px] md:h-[400px]">
        <div className="text-center">
          <span className="text-5xl">📍</span>
          <p className="text-gray-600 font-semibold mt-3 text-lg">
            CarMakléř — Praha
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Vinohradská 123, Praha 2
          </p>
        </div>
      </section>

      {/* Contact info + form */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left — info */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
                Kontaktujte nás
              </h1>
              <p className="text-gray-500 leading-relaxed mb-8">
                Máte otázku, potřebujete poradit nebo chcete spolupracovat?
                Napište nám nebo zavolejte — rádi vám pomůžeme.
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
    </main>
  );
}
