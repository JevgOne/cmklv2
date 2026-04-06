import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/web/Breadcrumbs";
import { BASE_URL } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Obchodní podmínky",
  description:
    "Obchodní podmínky platformy CarMakler. Podmínky pro nákup autodílů, inzertní služby, makléřské služby a investiční marketplace.",
  openGraph: {
    title: "Obchodní podmínky | CarMakler",
    description:
      "Obchodní podmínky platformy CarMakler — e-shop s autodíly, inzerce vozidel, makléřské služby.",
  },
  alternates: {
    canonical: `${BASE_URL}/obchodni-podminky`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Obchodní podmínky — CarMakler",
  url: `${BASE_URL}/obchodni-podminky`,
  description: "Obchodní podmínky platformy CarMakler",
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
          { label: "Domů", href: "/" },
          { label: "Obchodní podmínky" },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Obchodní podmínky
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Platné od [DOPLNIT DATUM] | Poslední aktualizace: [DOPLNIT DATUM]
        </p>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-orange-500 prose-a:no-underline hover:prose-a:underline">

          {/* 1. Úvodní ustanovení */}
          <section id="uvodni-ustanoveni">
            <h2>1. Úvodní ustanovení a definice pojmů</h2>
            <p>
              Tyto obchodní podmínky (dále jen &bdquo;podmínky&ldquo;) upravují vzájemná práva a povinnosti
              mezi provozovatelem platformy a jejími uživateli.
            </p>
            <p>
              <strong>Provozovatel:</strong> CarMakler s.r.o., IČO: [DOPLNIT], se sídlem [DOPLNIT ADRESA],
              zapsaná v obchodním rejstříku vedeném [DOPLNIT] soudem v [DOPLNIT], oddíl C, vložka [DOPLNIT].
            </p>
            <p>
              <strong>Kontakt:</strong> e-mail info@carmakler.cz, telefon [DOPLNIT].
            </p>
            <h3>Definice</h3>
            <ul>
              <li><strong>Prodávající</strong> — provozovatel platformy CarMakler s.r.o.</li>
              <li><strong>Kupující</strong> — fyzická nebo právnická osoba, která prostřednictvím platformy objednává zboží nebo služby.</li>
              <li><strong>Zboží</strong> — autodíly (nové i použité) nabízené v e-shopu.</li>
              <li><strong>Služba</strong> — inzertní služby, makléřské služby zprostředkování prodeje vozidel, investiční marketplace.</li>
              <li><strong>Platforma</strong> — webová aplikace dostupná na doméně carmakler.cz a jejích subdoménách.</li>
              <li><strong>Spotřebitel</strong> — kupující, který je fyzickou osobou a nejedná v rámci své podnikatelské činnosti.</li>
            </ul>
          </section>

          {/* 2. Objednávkový proces */}
          <section id="objednavkovy-proces">
            <h2>2. Objednávkový proces (e-shop autodíly)</h2>
            <p>
              Zboží prezentované v e-shopu není nabídkou k uzavření smlouvy ve smyslu § 1732 odst. 2
              občanského zákoníku, ale výzvou k podání nabídky.
            </p>
            <ol>
              <li>Kupující vloží zboží do košíku a vyplní dodací a fakturační údaje.</li>
              <li>Před odesláním objednávky má kupující možnost zkontrolovat a měnit údaje (§ 1826 OZ).</li>
              <li>Odesláním objednávky kupující potvrzuje, že se seznámil s těmito podmínkami.</li>
              <li>Prodávající neprodleně potvrdí přijetí objednávky e-mailem. Toto potvrzení je akceptací nabídky a okamžikem uzavření kupní smlouvy.</li>
            </ol>
            <p>
              Prodávající si vyhrazuje právo odmítnout objednávku, pokud je zboží nedostupné (zvláště
              u použitých dílů, které jsou unikáty). V takovém případě kupujícího neprodleně informuje.
            </p>
          </section>

          {/* 3. Ceny a platební podmínky */}
          <section id="ceny-a-platby">
            <h2>3. Ceny a platební podmínky</h2>
            <p>
              Všechny ceny v e-shopu jsou uvedeny <strong>včetně DPH</strong> a všech povinných poplatků.
              Celková cena objednávky včetně dopravy je kupujícímu zobrazena před odesláním objednávky.
            </p>
            <h3>Způsoby platby</h3>
            <ul>
              <li><strong>Bankovní převod</strong> — platba předem na účet prodávajícího. Zboží je expedováno po připsání platby.</li>
              <li><strong>Dobírka</strong> — platba při převzetí zboží. Příplatek dle aktuálního ceníku dopravce.</li>
            </ul>
            <p>
              Prodávající si vyhrazuje právo rozšířit platební metody (např. o platbu kartou online).
            </p>
          </section>

          {/* 4. Dodání zboží */}
          <section id="dodani-zbozi">
            <h2>4. Dodání zboží</h2>
            <h3>Způsoby doručení</h3>
            <ul>
              <li><strong>Zásilkovna</strong> — doručení na výdejní místo dle výběru kupujícího.</li>
              <li><strong>PPL</strong> — doručení na adresu.</li>
              <li><strong>Česká pošta</strong> — doručení na adresu.</li>
              <li><strong>Osobní odběr</strong> — u dodavatele dle dostupnosti.</li>
            </ul>
            <h3>Dodací lhůty</h3>
            <p>
              Obvyklá dodací lhůta je 2–7 pracovních dní od potvrzení objednávky (resp. od připsání
              platby u převodu). U použitých dílů z vrakovišť může být lhůta delší.
              Prodávající informuje kupujícího o předpokládaném termínu doručení.
            </p>
            <h3>Náklady na doručení</h3>
            <p>
              Cena dopravy se zobrazuje při vytváření objednávky a závisí na zvoleném způsobu doručení
              a rozměrech/hmotnosti zboží. Aktuální ceník je uveden v procesu objednávky.
            </p>
          </section>

          {/* 5. Odstoupení od smlouvy */}
          <section id="odstoupeni-od-smlouvy">
            <h2>5. Odstoupení od smlouvy</h2>
            <p>
              Spotřebitel má právo odstoupit od smlouvy bez udání důvodu ve lhůtě <strong>14 dní</strong> ode
              dne převzetí zboží (§ 1829 občanského zákoníku).
            </p>
            <h3>Postup</h3>
            <ol>
              <li>Kupující informuje prodávajícího o rozhodnutí odstoupit e-mailem na info@carmakler.cz nebo prostřednictvím formuláře na webu.</li>
              <li>Kupující zašle zboží zpět na adresu [DOPLNIT] do 14 dní od odstoupení, na vlastní náklady.</li>
              <li>Zboží musí být nepoškozené, nepoužité (nemontované) a v původním obalu, je-li to možné.</li>
              <li>Prodávající vrátí kupujícímu všechny přijaté peněžní prostředky do 14 dní od obdržení vráceného zboží.</li>
            </ol>
            <h3>Výjimky z práva na odstoupení (§ 1837 OZ)</h3>
            <ul>
              <li>Zboží upravené podle přání kupujícího nebo na jeho míru.</li>
              <li>Použité díly, které byly po převzetí namontovány na vozidlo (změna charakteru zboží).</li>
            </ul>
          </section>

          {/* 6. Reklamace a záruka */}
          <section id="reklamace">
            <h2>6. Reklamace a záruka</h2>
            <p>
              Práva kupujícího z vadného plnění se řídí příslušnými ustanoveními občanského zákoníku
              (§ 2099–2117, § 2161–2174) a zákonem o ochraně spotřebitele.
            </p>
            <ul>
              <li><strong>Nové díly:</strong> záruční doba 24 měsíců od převzetí (§ 2165 OZ).</li>
              <li><strong>Použité díly:</strong> záruční doba 12 měsíců od převzetí (§ 2167 OZ — zkrácená záruka u použitého zboží).</li>
            </ul>
            <p>
              Podrobnosti o uplatnění reklamace najdete v našem{" "}
              <Link href="/reklamacni-rad">Reklamačním řádu</Link>.
            </p>
          </section>

          {/* 7. Inzertní služby */}
          <section id="inzertni-sluzby">
            <h2>7. Inzertní služby</h2>
            <p>
              Platforma umožňuje registrovaným uživatelům vkládat inzeráty na prodej vozidel.
            </p>
            <ul>
              <li><strong>Základní inzerát:</strong> zdarma, s omezenou dobou platnosti (60 dní).</li>
              <li><strong>TOP inzerát:</strong> za poplatek dle aktuálního ceníku — zvýraznění v katalogu a prioritní zobrazení.</li>
            </ul>
            <h3>Povinnosti inzerenta</h3>
            <ul>
              <li>Inzerent odpovídá za pravdivost a úplnost uvedených údajů.</li>
              <li>Zakázáno je inzerovat vozidla s nesrovnalostmi v dokumentech, odcizená vozidla, nebo vozidla zatížená právem třetí osoby bez uvedení této skutečnosti.</li>
              <li>Provozovatel si vyhrazuje právo odstranit inzerát, který porušuje tyto podmínky, bez náhrady.</li>
            </ul>
          </section>

          {/* 8. Makléřské služby */}
          <section id="maklerske-sluzby">
            <h2>8. Makléřské služby</h2>
            <p>
              CarMakler zprostředkovává prodej vozidel prostřednictvím sítě certifikovaných makléřů.
            </p>
            <ul>
              <li><strong>Provize:</strong> 5 % z prodejní ceny, minimálně 25 000 Kč včetně DPH.</li>
              <li>Spolupráce se řídí samostatnou smlouvou o zprostředkování.</li>
              <li>Makléř provádí: nacenění vozidla, fotografie, vytvoření inzerátu, organizaci prohlídek, přípravu kupní smlouvy a asistenci při přepisu.</li>
            </ul>
          </section>

          {/* 9. Marketplace */}
          <section id="marketplace">
            <h2>9. Investiční marketplace</h2>
            <p>
              Uzavřená platforma pro ověřené dealery a investory. Přístup podléhá verifikaci.
            </p>
            <ul>
              <li><strong>Dělení zisku:</strong> 40 % investor, 40 % dealer, 20 % CarMakler.</li>
              <li>Vozidlo se kupuje na firmu CarMakler s.r.o.; po prodeji se zisk dělí dle smluvního poměru.</li>
              <li>Podrobnosti upravuje samostatná investiční smlouva.</li>
            </ul>
          </section>

          {/* 10. Ochrana osobních údajů */}
          <section id="ochrana-udaju">
            <h2>10. Ochrana osobních údajů</h2>
            <p>
              Informace o zpracování osobních údajů najdete na stránce{" "}
              <Link href="/ochrana-osobnich-udaju">Ochrana osobních údajů</Link>.
            </p>
          </section>

          {/* 11. Závěrečná ustanovení */}
          <section id="zaverecna-ustanoveni">
            <h2>11. Závěrečná ustanovení</h2>
            <p>
              Tyto podmínky se řídí právním řádem České republiky. Případné spory budou řešeny
              příslušnými soudy České republiky.
            </p>
            <h3>Mimosoudní řešení spotřebitelských sporů</h3>
            <p>
              K mimosoudnímu řešení spotřebitelských sporů z kupní smlouvy je příslušná
              <strong> Česká obchodní inspekce</strong>, se sídlem Štěpánská 567/15, 120 00 Praha 2,
              IČO: 000 20 869, web:{" "}
              <a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer">
                www.coi.cz
              </a>
              .
            </p>
            <p>
              Spotřebitel může využít rovněž platformu pro řešení sporů online (ODR) zřízenou
              Evropskou komisí na adrese:{" "}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr
              </a>
              .
            </p>
            <h3>Změna podmínek</h3>
            <p>
              Prodávající si vyhrazuje právo tyto podmínky měnit. O změně bude kupující informován
              minimálně 14 dní před účinností nových podmínek prostřednictvím e-mailu nebo oznámením
              na platformě. Pokračováním v užívání platformy po účinnosti nových podmínek kupující
              vyjadřuje svůj souhlas s nimi.
            </p>
          </section>

        </div>
      </div>
    </>
  );
}
