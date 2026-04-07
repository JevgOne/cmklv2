import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Ochrana osobních údajů",
  description:
    "Informace o zpracování osobních údajů na platformě CarMakler dle GDPR a zákona 110/2019 Sb.",
  openGraph: {
    title: "Ochrana osobních údajů | CarMakler",
    description:
      "Zásady ochrany osobních údajů platformy CarMakler — správce, účely zpracování, práva subjektů.",
  },
  alternates: pageCanonical("/ochrana-osobnich-udaju"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Ochrana osobních údajů — CarMakler",
  url: `${BASE_URL}/ochrana-osobnich-udaju`,
  description: "Zásady ochrany osobních údajů platformy CarMakler dle GDPR",
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
          { label: "Domů", href: "/" },
          { label: "Ochrana osobních údajů" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Ochrana osobních údajů
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Platné od [DOPLNIT DATUM] | Poslední aktualizace: [DOPLNIT DATUM]
        </p>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline">

          {/* 1. Správce */}
          <section id="spravce">
            <h2>1. Správce osobních údajů</h2>
            <p>
              Správcem osobních údajů je <strong>CarMakler s.r.o.</strong>, IČO: [DOPLNIT],
              se sídlem [DOPLNIT ADRESA], zapsaná v obchodním rejstříku vedeném [DOPLNIT] soudem.
            </p>
            <p>
              <strong>Kontakt pro ochranu osobních údajů:</strong><br />
              E-mail: <a href="mailto:gdpr@carmakler.cz">gdpr@carmakler.cz</a><br />
              Telefon: [DOPLNIT]<br />
              Adresa: [DOPLNIT ADRESA]
            </p>
          </section>

          {/* 2. Účely zpracování */}
          <section id="ucely-zpracovani">
            <h2>2. Účely zpracování a právní základy</h2>
            <p>Vaše osobní údaje zpracováváme pro následující účely:</p>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Účel</th>
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Právní základ</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Doba uchování</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Registrace uživatelského účtu</td>
                    <td className="py-3 pr-4">Plnění smlouvy (čl. 6 odst. 1 písm. b GDPR)</td>
                    <td className="py-3">Po dobu trvání účtu + 3 roky</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Zpracování objednávky v e-shopu</td>
                    <td className="py-3 pr-4">Plnění smlouvy (čl. 6/1b)</td>
                    <td className="py-3">10 let (daňové a účetní předpisy)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Podání inzerátu na prodej vozidla</td>
                    <td className="py-3 pr-4">Plnění smlouvy (čl. 6/1b)</td>
                    <td className="py-3">Po dobu inzerátu + 1 rok</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Makléřské služby (zprostředkování prodeje)</td>
                    <td className="py-3 pr-4">Plnění smlouvy (čl. 6/1b)</td>
                    <td className="py-3">10 let (daňové účely)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Investiční marketplace (dealeři/investoři)</td>
                    <td className="py-3 pr-4">Plnění smlouvy (čl. 6/1b)</td>
                    <td className="py-3">10 let</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Kontaktní formulář / dotaz</td>
                    <td className="py-3 pr-4">Oprávněný zájem (čl. 6/1f)</td>
                    <td className="py-3">1 rok od poslední komunikace</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Hlídací pes (watchdog) — notifikace o nových vozidlech</td>
                    <td className="py-3 pr-4">Souhlas (čl. 6/1a)</td>
                    <td className="py-3">Do odvolání souhlasu</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Analýza návštěvnosti webu (Plausible Analytics)</td>
                    <td className="py-3 pr-4">Oprávněný zájem (čl. 6/1f)</td>
                    <td className="py-3">Agregované, bez identifikace</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 pr-4">Cookies (analytické, marketingové)</td>
                    <td className="py-3 pr-4">Souhlas (čl. 6/1a)</td>
                    <td className="py-3">Viz <Link href="/zasady-cookies">Zásady cookies</Link></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Kategorie údajů */}
          <section id="kategorie-udaju">
            <h2>3. Kategorie zpracovávaných údajů</h2>
            <ul>
              <li><strong>Identifikační údaje:</strong> jméno, příjmení, e-mail, telefon, IČO (u podnikatelů).</li>
              <li><strong>Adresní údaje:</strong> ulice, město, PSČ (pro doručení a fakturaci).</li>
              <li><strong>Finanční údaje:</strong> bankovní účet (makléři, dodavatelé), platební informace.</li>
              <li><strong>Technické údaje:</strong> IP adresa, typ prohlížeče, cookie identifikátory.</li>
              <li><strong>Údaje o vozidle:</strong> VIN, značka, model, rok výroby, fotografie (při inzerci a makléřských službách).</li>
              <li><strong>Komunikace:</strong> obsah zpráv z kontaktního formuláře, e-mailová korespondence.</li>
            </ul>
          </section>

          {/* 4. Příjemci údajů */}
          <section id="prijemci">
            <h2>4. Příjemci osobních údajů</h2>
            <p>Vaše údaje mohou být předány následujícím kategoriím příjemců:</p>
            <ul>
              <li><strong>Poskytovatelé hostingu a infrastruktury:</strong> Vercel Inc. (hosting aplikace).</li>
              <li><strong>E-mailové služby:</strong> Resend (odesílání transakčních e-mailů).</li>
              <li><strong>Úložiště obrázků:</strong> Cloudinary (fotografie vozidel a dílů).</li>
              <li><strong>Analytické nástroje:</strong> Plausible Analytics (anonymizovaná analytika, bez cookies).</li>
              <li><strong>Prověrka vozidel:</strong> Cebia s.r.o. (VIN prověrky).</li>
              <li><strong>Doručovací služby:</strong> Zásilkovna, PPL, Česká pošta (při doručení zboží).</li>
              <li><strong>Platební brána:</strong> Stripe (zpracování plateb — fáze 2).</li>
              <li><strong>Státní orgány:</strong> na základě zákona (např. daňová správa, orgány činné v trestním řízení).</li>
            </ul>
          </section>

          {/* 5. Předávání mimo EU */}
          <section id="predavani-mimo-eu">
            <h2>5. Předávání údajů mimo EU/EEA</h2>
            <p>
              Někteří naši poskytovatelé služeb (Vercel, Cloudinary, Stripe) mohou zpracovávat údaje
              na serverech mimo Evropský hospodářský prostor (USA). V takových případech je přenos
              zabezpečen standardními smluvními doložkami (SCCs) dle čl. 46 odst. 2 písm. c GDPR
              nebo na základě rozhodnutí o přiměřenosti (adequacy decision).
            </p>
          </section>

          {/* 6. Práva subjektů */}
          <section id="prava-subjektu">
            <h2>6. Vaše práva</h2>
            <p>Jako subjekt údajů máte následující práva:</p>
            <ul>
              <li><strong>Právo na přístup</strong> (čl. 15 GDPR) — máte právo získat potvrzení, zda zpracováváme vaše údaje, a získat jejich kopii.</li>
              <li><strong>Právo na opravu</strong> (čl. 16) — můžete požadovat opravu nepřesných údajů.</li>
              <li><strong>Právo na výmaz</strong> (čl. 17) — &bdquo;právo být zapomenut&ldquo; — můžete požadovat smazání údajů, pokud není důvod pro další zpracování.</li>
              <li><strong>Právo na omezení zpracování</strong> (čl. 18) — můžete požadovat dočasné omezení zpracování.</li>
              <li><strong>Právo na přenositelnost</strong> (čl. 20) — máte právo získat své údaje ve strojově čitelném formátu.</li>
              <li><strong>Právo vznést námitku</strong> (čl. 21) — můžete namítat proti zpracování na základě oprávněného zájmu.</li>
              <li><strong>Právo odvolat souhlas</strong> — pokud je zpracování založeno na souhlasu, můžete jej kdykoliv odvolat (bez vlivu na zákonnost předchozího zpracování).</li>
            </ul>
            <p>
              Pro uplatnění svých práv kontaktujte nás na{" "}
              <a href="mailto:gdpr@carmakler.cz">gdpr@carmakler.cz</a>.
              Na váš požadavek odpovíme do 30 dní.
            </p>
            <h3>Právo podat stížnost</h3>
            <p>
              Pokud se domníváte, že vaše údaje zpracováváme v rozporu s předpisy, máte právo
              podat stížnost u dozorového úřadu:
            </p>
            <p>
              <strong>Úřad pro ochranu osobních údajů (ÚOOÚ)</strong><br />
              Pplk. Sochorova 27, 170 00 Praha 7<br />
              Tel.: +420 234 665 111<br />
              Web: <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer">www.uoou.cz</a><br />
              E-mail: <a href="mailto:posta@uoou.cz">posta@uoou.cz</a>
            </p>
          </section>

          {/* 7. Automatizované rozhodování */}
          <section id="automatizovane-rozhodovani">
            <h2>7. Automatizované rozhodování a profilování</h2>
            <p>
              Platforma využívá AI asistenta (na bázi Claude od Anthropic) pro generování popisů
              vozidel a pomoc makléřům. Toto zpracování nepředstavuje automatizované rozhodování
              s právními účinky ve smyslu čl. 22 GDPR — všechna rozhodnutí činí člověk.
            </p>
            <p>
              Pro účely zobrazení relevantních nabídek (např. hlídací pes) může docházet k základnímu
              profilování na základě vašich preferencí (značka, model, cenové rozmezí). Proti tomuto
              zpracování můžete vznést námitku.
            </p>
          </section>

          {/* 8. Cookies */}
          <section id="cookies">
            <h2>8. Cookies</h2>
            <p>
              Naše platforma používá cookies. Rozdělujeme je do tří kategorií:
            </p>
            <ul>
              <li><strong>Nutné cookies</strong> — nezbytné pro fungování webu (přihlášení, košík, consent). Nevyžadují souhlas.</li>
              <li><strong>Analytické cookies</strong> — měření návštěvnosti. Vyžadují váš souhlas.</li>
              <li><strong>Marketingové cookies</strong> — cílená reklama. Vyžadují váš souhlas.</li>
            </ul>
            <p>
              Podrobnosti včetně seznamu konkrétních cookies najdete na stránce{" "}
              <Link href="/zasady-cookies">Zásady cookies</Link>.
              Svůj souhlas můžete kdykoliv změnit pomocí cookie banneru na našem webu.
            </p>
          </section>

          {/* 9. Zabezpečení */}
          <section id="zabezpeceni">
            <h2>9. Zabezpečení údajů</h2>
            <p>Přijímáme následující technická a organizační opatření k ochraně vašich údajů:</p>
            <ul>
              <li>Veškerá komunikace probíhá přes šifrované spojení (HTTPS/TLS).</li>
              <li>Hesla jsou ukládána v hashované podobě (bcrypt) — nikdy v otevřeném textu.</li>
              <li>Přístup k osobním údajům je omezen na základě rolí (role-based access control).</li>
              <li>Databáze je pravidelně zálohována.</li>
              <li>Používáme autentizaci přes JWT tokeny s omezenou platností.</li>
            </ul>
          </section>

          {/* 10. Aktualizace */}
          <section id="aktualizace">
            <h2>10. Aktualizace tohoto dokumentu</h2>
            <p>
              Tyto zásady ochrany osobních údajů mohou být aktualizovány. O významných změnách vás
              budeme informovat prostřednictvím e-mailu nebo oznámením na platformě minimálně 14 dní
              před účinností nových zásad.
            </p>
            <p>
              Datum poslední aktualizace je uvedeno v hlavičce tohoto dokumentu.
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
