import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { BASE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Vrácení zboží | CarMakléř Shop",
  description:
    "Máte 14 dní na vrácení zakoupených dílů bez udání důvodu. Postup krok-za-krokem a kontakt na podporu.",
  openGraph: {
    title: "Vrácení zboží | CarMakléř Shop",
    description:
      "14 dní na odstoupení od smlouvy. Postup vrácení ve 3 krocích.",
  },
  alternates: {
    canonical: `${BASE_URL}/shop/vraceni-zbozi`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Vrácení zboží — CarMakléř Shop",
  url: `${BASE_URL}/shop/vraceni-zbozi`,
  description: "Postup vrácení zboží v e-shopu CarMakléř.",
  isPartOf: {
    "@type": "WebSite",
    name: "CarMakléř Shop",
    url: BASE_URL,
  },
};

export default function VraceniZboziPage() {
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
          { label: "Vrácení zboží" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Vrácení zboží
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-10">
          Máte <strong>14 dní</strong> na odstoupení od smlouvy bez udání důvodu.
          Stačí vyplnit formulář v sekci Moje objednávky.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="p-5 rounded-xl bg-orange-50 border border-orange-100">
            <div className="text-2xl mb-2">⏱</div>
            <h3 className="font-bold text-gray-900 mb-1">14 dní od převzetí</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Lhůta běží od doručení zboží, ne od objednávky.
            </p>
          </div>
          <div className="p-5 rounded-xl bg-orange-50 border border-orange-100">
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-bold text-gray-900 mb-1">
              Nepoužité, v původním obalu
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Nepoškozené a nenamontované díly.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Jak vrátit zboží — 3 kroky
        </h2>
        <ol className="list-none p-0 m-0 flex flex-col gap-4 mb-10">
          <li className="flex gap-4 p-4 rounded-lg bg-gray-50">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
              1
            </span>
            <div>
              <p className="text-gray-700 leading-relaxed m-0">
                Přihlaste se a v sekci <strong>Moje objednávky</strong> vyberte
                objednávku → <strong>Vrátit zboží</strong>.
              </p>
            </div>
          </li>
          <li className="flex gap-4 p-4 rounded-lg bg-gray-50">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
              2
            </span>
            <div>
              <p className="text-gray-700 leading-relaxed m-0">
                Vyplňte důvod vrácení a zvolte položky. Formulář uloží vaši
                žádost a obdržíte potvrzení e-mailem.
              </p>
            </div>
          </li>
          <li className="flex gap-4 p-4 rounded-lg bg-gray-50">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center">
              3
            </span>
            <div>
              <p className="text-gray-700 leading-relaxed m-0">
                Zboží zašlete na adresu zobrazenou ve formuláři <strong>do 14
                dní</strong> od odstoupení od smlouvy.
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
          Kdy NELZE vrátit zboží?
        </h2>
        <ul className="list-disc pl-6 mb-6 text-gray-600 leading-relaxed space-y-2">
          <li>Zboží vyrobené či upravené na zakázku (na míru).</li>
          <li>Použité díly po montáži — změna charakteru zboží.</li>
          <li>
            Zapečetěné zboží rozbalené z hygienických důvodů (např. olejové
            filtry, brzdové kapaliny).
          </li>
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
          <h3 className="font-bold text-gray-900 mb-2">
            Potřebujete pomoc?
          </h3>
          <p className="text-gray-600 leading-relaxed m-0">
            Ozvěte se nám na{" "}
            <a
              href="mailto:info@carmakler.cz"
              className="text-orange-500 hover:underline"
            >
              info@carmakler.cz
            </a>{" "}
            — rádi vám poradíme.
          </p>
        </div>
      </div>
    </>
  );
}
