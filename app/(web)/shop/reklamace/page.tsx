import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { BASE_URL } from "@/lib/seo-data";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Reklamace | Shop",
  description:
    "Zjistili jste vadu na zakoupeném dílu? Uplatněte reklamaci online za pár minut. Záruka 24 měsíců na nové díly, 12 měsíců na použité.",
  openGraph: {
    title: "Reklamace | CarMakléř Shop",
    description:
      "Uplatněte reklamaci online. Záruka 24 měs. na nové / 12 měs. na použité díly.",
  },
  alternates: pageCanonical("/shop/reklamace"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Reklamace — CarMakléř Shop",
  url: `${BASE_URL}/shop/reklamace`,
  description: "Postup uplatnění reklamace v e-shopu CarMakléř.",
  isPartOf: {
    "@type": "WebSite",
    name: "CarMakléř Shop",
    url: BASE_URL,
  },
};

export default function ReklamacePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: "Reklamace" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Reklamace
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-10">
          Zjistili jste vadu? Uplatněte reklamaci online za pár minut.
          Vyplníte formulář v sekci Moje objednávky a my se o zbytek postaráme.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="p-5 rounded-xl bg-orange-50 border border-orange-100">
            <div className="text-2xl mb-2">🛠</div>
            <h3 className="font-bold text-gray-900 mb-1">Záruční doba</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              24 měsíců na nové díly, 12 měsíců na použité díly.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-orange-50 border border-orange-100">
            <div className="text-2xl mb-2">⏱</div>
            <h3 className="font-bold text-gray-900 mb-1">30 dní na vyřízení</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Zákonná lhůta pro vyřízení reklamace.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Jak reklamovat — 4 kroky
        </h2>
        <ol className="list-none p-0 m-0 flex flex-col gap-4 mb-10">
          <li className="flex gap-4 p-4 rounded-lg bg-gray-50">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
              1
            </span>
            <div>
              <p className="text-gray-700 leading-relaxed m-0">
                Přihlaste se a v sekci <strong>Moje objednávky</strong> vyberte
                objednávku → <strong>Reklamovat</strong>.
              </p>
            </div>
          </li>
          <li className="flex gap-4 p-4 rounded-lg bg-gray-50">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
              2
            </span>
            <div>
              <p className="text-gray-700 leading-relaxed m-0">
                Popište závadu a nahrajte <strong>minimálně 2 fotky</strong>{" "}
                (povinné pro posouzení vady).
              </p>
            </div>
          </li>
          <li className="flex gap-4 p-4 rounded-lg bg-gray-50">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
              3
            </span>
            <div>
              <p className="text-gray-700 leading-relaxed m-0">
                Zvolte požadovaný způsob vyřízení — oprava, výměna, sleva nebo
                vrácení peněz.
              </p>
            </div>
          </li>
          <li className="flex gap-4 p-4 rounded-lg bg-gray-50">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
              4
            </span>
            <div>
              <p className="text-gray-700 leading-relaxed m-0">
                Do <strong>3 pracovních dní</strong> obdržíte RMA číslo a
                harmonogram vyřízení.
              </p>
            </div>
          </li>
        </ol>

        <div className="mb-12">
          <Link href="/shop/moje-objednavky">
            <Button variant="primary" size="lg">
              Přejít na Moje objednávky
            </Button>
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Co se do reklamace NEpočítá?
        </h2>
        <ul className="list-disc pl-6 mb-6 text-gray-600 leading-relaxed space-y-2">
          <li>Běžné opotřebení při užívání zboží.</li>
          <li>Mechanické poškození (např. při neodborné montáži).</li>
          <li>Nesprávná montáž nebo nekompatibilní použití dílu.</li>
        </ul>
        <p className="text-sm text-gray-500 mb-10">
          Plný právní text:{" "}
          <Link
            href="/reklamacni-rad"
            className="text-orange-500 hover:underline"
          >
            Reklamační řád
          </Link>
          .
        </p>

        <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">Máte dotaz?</h3>
          <p className="text-gray-600 leading-relaxed m-0">
            Napište nám na{" "}
            <a
              href="mailto:reklamace@carmakler.cz"
              className="text-orange-500 hover:underline"
            >
              reklamace@carmakler.cz
            </a>{" "}
            — odpovíme do 1 pracovního dne.
          </p>
        </div>
      </div>
    </>
  );
}
