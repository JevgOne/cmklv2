import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Ochrana osobnich udaju",
  description:
    "Informace o zpracovani osobnich udaju na platforme CarMakler dle GDPR a zakona 110/2019 Sb.",
  openGraph: {
    title: "Ochrana osobnich udaju | CarMakler",
    description:
      "Zasady ochrany osobnich udaju platformy CarMakler — spravce, ucely zpracovani, prava subjektu.",
  },
  alternates: {
    canonical: `${BASE_URL}/ochrana-osobnich-udaju`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Ochrana osobnich udaju — CarMakler",
  url: `${BASE_URL}/ochrana-osobnich-udaju`,
  description: "Zasady ochrany osobnich udaju platformy CarMakler dle GDPR",
  isPartOf: {
    "@type": "WebSite",
    name: "CarMakler",
    url: BASE_URL,
  },
};

/* ============================================================
   POZNAMKA PRO IMPLEMENTATORA:
   Texty nize jsou sablona dle GDPR cl. 13 a 14.
   Pred launchem MUSI byt revidovany pravnikem/DPO.
   Placeholder [DOPLNIT] oznacuje mista vyzadujici realne udaje.
   ============================================================ */

export default function OchranaOsobnichUdajuPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Domu", href: "/" },
          { label: "Ochrana osobnich udaju" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Ochrana osobnich udaju
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Platne od [DOPLNIT DATUM] | Posledni aktualizace: [DOPLNIT DATUM]
        </p>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline">

          {/* 1. Spravce */}
          <section id="spravce">
            <h2>1. Spravce osobnich udaju</h2>
            <p>
              Spravcem osobnich udaju je <strong>CarMakler s.r.o.</strong>, ICO: [DOPLNIT],
              se sidlem [DOPLNIT ADRESA], zapsana v obchodnim rejstriku vedenem [DOPLNIT] soudem.
            </p>
            <p>
              <strong>Kontakt pro ochranu osobnich udaju:</strong><br />
              E-mail: <a href="mailto:gdpr@carmakler.cz">gdpr@carmakler.cz</a><br />
              Telefon: [DOPLNIT]<br />
              Adresa: [DOPLNIT ADRESA]
            </p>
          </section>

          {/* 2. Ucely zpracovani */}
          <section id="ucely-zpracovani">
            <h2>2. Ucely zpracovani a pravni zaklady</h2>
            <p>Vase osobni udaje zpracovavame pro nasledujici ucely:</p>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Ucel</th>
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Pravni zaklad</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Doba uchovani</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Registrace uzivatelskeho uctu</td>
                    <td className="py-3 pr-4">Plneni smlouvy (cl. 6 odst. 1 pism. b GDPR)</td>
                    <td className="py-3">Po dobu trvani uctu + 3 roky</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Zpracovani objednavky v e-shopu</td>
                    <td className="py-3 pr-4">Plneni smlouvy (cl. 6/1b)</td>
                    <td className="py-3">10 let (danove a ucetni predpisy)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Podani inzeratu na prodej vozidla</td>
                    <td className="py-3 pr-4">Plneni smlouvy (cl. 6/1b)</td>
                    <td className="py-3">Po dobu inzeratu + 1 rok</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Maklerske sluzby (zprostredkovani prodeje)</td>
                    <td className="py-3 pr-4">Plneni smlouvy (cl. 6/1b)</td>
                    <td className="py-3">10 let (danove ucely)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Investicni marketplace (dealeri/investori)</td>
                    <td className="py-3 pr-4">Plneni smlouvy (cl. 6/1b)</td>
                    <td className="py-3">10 let</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Kontaktni formular / dotaz</td>
                    <td className="py-3 pr-4">Opravneny zajem (cl. 6/1f)</td>
                    <td className="py-3">1 rok od posledni komunikace</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Hlidaci pes (watchdog) — notifikace o novych vozidlech</td>
                    <td className="py-3 pr-4">Souhlas (cl. 6/1a)</td>
                    <td className="py-3">Do odvolani souhlasu</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Analyza navstevnosti webu (Plausible Analytics)</td>
                    <td className="py-3 pr-4">Opravneny zajem (cl. 6/1f)</td>
                    <td className="py-3">Agregovane, bez identifikace</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Cookies (analyticke, marketingove)</td>
                    <td className="py-3 pr-4">Souhlas (cl. 6/1a)</td>
                    <td className="py-3">Viz <Link href="/zasady-cookies">Zasady cookies</Link></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Kategorie udaju */}
          <section id="kategorie-udaju">
            <h2>3. Kategorie zpracovavanych udaju</h2>
            <ul>
              <li><strong>Identifikacni udaje:</strong> jmeno, prijmeni, e-mail, telefon, ICO (u podnikatelu).</li>
              <li><strong>Adresni udaje:</strong> ulice, mesto, PSC (pro doruceni a fakturaci).</li>
              <li><strong>Financni udaje:</strong> bankovni ucet (makleri, dodavatele), platebni informace.</li>
              <li><strong>Technicke udaje:</strong> IP adresa, typ prohlizece, cookie identifikatory.</li>
              <li><strong>Udaje o vozidle:</strong> VIN, znacka, model, rok vyroby, fotografie (pri inzerci a maklerskich sluzbah).</li>
              <li><strong>Komunikace:</strong> obsah zprav z kontaktniho formulare, e-mailova korespondence.</li>
            </ul>
          </section>

          {/* 4. Prijemci udaju */}
          <section id="prijemci">
            <h2>4. Prijemci osobnich udaju</h2>
            <p>Vase udaje mohou byt predany nasledujicim kategoriam prijemcu:</p>
            <ul>
              <li><strong>Poskytovatele hostingu a infrastruktury:</strong> Vercel Inc. (hosting aplikace).</li>
              <li><strong>E-mailove sluzby:</strong> Resend (odeslani transakcnich e-mailu).</li>
              <li><strong>Uloziste obrazku:</strong> Cloudinary (fotografie vozidel a dilu).</li>
              <li><strong>Analyticke nastroje:</strong> Plausible Analytics (anonymizovana analytika, bez cookies).</li>
              <li><strong>Proverka vozidel:</strong> Cebia s.r.o. (VIN proverky).</li>
              <li><strong>Dorucovaci sluzby:</strong> Zasilkovna, PPL, Ceska posta (pri doruceni zbozi).</li>
              <li><strong>Platebni brana:</strong> Stripe (zpracovani plateb — faze 2).</li>
              <li><strong>Statni organy:</strong> na zaklade zakona (napr. daňova sprava, organy cinne v trestnim rizeni).</li>
            </ul>
          </section>

          {/* 5. Predavani mimo EU */}
          <section id="predavani-mimo-eu">
            <h2>5. Predavani udaju mimo EU/EEA</h2>
            <p>
              Nektere nase poskytovatele sluzeb (Vercel, Cloudinary, Stripe) mohou zpracovavat udaje
              na serverech mimo Evropsky hospodarsky prostor (USA). V takovych pripadech je prenos
              zabezpecen standardnimi smluvnimi dolozkami (SCCs) dle cl. 46 odst. 2 pism. c GDPR
              nebo na zaklade rozhodnuti o primenosti (adequacy decision).
            </p>
          </section>

          {/* 6. Prava subjektu */}
          <section id="prava-subjektu">
            <h2>6. Vase prava</h2>
            <p>Jako subjekt udaju mate nasledujici prava:</p>
            <ul>
              <li><strong>Pravo na pristup</strong> (cl. 15 GDPR) — miste ziskat potvrzeni, zda zpracovavame vase udaje, a ziskat jejich kopii.</li>
              <li><strong>Pravo na opravu</strong> (cl. 16) — muzete pozadovat opravu nepresnych udaju.</li>
              <li><strong>Pravo na vymazani</strong> (cl. 17) — &bdquo;pravo byt zapomenut&ldquo; — muzete pozadovat smazani udaju, pokud neni duvod pro dalsi zpracovani.</li>
              <li><strong>Pravo na omezeni zpracovani</strong> (cl. 18) — muzete pozadovat docasne omezeni zpracovani.</li>
              <li><strong>Pravo na prenositelnost</strong> (cl. 20) — mate pravo ziskat sve udaje ve strojove citelnem formatu.</li>
              <li><strong>Pravo vznest namitku</strong> (cl. 21) — muzete namitat proti zpracovani na zaklade opravneneho zajmu.</li>
              <li><strong>Pravo odvolat souhlas</strong> — pokud je zpracovani zalozeno na souhlasu, muzete jej kdykoliv odvolat (bez vlivu na zakonnost predchoziho zpracovani).</li>
            </ul>
            <p>
              Pro uplatneni svych prav kontaktujte nas na{" "}
              <a href="mailto:gdpr@carmakler.cz">gdpr@carmakler.cz</a>.
              Na vas pozadavek odpovime do 30 dni.
            </p>
            <h3>Pravo podat stiznost</h3>
            <p>
              Pokud se domnivate, ze vase udaje zpracovavame v rozporu s predpisy, mate pravo
              podat stiznost u dozoroveho uradu:
            </p>
            <p>
              <strong>Urad pro ochranu osobnich udaju (UOOU)</strong><br />
              Pplk. Sochorova 27, 170 00 Praha 7<br />
              Tel.: +420 234 665 111<br />
              Web: <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer">www.uoou.cz</a><br />
              E-mail: <a href="mailto:posta@uoou.cz">posta@uoou.cz</a>
            </p>
          </section>

          {/* 7. Automatizovane rozhodovani */}
          <section id="automatizovane-rozhodovani">
            <h2>7. Automatizovane rozhodovani a profilovani</h2>
            <p>
              Platforma vyuziva AI asistenta (na bazi Claude od Anthropic) pro generovani popisu
              vozidel a pomoc maklerum. Toto zpracovani nepredstavuje automatizovane rozhodovani
              s pravnimi ucinky ve smyslu cl. 22 GDPR — vsechna rozhodnuti cinni clovek.
            </p>
            <p>
              Pro ucely zobrazeni relevantnich nabidek (napr. hlidaci pes) muze dochazet k zakladnimu
              profilovani na zaklade vasich preferenci (znacka, model, cenove rozmezi). Proti tomuto
              zpracovani muzete vznest namitku.
            </p>
          </section>

          {/* 8. Cookies */}
          <section id="cookies">
            <h2>8. Cookies</h2>
            <p>
              Nase platforma pouziva cookies. Rozdelujeme je do tri kategorii:
            </p>
            <ul>
              <li><strong>Nutne cookies</strong> — nezbytne pro fungovani webu (prihlaseni, kosik, consent). Nevyzaduji souhlas.</li>
              <li><strong>Analyticke cookies</strong> — mereni navstevnosti. Vyzaduji vas souhlas.</li>
              <li><strong>Marketingove cookies</strong> — cilena reklama. Vyzaduji vas souhlas.</li>
            </ul>
            <p>
              Podrobnosti vcetne seznamu konkretnich cookies najdete na strance{" "}
              <Link href="/zasady-cookies">Zasady cookies</Link>.
              Svuj souhlas muzete kdykoliv zmenit pomoci cookie banneru na nasem webu.
            </p>
          </section>

          {/* 9. Zabezpeceni */}
          <section id="zabezpeceni">
            <h2>9. Zabezpeceni udaju</h2>
            <p>Prijimame nasledujici technicka a organizacni opatreni k ochrane vasich udaju:</p>
            <ul>
              <li>Veskera komunikace probiha pres sifrovane spojeni (HTTPS/TLS).</li>
              <li>Hesla jsou ukladana v hashovane podobe (bcrypt) — nikdy v otevrenem textu.</li>
              <li>Pristup k osobnim udajum je omezen na zaklade roli (role-based access control).</li>
              <li>Databaze je pravidelne zalohovana.</li>
              <li>Pouzivame autentizaci pres JWT tokeny s omezenou platnosti.</li>
            </ul>
          </section>

          {/* 10. Aktualizace */}
          <section id="aktualizace">
            <h2>10. Aktualizace tohoto dokumentu</h2>
            <p>
              Tato zasady ochrany osobnich udaju mohou byt aktualizovany. O vyznamnych zmenach vas
              budeme informovat prostrednictvim e-mailu nebo oznamenim na platforme minimalne 14 dni
              pred ucinnosti novych zasad.
            </p>
            <p>
              Datum posledni aktualizace je uvedeno v hlavicce tohoto dokumentu.
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
