import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Reklamační řád",
  description:
    "Reklamační řád e-shopu CarMakler. Záruční doby, uplatnění reklamace, odstoupení od smlouvy, mimosoudní řešení sporů.",
  openGraph: {
    title: "Reklamační řád | CarMakler",
    description:
      "Reklamační řád e-shopu s autodíly CarMakler — záruční doby, postup reklamace, práva spotřebitele.",
  },
  alternates: {
    canonical: `${BASE_URL}/reklamacni-rad`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Reklamační řád — CarMakler",
  url: `${BASE_URL}/reklamacni-rad`,
  description: "Reklamační řád e-shopu CarMakler",
  isPartOf: {
    "@type": "WebSite",
    name: "CarMakler",
    url: BASE_URL,
  },
};

/* ============================================================
   POZNAMKA PRO IMPLEMENTATORA:
   Texty nize odpovidaji ceske legislative (OZ, ZOS).
   Pred launchem MUSI byt revidovany pravnikem.
   Placeholder [DOPLNIT] oznacuje mista vyzadujici realne udaje.
   ============================================================ */

export default function ReklamacniRadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Domů", href: "/" },
          { label: "Reklamační řád" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Reklamační řád
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Platný od [DOPLNIT DATUM] | Poslední aktualizace: [DOPLNIT DATUM]
        </p>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline">

          {/* 1. Obecná ustanovení */}
          <section id="obecna-ustanoveni">
            <h2>1. Obecná ustanovení</h2>
            <p>
              Tento reklamační řád upravuje postup při uplatňování práv z vadného plnění (dále jen
              &bdquo;reklamace&ldquo;) u zboží zakoupeného prostřednictvím e-shopu CarMakler.
            </p>
            <p>
              <strong>Provozovatel a prodávající:</strong> CarMakler s.r.o., IČO: [DOPLNIT],
              se sídlem [DOPLNIT ADRESA].
            </p>
            <p>
              Reklamační řád je vydaný v souladu se zákonem č. 89/2012 Sb., občanský zákoník (dále jen
              &bdquo;OZ&ldquo;), a zákonem č. 634/1992 Sb., o ochraně spotřebitele (dále jen &bdquo;ZOS&ldquo;).
            </p>
          </section>

          {/* 2. Záruční doby */}
          <section id="zarucni-doby">
            <h2>2. Záruční doby</h2>

            <div className="not-prose mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <div className="text-2xl font-extrabold text-green-700 mb-1">24 měsíců</div>
                  <div className="text-sm font-semibold text-green-800 mb-2">Nové díly (aftermarket)</div>
                  <p className="text-sm text-green-700">
                    Dle § 2165 OZ. Záruka běží od převzetí zboží kupujícím.
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                  <div className="text-2xl font-extrabold text-orange-700 mb-1">12 měsíců</div>
                  <div className="text-sm font-semibold text-orange-800 mb-2">Použité díly (z vrakoviště)</div>
                  <p className="text-sm text-orange-700">
                    Dle § 2167 OZ — zkrácená záruční doba u použitého zboží, na které byl kupující upozorněn.
                  </p>
                </div>
              </div>
            </div>

            <h3>Záruka se nevztahuje na</h3>
            <ul>
              <li>Běžné opotřebení zboží způsobené jeho obvyklým užíváním.</li>
              <li>Mechanické poškození zboží kupujícím (např. při montáži).</li>
              <li>Vady způsobené nesprávnou montáží nebo použitím v rozporu s návodem či účelem zboží.</li>
              <li>Vady způsobené použitím nekompatibilního zboží nebo úpravami ze strany kupujícího.</li>
            </ul>
          </section>

          {/* 3. Odstoupení od smlouvy */}
          <section id="odstoupeni">
            <h2>3. Odstoupení od smlouvy (14 dní)</h2>
            <p>
              Spotřebitel má právo odstoupit od kupní smlouvy uzavřené distančním způsobem bez udání
              důvodu ve lhůtě <strong>14 dní</strong> ode dne převzetí zboží (§ 1829 OZ).
            </p>
            <h3>Postup pro odstoupení</h3>
            <ol>
              <li>
                Informujte nás o rozhodnutí odstoupit od smlouvy e-mailem na{" "}
                <a href="mailto:info@carmakler.cz">info@carmakler.cz</a> nebo přes formulář na webu.
                Uveďte číslo objednávky a důvod vrácení.
              </li>
              <li>
                Zboží zašlete zpět na adresu <strong>[DOPLNIT ADRESA PRO VRÁCENÍ]</strong> do 14 dní
                od odstoupení. Náklady na zpětné zasílání nese kupující.
              </li>
              <li>
                Zboží musí být nepoškozené, nenamontované a pokud možno v původním obalu.
              </li>
              <li>
                Peněžní prostředky vám vrátíme do 14 dní od obdržení vráceného zboží, stejnou platební
                metodou, jakou jste použili při platbě.
              </li>
            </ol>
            <h3>Výjimky z práva na odstoupení (§ 1837 OZ)</h3>
            <ul>
              <li>Zboží upravené podle přání kupujícího nebo na jeho míru.</li>
              <li>Použité díly, které byly po převzetí namontovány na vozidlo (došlo ke změně charakteru zboží).</li>
              <li>Zboží v zapečetěném obalu, které bylo z hygienických důvodů po dodání rozbaleno (např. filtry).</li>
            </ul>
          </section>

          {/* 4. Uplatnění reklamace */}
          <section id="uplatneni-reklamace">
            <h2>4. Uplatnění reklamace</h2>
            <h3>Kde a jak reklamovat</h3>
            <p>Reklamaci uplatníte:</p>
            <ul>
              <li>
                <strong>E-mailem:</strong>{" "}
                <a href="mailto:reklamace@carmakler.cz">reklamace@carmakler.cz</a>
              </li>
              <li>
                <strong>Prostřednictvím formuláře</strong> v sekci &bdquo;Moje objednávky&ldquo; na webu.
              </li>
            </ul>
            <h3>Co uvést při reklamaci</h3>
            <ul>
              <li>Číslo objednávky</li>
              <li>Popis závady (co přesně nefunguje, kdy se vada projevila)</li>
              <li>Fotodokumentace závady (minimálně 2 fotky)</li>
              <li>Požadovaný způsob vyřízení (oprava, výměna, sleva, vrácení peněz)</li>
            </ul>
            <h3>Potvrzení přijetí</h3>
            <p>
              Prodávající potvrdí přijetí reklamace e-mailem do <strong>3 pracovních dnů</strong>
              od jejího obdržení. V potvrzení uvede číslo reklamace (RMA), předpokládaný postup a
              harmonogram vyřízení.
            </p>
            <h3>Specifika pro díly z vrakoviště</h3>
            <p>
              Reklamace dílu od externího dodavatele (vrakoviště) je postoupena tomuto dodavateli.
              CarMakler zajišťuje koordinaci a komunikaci mezi kupujícím a dodavatelem. Lhůta pro
              vyřízení se tím nemění.
            </p>
          </section>

          {/* 5. Lhůty pro vyřízení */}
          <section id="lhuty">
            <h2>5. Lhůty pro vyřízení reklamace</h2>

            <div className="not-prose mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="text-2xl font-extrabold text-blue-700 mb-1">30 kalendářních dní</div>
                <p className="text-sm text-blue-700">
                  Zákonný limit pro vyřízení reklamace od jejího uplatnění (§ 19 odst. 3 ZOS).
                  Ve zvlášť složitých případech může být po dohodě s kupujícím prodloužena.
                </p>
              </div>
            </div>

            <p>
              Pokud není reklamace vyřízena ve lhůtě 30 dní, má kupující právo od smlouvy odstoupit
              nebo požadovat přiměřenou slevu z ceny.
            </p>
          </section>

          {/* 6. Způsob vyřízení */}
          <section id="zpusob-vyrizeni">
            <h2>6. Způsoby vyřízení reklamace</h2>
            <p>Reklamace může být vyřízena následujícím způsobem (dle povahy vady a požadavku kupujícího):</p>
            <ol>
              <li><strong>Oprava zboží</strong> — pokud je vada odstranitelná.</li>
              <li><strong>Výměna zboží</strong> za nový/jiný kus stejného druhu — pokud oprava není možná.</li>
              <li><strong>Přiměřená sleva z kupní ceny</strong> — pokud kupující souhlasí s ponecháním vadného zboží.</li>
              <li><strong>Úplné vrácení kupní ceny</strong> — pokud je vada neodstranitelná a zboží nelze vyměnit.</li>
            </ol>
            <p>
              Při oprávněné reklamaci má kupující nárok na úhradu nákladů na zaslání vadného zboží
              zpět prodávajícímu (dle nejlevnější dostupné možnosti doručení).
            </p>
          </section>

          {/* 7. Náklady */}
          <section id="naklady">
            <h2>7. Náklady spojené s reklamací</h2>
            <ul>
              <li>
                <strong>Oprávněná reklamace:</strong> náklady na zaslání vadného zboží nese prodávající.
                Kupující bude vyzván k zaslání údajů pro úhradu poštovného.
              </li>
              <li>
                <strong>Neoprávněná reklamace:</strong> náklady na dopravu a případné posouzení nese kupující.
                Zboží bude kupujícímu vráceno na jeho náklady.
              </li>
            </ul>
          </section>

          {/* 8. Mimosoudní řešení */}
          <section id="mimosoudni-reseni">
            <h2>8. Mimosoudní řešení sporů</h2>
            <p>
              K mimosoudnímu řešení spotřebitelských sporů z kupní smlouvy je příslušná:
            </p>
            <p>
              <strong>Česká obchodní inspekce</strong><br />
              Ústřední inspektorát — oddělení ADR<br />
              Štěpánská 567/15, 120 00 Praha 2<br />
              Tel.: +420 296 366 360<br />
              Web: <a href="https://www.coi.cz/informace-o-adr/" target="_blank" rel="noopener noreferrer">www.coi.cz/informace-o-adr/</a><br />
              E-mail: <a href="mailto:adr@coi.cz">adr@coi.cz</a>
            </p>
            <p>
              Spotřebitel může využít rovněž platformu pro řešení sporů online (ODR) zřízenou
              Evropskou komisí:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          {/* 9. Kontaktní údaje pro reklamace */}
          <section id="kontaktni-udaje">
            <h2>9. Kontaktní údaje pro reklamace</h2>
            <ul>
              <li><strong>E-mail:</strong> <a href="mailto:reklamace@carmakler.cz">reklamace@carmakler.cz</a></li>
              <li><strong>Telefon:</strong> [DOPLNIT]</li>
              <li><strong>Adresa pro zasílání:</strong> [DOPLNIT ADRESA]</li>
            </ul>
          </section>

          {/* 10. Formulář pro reklamaci */}
          <section id="formular">
            <h2>10. Formulář pro reklamaci a odstoupení od smlouvy</h2>
            <p>
              Pro uplatnění reklamace nebo odstoupení od smlouvy můžete použít náš online formulář
              v sekci &bdquo;Moje objednávky&ldquo; po přihlášení, nebo nás kontaktujte e-mailem.
            </p>
            <p>
              Vzorový formulář pro odstoupení od smlouvy je ke stažení v sekci
              &bdquo;Moje objednávky&ldquo; po přihlášení, nebo nás kontaktujte e-mailem.
            </p>
            <p>
              Podrobné obchodní podmínky včetně informací o objednávkovém procesu najdete na stránce{" "}
              <Link href="/obchodni-podminky">Obchodní podmínky</Link>.
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
