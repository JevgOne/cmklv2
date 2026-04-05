import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Obchodni podminky",
  description:
    "Obchodni podminky platformy CarMakler. Podminky pro nakup autodilu, inzertni sluzby, maklerske sluzby a investicni marketplace.",
  openGraph: {
    title: "Obchodni podminky | CarMakler",
    description:
      "Obchodni podminky platformy CarMakler — e-shop s autodily, inzerce vozidel, maklerske sluzby.",
  },
  alternates: {
    canonical: `${BASE_URL}/obchodni-podminky`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Obchodni podminky — CarMakler",
  url: `${BASE_URL}/obchodni-podminky`,
  description: "Obchodni podminky platformy CarMakler",
  isPartOf: {
    "@type": "WebSite",
    name: "CarMakler",
    url: BASE_URL,
  },
};

/* ============================================================
   POZNAMKA PRO IMPLEMENTATORA:
   Texty nize jsou sablona odpovidajici ceske legislative.
   Pred launchem MUSI byt revidovany pravnikem.
   Placeholder [DOPLNIT] oznacuje mista vyzadujici realne udaje.
   ============================================================ */

export default function ObchodniPodminkyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Domu", href: "/" },
          { label: "Obchodni podminky" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Obchodni podminky
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Platne od [DOPLNIT DATUM] | Posledni aktualizace: [DOPLNIT DATUM]
        </p>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline">

          {/* 1. Uvodni ustanoveni */}
          <section id="uvodni-ustanoveni">
            <h2>1. Uvodni ustanoveni a definice pojmu</h2>
            <p>
              Tyto obchodni podminky (dale jen &bdquo;podminky&ldquo;) upravuji vzajemna prava a povinnosti
              mezi provozovatelem platformy a jejimi uzivateli.
            </p>
            <p>
              <strong>Provozovatel:</strong> CarMakler s.r.o., ICO: [DOPLNIT], se sidlem [DOPLNIT ADRESA],
              zapsana v obchodnim rejstriku vedenem [DOPLNIT] soudem v [DOPLNIT], oddil C, vlozka [DOPLNIT].
            </p>
            <p>
              <strong>Kontakt:</strong> e-mail info@carmakler.cz, telefon [DOPLNIT].
            </p>
            <h3>Definice</h3>
            <ul>
              <li><strong>Prodavajici</strong> — provozovatel platformy CarMakler s.r.o.</li>
              <li><strong>Kupujici</strong> — fyzicka nebo pravnicka osoba, ktera prostrednictvim platformy objednava zbozi nebo sluzby.</li>
              <li><strong>Zbozi</strong> — autodily (nove i pouzite) nabizene v e-shopu.</li>
              <li><strong>Sluzba</strong> — inzertni sluzby, maklerske sluzby zprostredkovani prodeje vozidel, investicni marketplace.</li>
              <li><strong>Platforma</strong> — webova aplikace dostupna na domene carmakler.cz a jejich subdomenach.</li>
              <li><strong>Spotrebitel</strong> — kupujici, ktery je fyzickou osobou a nejedna v ramci sve podnikatelske cinnosti.</li>
            </ul>
          </section>

          {/* 2. Objednavkovy proces */}
          <section id="objednavkovy-proces">
            <h2>2. Objednavkovy proces (e-shop autodily)</h2>
            <p>
              Zbozi prezentovane v e-shopu neni nabidkou k uzavreni smlouvy ve smyslu § 1732 odst. 2
              obcanskeho zakoniku, ale vyzva k podani nabidky.
            </p>
            <ol>
              <li>Kupujici vlozi zbozi do kosiku a vyplni dodaci a fakturacni udaje.</li>
              <li>Pred odeslanim objednavky ma kupujici moznost zkontrolovat a menit udaje (§ 1826 OZ).</li>
              <li>Odeslanim objednavky kupujici potvrzuje, ze se seznamil s temito podminkami.</li>
              <li>Prodavajici neprodlene potvrdi prijeti objednavky e-mailem. Toto potvrzeni je akceptaci nabidky a okamzikem uzavreni kupni smlouvy.</li>
            </ol>
            <p>
              Prodavajici si vyhrazuje pravo odmitnou objednavku, pokud je zbozi nedostupne (zvlaste
              u pouzitych dilu, ktere jsou unikaty). V takovem pripade kupujiciho neprodlene informuje.
            </p>
          </section>

          {/* 3. Ceny a platebni podminky */}
          <section id="ceny-a-platby">
            <h2>3. Ceny a platebni podminky</h2>
            <p>
              Vsechny ceny v e-shopu jsou uvedeny <strong>vcetne DPH</strong> a vsech povinnych poplatku.
              Celkova cena objednavky vcetne dopravy je kupujicimu zobrazena pred odeslanim objednavky.
            </p>
            <h3>Zpusoby platby</h3>
            <ul>
              <li><strong>Bankovni prevod</strong> — platba predem na ucet prodavajiciho. Zbozi je expedovano po pripisu platby.</li>
              <li><strong>Dobirka</strong> — platba pri prevzeti zbozi. Priplatek dle aktualniho ceniku dopravce.</li>
            </ul>
            <p>
              Prodavajici si vyhrazuje pravo rozsirit platebni metody (napr. o platbu kartou online).
            </p>
          </section>

          {/* 4. Dodani zbozi */}
          <section id="dodani-zbozi">
            <h2>4. Dodani zbozi</h2>
            <h3>Zpusoby doruceni</h3>
            <ul>
              <li><strong>Zasilkovna</strong> — doruceni na vydejni misto dle vyberu kupujiciho.</li>
              <li><strong>PPL</strong> — doruceni na adresu.</li>
              <li><strong>Ceska posta</strong> — doruceni na adresu.</li>
              <li><strong>Osobni odber</strong> — u dodavatele dle dostupnosti.</li>
            </ul>
            <h3>Dodaci lhuty</h3>
            <p>
              Obvykla dodaci lhuta je 2-7 pracovnich dni od potvrzeni objednavky (resp. od pripisu
              platby u prevodu). U pouzitych dilu z vrakovist muze byt lhuta delsi.
              Prodavajici informuje kupujiciho o predpokladanem terminu doruceni.
            </p>
            <h3>Naklady na doruceni</h3>
            <p>
              Cena dopravy se zobrazuje pri vytvrareni objednavky a zavisi na zvolenem zpusobu doruceni
              a rozmerech/hmotnosti zbozi. Aktualni cenik je uveden v procesu objednavky.
            </p>
          </section>

          {/* 5. Odstoupeni od smlouvy */}
          <section id="odstoupeni-od-smlouvy">
            <h2>5. Odstoupeni od smlouvy</h2>
            <p>
              Spotrebitel ma pravo odstoupit od smlouvy bez udani duvodu ve lhute <strong>14 dni</strong> ode
              dne prevzeti zbozi (§ 1829 obcanskeho zakoniku).
            </p>
            <h3>Postup</h3>
            <ol>
              <li>Kupujici informuje prodavajiciho o rozhodnuti odstoupit e-mailem na info@carmakler.cz nebo prostrednictvim formulare na webu.</li>
              <li>Kupujici zasle zbozi zpet na adresu [DOPLNIT] do 14 dni od odstoupeni, na vlastni naklady.</li>
              <li>Zbozi musi byt neposkozone, nepouzite (nemontovane) a v puvodnim obalu, je-li to mozne.</li>
              <li>Prodavajici vrati kupujicimu vsechny prijate penezni prostredky do 14 dni od obdrzeni vraceneho zbozi.</li>
            </ol>
            <h3>Vyjimky z prava na odstoupeni (§ 1837 OZ)</h3>
            <ul>
              <li>Zbozi upravene podle prani kupujiciho nebo na jeho miru.</li>
              <li>Pouzite dily, ktere byly po prevzeti namontovany na vozidlo (zmena charakteru zbozi).</li>
            </ul>
          </section>

          {/* 6. Reklamace a zaruka */}
          <section id="reklamace">
            <h2>6. Reklamace a zaruka</h2>
            <p>
              Prava kupujiciho z vadneho plneni se ridi prislusnymi ustanovenimi obcanskeho zakoniku
              (§ 2099-2117, § 2161-2174) a zakonem o ochrane spotrebitele.
            </p>
            <ul>
              <li><strong>Nove dily:</strong> zarucni doba 24 mesicu od prevzeti (§ 2165 OZ).</li>
              <li><strong>Pouzite dily:</strong> zarucni doba 12 mesicu od prevzeti (§ 2167 OZ — zkracena zaruka u pouziteho zbozi).</li>
            </ul>
            <p>
              Podrobnosti o uplatneni reklamace najdete v nasem{" "}
              <Link href="/reklamacni-rad">Reklamacnim radu</Link>.
            </p>
          </section>

          {/* 7. Inzertni sluzby */}
          <section id="inzertni-sluzby">
            <h2>7. Inzertni sluzby</h2>
            <p>
              Platforma umoznuje registrovanym uzivatelum vkladat inzeraty na prodej vozidel.
            </p>
            <ul>
              <li><strong>Zakladni inzerat:</strong> zdarma, s omezenou dobou platnosti (60 dni).</li>
              <li><strong>TOP inzerat:</strong> za poplatek dle aktualniho ceniku — zvyrazneni v katalogu a prioritni zobrazeni.</li>
            </ul>
            <h3>Povinnosti inzerenta</h3>
            <ul>
              <li>Inzerent odpovida za pravdivost a uplnost uvedenych udaju.</li>
              <li>Zakazano je inzerovat vozidla s nesrovnalostmi v dokumentech, odcizena vozidla, nebo vozidla zatizena pravem treti osoby bez uvedeni teto skutecnosti.</li>
              <li>Provozovatel si vyhrazuje pravo odstranit inzerat, ktery porousuje tyto podminky, bez nahrady.</li>
            </ul>
          </section>

          {/* 8. Maklerske sluzby */}
          <section id="maklerske-sluzby">
            <h2>8. Maklerske sluzby</h2>
            <p>
              CarMakler zprostredkovava prodej vozidel prostrednictvim site certifikovanych makleru.
            </p>
            <ul>
              <li><strong>Provize:</strong> 5 % z prodejni ceny, minimalne 25 000 Kc vcetne DPH.</li>
              <li>Spoluprace se ridi samostatnou smlouvou o zprostredkovani.</li>
              <li>Makler provadi: naceneni vozidla, fotografii, vytvoreni inzeratu, organizaci prohlidek, pripravu kupni smlouvy a asistenci pri prepisu.</li>
            </ul>
          </section>

          {/* 9. Marketplace */}
          <section id="marketplace">
            <h2>9. Investicni marketplace</h2>
            <p>
              Uzavrena platforma pro overene dealery a investory. Pristup podleha verifikaci.
            </p>
            <ul>
              <li><strong>Deleni zisku:</strong> 40 % investor, 40 % dealer, 20 % CarMakler.</li>
              <li>Vozidlo se kupuje na firmu CarMakler s.r.o.; po prodeji se zisk deli dle smluvniho pomeru.</li>
              <li>Podrobnosti upravuje samostatna investicni smlouva.</li>
            </ul>
          </section>

          {/* 10. Ochrana osobnich udaju */}
          <section id="ochrana-udaju">
            <h2>10. Ochrana osobnich udaju</h2>
            <p>
              Informace o zpracovani osobnich udaju najdete na strance{" "}
              <Link href="/ochrana-osobnich-udaju">Ochrana osobnich udaju</Link>.
            </p>
          </section>

          {/* 11. Zaverecna ustanoveni */}
          <section id="zaverecna-ustanoveni">
            <h2>11. Zaverecna ustanoveni</h2>
            <p>
              Tyto podminky se ridi pravnim radem Ceske republiky. Pripadne spory budou reseny
              prislunymi soudy Ceske republiky.
            </p>
            <h3>Mimosoudni reseni spotrebitelskych sporu</h3>
            <p>
              K mimosoudnimu reseni spotrebitelskych sporu z kupni smlouvy je prislusna
              <strong> Ceska obchodni inspekce</strong>, se sidlem Stepanska 567/15, 120 00 Praha 2,
              IcO: 000 20 869, web:{" "}
              <a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer">
                www.coi.cz
              </a>
              .
            </p>
            <p>
              Spotrebitel muze vyuzit rovnez platformu pro reseni sporu online (ODR) zrizenou
              Evropskou komisi na adrese:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr
              </a>
              .
            </p>
            <h3>Zmena podminek</h3>
            <p>
              Prodavajici si vyhrazuje pravo tyto podminky menit. O zmene bude kupujici informovan
              minimalne 14 dni pred ucinnosti novych podminek prostrednictvim e-mailu nebo oznamenim
              na platforme. Pokracovanim v uzivani platformy po ucinnosti novych podminek kupujici
              vyjadruje svuj souhlas s nimi.
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
