import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Zásady cookies",
  description: "Informace o používání cookies na platformě CarMakler. Přehled cookies, účely a způsob správy.",
  openGraph: {
    title: "Zásady cookies | CarMakler",
    description: "Informace o používání cookies na platformě CarMakler.",
  },
  alternates: pageCanonical("/zasady-cookies"),
};

const cookies = [
  {
    name: "next-auth.session-token",
    purpose: "Autentizace uživatele (přihlášení)",
    expiry: "30 dní",
    type: "Nutné",
  },
  {
    name: "next-auth.csrf-token",
    purpose: "Ochrana proti CSRF útokům",
    expiry: "Relace",
    type: "Nutné",
  },
  {
    name: "next-auth.callback-url",
    purpose: "Přesměrování po přihlášení",
    expiry: "Relace",
    type: "Nutné",
  },
  {
    name: "site_access",
    purpose: "Ověření přístupu na staging prostředí",
    expiry: "30 dní",
    type: "Nutné",
  },
  {
    name: "cookie_consent",
    purpose: "Uložení vašich preferencí ohledně cookies (localStorage)",
    expiry: "Neomezené",
    type: "Nutné",
  },
  {
    name: "plausible_ignore",
    purpose: "Plausible Analytics — vyloučení z analytiky (opt-out)",
    expiry: "Neomezené",
    type: "Analytické",
  },
  {
    name: "_ga, _ga_*",
    purpose: "Google Analytics 4 — identifikace návštěvníka (pokud použito)",
    expiry: "2 roky",
    type: "Analytické",
  },
  {
    name: "_fbp",
    purpose: "Facebook Pixel — identifikace pro remarketing (pokud použito)",
    expiry: "3 měsíce",
    type: "Marketingové",
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
          Poslední aktualizace: 01.04.2026
        </p>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-orange-500">

          <section>
            <h2>Co jsou cookies</h2>
            <p>
              Cookies jsou malé textové soubory, které se ukládají do vašeho prohlížeče při
              návštěvě webových stránek. Slouží k zapamatování vašich preferencí, přihlášení
              a analýze návštěvnosti.
            </p>
          </section>

          <section>
            <h2>Kategorie cookies</h2>
            <h3>Nutné cookies</h3>
            <p>
              Nezbytné pro základní funkce webu — přihlášení, košík, ochrana proti útokům.
              Tyto cookies se nastavují automaticky a nelze je vypnout, aniž by došlo k
              narušení funkce webu.
            </p>
            <h3>Analytické cookies</h3>
            <p>
              Používáme je pro měření návštěvnosti a pochopení, jak návštěvníci používají
              naši platformu. Primární nástroj: <strong>Plausible Analytics</strong> (privacy-friendly,
              bez osobních cookies). Data jsou agregovaná a anonymní.
              Tyto cookies se aktivují jen s vaším souhlasem.
            </p>
            <h3>Marketingové cookies</h3>
            <p>
              Slouží k zobrazení relevantních reklam na externích platformách (Facebook, Google).
              Aktuálně nepoužíváme marketingové cookies. V budoucnu mohou být aktivovány
              jen s vaším výslovným souhlasem.
            </p>
          </section>

          <section>
            <h2>Přehled cookies</h2>
          </section>
        </div>

        {/* Tabulka mimo prose pro lepsi kontrolu */}
        <div className="overflow-x-auto mt-4 mb-8">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Název</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Účel</th>
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
                        c.type === "Nutné"
                          ? "bg-gray-100 text-gray-700"
                          : c.type === "Analytické"
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
              Svůj souhlas s cookies můžete kdykoliv změnit kliknutím na odkaz &bdquo;Nastavení
              cookies&ldquo; v patičce našeho webu, nebo smazáním cookies ve svém prohlížeči.
            </p>
            <p>
              Podrobné informace o zpracování osobních údajů najdete na stránce{" "}
              <Link href="/ochrana-osobnich-udaju">Ochrana osobních údajů</Link>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
