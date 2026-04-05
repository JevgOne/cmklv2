import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Zásady cookies",
  description: "Informace o používání cookies na platformě CarMakler. Přehled cookies, účely a způsob správy.",
  openGraph: {
    title: "Zásady cookies | CarMakler",
    description: "Informace o používání cookies na platformě CarMakler.",
  },
  alternates: {
    canonical: `${BASE_URL}/zasady-cookies`,
  },
};

const cookies = [
  {
    name: "next-auth.session-token",
    purpose: "Autentizace uzivatele (prihlaseni)",
    expiry: "30 dni",
    type: "Nutne",
  },
  {
    name: "next-auth.csrf-token",
    purpose: "Ochrana proti CSRF utokum",
    expiry: "Relace",
    type: "Nutne",
  },
  {
    name: "next-auth.callback-url",
    purpose: "Presmerovani po prihlaseni",
    expiry: "Relace",
    type: "Nutne",
  },
  {
    name: "site_access",
    purpose: "Overeni pristupu na staging prostredi",
    expiry: "30 dni",
    type: "Nutne",
  },
  {
    name: "cookie_consent",
    purpose: "Ulozeni vasich preferenci ohledne cookies (localStorage)",
    expiry: "Neomezene",
    type: "Nutne",
  },
  {
    name: "plausible_ignore",
    purpose: "Plausible Analytics — vylouceni z analytiky (opt-out)",
    expiry: "Neomezene",
    type: "Analyticke",
  },
  {
    name: "_ga, _ga_*",
    purpose: "Google Analytics 4 — identifikace navstevnika (pokud pouzito)",
    expiry: "2 roky",
    type: "Analyticke",
  },
  {
    name: "_fbp",
    purpose: "Facebook Pixel — identifikace pro remarketing (pokud pouzito)",
    expiry: "3 mesice",
    type: "Marketingove",
  },
];

export default function ZasadyCookiesPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Zásady cookies" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Zásady cookies
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Posledni aktualizace: [DOPLNIT DATUM]
        </p>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-orange-500">

          <section>
            <h2>Co jsou cookies</h2>
            <p>
              Cookies jsou male textove soubory, ktere se ukladaji do vaseho prohlizece pri
              navsteve webovych stranek. Slouzi k zapamatovani vasich preferenci, prihlaseni
              a analyze navstevnosti.
            </p>
          </section>

          <section>
            <h2>Kategorie cookies</h2>
            <h3>Nutne cookies</h3>
            <p>
              Nezbytne pro zakladni funkce webu — prihlaseni, kosik, ochrana proti utokum.
              Tyto cookies se nastavuji automaticky a nelze je vypnout, aniz by doslo k
              naruseni funkce webu.
            </p>
            <h3>Analyticke cookies</h3>
            <p>
              Pouzivame je pro mereni navstevnosti a pochopeni, jak navstevnici pouzivaji
              nasi platformu. Primarni nastroj: <strong>Plausible Analytics</strong> (privacy-friendly,
              bez osobnich cookies). Data jsou agregovana a anonymni.
              Tyto cookies se aktivuji jen s vasim souhlasem.
            </p>
            <h3>Marketingove cookies</h3>
            <p>
              Slouzi k zobrazeni relevantnich reklam na externich platformach (Facebook, Google).
              Aktualne nepouzivame marketingove cookies. V budoucnu mohou byt aktivovany
              jen s vasim vylednym souhlasem.
            </p>
          </section>

          <section>
            <h2>Prehled cookies</h2>
          </section>
        </div>

        {/* Tabulka mimo prose pro lepsi kontrolu */}
        <div className="overflow-x-auto mt-4 mb-8">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Nazev</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ucel</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Expirace</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Typ</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              {cookies.map((c) => (
                <tr key={c.name} className="border-t border-gray-100">
                  <td className="py-3 px-4 font-mono text-xs">{c.name}</td>
                  <td className="py-3 px-4">{c.purpose}</td>
                  <td className="py-3 px-4">{c.expiry}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.type === "Nutne"
                          ? "bg-gray-100 text-gray-700"
                          : c.type === "Analyticke"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {c.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-orange-500">
          <section>
            <h2>Jak spravovat cookies</h2>
            <p>
              Svuj souhlas s cookies muzete kdykoliv zmenit kliknutim na odkaz &bdquo;Nastaveni
              cookies&ldquo; v paticce naseho webu, nebo smazanim cookies ve svem prohlizeci.
            </p>
            <p>
              Podrobne informace o zpracovani osobnich udaju najdete na strance{" "}
              <Link href="/ochrana-osobnich-udaju">Ochrana osobních údajů</Link>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
