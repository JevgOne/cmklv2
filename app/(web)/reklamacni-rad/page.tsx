import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Reklamacni rad",
  description:
    "Reklamacni rad e-shopu CarMakler. Zarucni doby, uplatneni reklamace, odstoupeni od smlouvy, mimosoudni reseni sporu.",
  openGraph: {
    title: "Reklamacni rad | CarMakler",
    description:
      "Reklamacni rad e-shopu s autodily CarMakler — zarucni doby, postup reklamace, prava spotrebitele.",
  },
  alternates: {
    canonical: `${BASE_URL}/reklamacni-rad`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Reklamacni rad — CarMakler",
  url: `${BASE_URL}/reklamacni-rad`,
  description: "Reklamacni rad e-shopu CarMakler",
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
          { label: "Domu", href: "/" },
          { label: "Reklamacni rad" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Reklamacni rad
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Platny od [DOPLNIT DATUM] | Posledni aktualizace: [DOPLNIT DATUM]
        </p>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline">

          {/* 1. Obecna ustanoveni */}
          <section id="obecna-ustanoveni">
            <h2>1. Obecna ustanoveni</h2>
            <p>
              Tento reklamacni rad upravuje postup pri uplatnovani prav z vadneho plneni (dale jen
              &bdquo;reklamace&ldquo;) u zbozi zakoupeneho prostrednictvim e-shopu CarMakler.
            </p>
            <p>
              <strong>Provozovatel a prodavajici:</strong> CarMakler s.r.o., ICO: [DOPLNIT],
              se sidlem [DOPLNIT ADRESA].
            </p>
            <p>
              Reklamacni rad je vydany v souladu se zakonem c. 89/2012 Sb., obcansky zakonik (dale jen
              &bdquo;OZ&ldquo;), a zakonem c. 634/1992 Sb., o ochrane spotrebitele (dale jen &bdquo;ZOS&ldquo;).
            </p>
          </section>

          {/* 2. Zarucni doby */}
          <section id="zarucni-doby">
            <h2>2. Zarucni doby</h2>

            <div className="not-prose mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <div className="text-2xl font-extrabold text-green-700 mb-1">24 mesicu</div>
                  <div className="text-sm font-semibold text-green-800 mb-2">Nove dily (aftermarket)</div>
                  <p className="text-sm text-green-700">
                    Dle § 2165 OZ. Zaruka bezi od prevzeti zbozi kupujicim.
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                  <div className="text-2xl font-extrabold text-orange-700 mb-1">12 mesicu</div>
                  <div className="text-sm font-semibold text-orange-800 mb-2">Pouzite dily (z vrakoviste)</div>
                  <p className="text-sm text-orange-700">
                    Dle § 2167 OZ — zkracena zarucni doba u pouziteho zbozi, na ktere byl kupujici upozornen.
                  </p>
                </div>
              </div>
            </div>

            <h3>Zaruka se nevztahuje na</h3>
            <ul>
              <li>Bezne opotrebeni zbozi zpusobene jeho obvyklym uzivanim.</li>
              <li>Mechanicke poskozeni zbozi kupujicim (napr. pri montazi).</li>
              <li>Vady zpusobene nespravnou montazi nebo pouzitim v rozporu s navodem ci ucelem zbozi.</li>
              <li>Vady zpusobene pouzitim nekompatibilniho zbozi nebo upravami ze strany kupujiciho.</li>
            </ul>
          </section>

          {/* 3. Odstoupeni od smlouvy */}
          <section id="odstoupeni">
            <h2>3. Odstoupeni od smlouvy (14 dni)</h2>
            <p>
              Spotrebitel ma pravo odstoupit od kupni smlouvy uzavrene distancnim zpusobem bez udani
              duvodu ve lhute <strong>14 dni</strong> ode dne prevzeti zbozi (§ 1829 OZ).
            </p>
            <h3>Postup pro odstoupeni</h3>
            <ol>
              <li>
                Informujte nas o rozhodnuti odstoupit od smlouvy e-mailem na{" "}
                <a href="mailto:info@carmakler.cz">info@carmakler.cz</a> nebo pres formular na webu.
                Uveste cislo objednavky a duvod vraceni.
              </li>
              <li>
                Zbozi zaslete zpet na adresu <strong>[DOPLNIT ADRESA PRO VRACENI]</strong> do 14 dni
                od odstoupeni. Naklady na zpetne zasilani nese kupujici.
              </li>
              <li>
                Zbozi musi byt neposkozone, nenamontovane a pokud mozno v puvodnim obalu.
              </li>
              <li>
                Penezni prostredky vam vratime do 14 dni od obdrzeni vraceneho zbozi, stejnou platebni
                metodou, jakou jste pouzili pri platbe.
              </li>
            </ol>
            <h3>Vyjimky z prava na odstoupeni (§ 1837 OZ)</h3>
            <ul>
              <li>Zbozi upravene podle prani kupujiciho nebo na jeho miru.</li>
              <li>Pouzite dily, ktere byly po prevzeti namontovany na vozidlo (doslo ke zmene charakteru zbozi).</li>
              <li>Zbozi v zapecetenem obalu, ktere bylo z hygienickych duvodu po dodani rozbaleno (napr. filtry).</li>
            </ul>
          </section>

          {/* 4. Uplatneni reklamace */}
          <section id="uplatneni-reklamace">
            <h2>4. Uplatneni reklamace</h2>
            <h3>Kde a jak reklamovat</h3>
            <p>Reklamaci uplatnete:</p>
            <ul>
              <li>
                <strong>E-mailem:</strong>{" "}
                <a href="mailto:reklamace@carmakler.cz">reklamace@carmakler.cz</a>
              </li>
              <li>
                <strong>Prostrednictvim formulare</strong> v sekci &bdquo;Moje objednavky&ldquo; na webu.
              </li>
            </ul>
            <h3>Co uvest pri reklamaci</h3>
            <ul>
              <li>Cislo objednavky</li>
              <li>Popis zavady (co presne nefunguje, kdy se vada projevila)</li>
              <li>Fotodokumentace zavady (minimalne 2 fotky)</li>
              <li>Pozadovany zpusob vyrizeni (oprava, vymena, sleva, vraceni penez)</li>
            </ul>
            <h3>Potvrzeni prijeti</h3>
            <p>
              Prodavajici potvrdi prijeti reklamace e-mailem do <strong>3 pracovnich dni</strong>
              od jejiho obdrzeni. V potvrzeni uvede cislo reklamace (RMA), predpokladany postup a
              harmonogram vyrizeni.
            </p>
            <h3>Specifika pro dily z vrakoviste</h3>
            <p>
              Reklamace dilu od externiho dodavatele (vrakoviste) je postoupena tomuto dodavateli.
              CarMakler zajistuje koordinaci a komunikaci mezi kupujicim a dodavatelem. Lhuta pro
              vyrizeni se tim nemeni.
            </p>
          </section>

          {/* 5. Lhuty pro vyrizeni */}
          <section id="lhuty">
            <h2>5. Lhuty pro vyrizeni reklamace</h2>

            <div className="not-prose mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="text-2xl font-extrabold text-blue-700 mb-1">30 kalendarnich dni</div>
                <p className="text-sm text-blue-700">
                  Zakonny limit pro vyrizeni reklamace od jejiho uplatneni (§ 19 odst. 3 ZOS).
                  Ve zvlaste slozitych pripadech muze byt po dohode s kupujicim prodlouzena.
                </p>
              </div>
            </div>

            <p>
              Pokud neni reklamace vyrizena ve lhute 30 dni, ma kupujici pravo od smlouvy odstoupit
              nebo pozadovat primerenou slevu z ceny.
            </p>
          </section>

          {/* 6. Zpusob vyrizeni */}
          <section id="zpusob-vyrizeni">
            <h2>6. Zpusoby vyrizeni reklamace</h2>
            <p>Reklamace muze byt vyrizena nasledujicim zpusobem (dle povahy vady a pozadavku kupujiciho):</p>
            <ol>
              <li><strong>Oprava zbozi</strong> — pokud je vada odstranitelna.</li>
              <li><strong>Vymena zbozi</strong> za novy/jiny kus stejneho druhu — pokud oprava neni mozna.</li>
              <li><strong>Primerena sleva z kupni ceny</strong> — pokud kupujici souhlasi s ponechanim vadneho zbozi.</li>
              <li><strong>Uplne vraceni kupni ceny</strong> — pokud je vada neodstranitelna a zbozi nelze vymenit.</li>
            </ol>
            <p>
              Pri opravnene reklamaci ma kupujici narok na uhradu nakladu na zaslani vadneho zbozi
              zpet prodavajicimu (dle nejlevnejsi dostupne moznosti doruceni).
            </p>
          </section>

          {/* 7. Naklady */}
          <section id="naklady">
            <h2>7. Naklady spojene s reklamaci</h2>
            <ul>
              <li>
                <strong>Opravnena reklamace:</strong> naklady na zaslani vadneho zbozi nese prodavajici.
                Kupujici bude vyzvan k zaslani udaju pro uhradu postovneho.
              </li>
              <li>
                <strong>Neopravnena reklamace:</strong> naklady na dopravu a pripadne posouzeni nese kupujici.
                Zbozi bude kupujicimu vraceno na jeho naklady.
              </li>
            </ul>
          </section>

          {/* 8. Mimosoudni reseni */}
          <section id="mimosoudni-reseni">
            <h2>8. Mimosoudni reseni sporu</h2>
            <p>
              K mimosoudnimu reseni spotrebitelskych sporu z kupni smlouvy je prislusna:
            </p>
            <p>
              <strong>Ceska obchodni inspekce</strong><br />
              Ustredni inspektorat — oddeleni ADR<br />
              Stepanska 567/15, 120 00 Praha 2<br />
              Tel.: +420 296 366 360<br />
              Web: <a href="https://www.coi.cz/informace-o-adr/" target="_blank" rel="noopener noreferrer">www.coi.cz/informace-o-adr/</a><br />
              E-mail: <a href="mailto:adr@coi.cz">adr@coi.cz</a>
            </p>
            <p>
              Spotrebitel muze vyuzit rovnez platformu pro reseni sporu online (ODR) zrizenou
              Evropskou komisi:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          {/* 9. Kontaktni udaje pro reklamace */}
          <section id="kontaktni-udaje">
            <h2>9. Kontaktni udaje pro reklamace</h2>
            <ul>
              <li><strong>E-mail:</strong> <a href="mailto:reklamace@carmakler.cz">reklamace@carmakler.cz</a></li>
              <li><strong>Telefon:</strong> [DOPLNIT]</li>
              <li><strong>Adresa pro zasilani:</strong> [DOPLNIT ADRESA]</li>
            </ul>
          </section>

          {/* 10. Formular pro reklamaci */}
          <section id="formular">
            <h2>10. Formular pro reklamaci a odstoupeni od smlouvy</h2>
            <p>
              Pro uplatneni reklamace nebo odstoupeni od smlouvy muzete pouzit nas online formular
              v sekci &bdquo;Moje objednavky&ldquo; po prihlaseni, nebo nas kontaktujte e-mailem.
            </p>
            <p>
              Vzorovy formular pro odstoupeni od smlouvy je ke stazeni:{" "}
              <strong>[TODO: pridat odkaz na PDF po implementaci]</strong>
            </p>
            <p>
              Podrobne obchodni podminky vcetne informaci o objednavkovem procesu najdete na strance{" "}
              <Link href="/obchodni-podminky">Obchodni podminky</Link>.
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
