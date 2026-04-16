/**
 * Per-category copy pro `/makleri/[slug]` landing stránku.
 * Hero H1/subheadline, FAQ pools, CTA copy, sibling label, czech grammar.
 */

export interface TagCopyInput {
  slug: string;
  label: string;
  category: string | null;
}

export interface LandingStats {
  count: number;
  totalSoldVehicles: number;
  topLevelCount: number;
  activeVehicles: number;
}

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Czech grammar pro CITY tagy: `locative` = "v Praze", `genitive` = "z Prahy".
 * Fallback = raw label (pro neznámá města neslovímé, čtenář pochopí).
 */
const CITY_LOCATIVE: Record<string, { locative: string; genitive: string }> = {
  praha: { locative: "Praze", genitive: "Prahy" },
  brno: { locative: "Brně", genitive: "Brna" },
  ostrava: { locative: "Ostravě", genitive: "Ostravy" },
  plzen: { locative: "Plzni", genitive: "Plzně" },
  liberec: { locative: "Liberci", genitive: "Liberce" },
  "hradec-kralove": {
    locative: "Hradci Králové",
    genitive: "Hradce Králové",
  },
  "ceske-budejovice": {
    locative: "Českých Budějovicích",
    genitive: "Českých Budějovic",
  },
  olomouc: { locative: "Olomouci", genitive: "Olomouce" },
};

export function inLocative(slug: string, label: string): string {
  return CITY_LOCATIVE[slug]?.locative ?? label;
}

export function inGenitive(slug: string, label: string): string {
  return CITY_LOCATIVE[slug]?.genitive ?? label;
}

export function getHeroCopy(
  tag: TagCopyInput,
  stats: LandingStats
): { eyebrow: string; h1: string; subheadline: string } {
  switch (tag.category) {
    case "CITY":
      return {
        eyebrow: "Lokalita",
        h1: `Makléři v ${inLocative(tag.slug, tag.label)}`,
        subheadline: `Najděte ověřeného makléře v ${inLocative(
          tag.slug,
          tag.label
        )} — ${stats.count} specialistů, ${stats.totalSoldVehicles} úspěšných prodejů.`,
      };
    case "BRAND":
      return {
        eyebrow: "Značka",
        h1: `Specialisté na ${tag.label}`,
        subheadline: `Prodejte své ${tag.label} přes certifikovaného specialistu. ${stats.count} makléřů s expertízou na značku.`,
      };
    case "SPECIALIZATION":
      return {
        eyebrow: "Specializace",
        h1: `Specialisté: ${tag.label}`,
        subheadline: `Makléři se specializací na ${tag.label.toLowerCase()}. Znají trh, odvod, legislativu.`,
      };
    case "SERVICE":
      return {
        eyebrow: "Služba",
        h1: tag.label,
        subheadline: `Makléři nabízející službu ${tag.label.toLowerCase()}. Rychlé jednání, férová cena, bez skrytých poplatků.`,
      };
    default:
      return {
        eyebrow: "Hashtag",
        h1: `Makléři #${tag.label}`,
        subheadline: `Certifikovaní makléři označení hashtagem #${tag.label}.`,
      };
  }
}

export interface CTACopy {
  heading: string;
  body: string;
  primary: { text: string; href: string };
  secondary?: { text: string; href: string };
}

export function getCTACopy(
  tag: TagCopyInput,
  authed: boolean,
  role?: string
): CTACopy {
  if (authed && role === "BROKER") {
    return {
      heading: `Jste makléř v oblasti ${tag.label}?`,
      body: "Přidejte si tento tag do profilu a získejte nové klienty.",
      primary: {
        text: "Přidat tag do profilu",
        href: "/muj-ucet/profil#hashtags",
      },
    };
  }

  switch (tag.category) {
    case "CITY":
      return {
        heading: `Také byste rádi prodali auto v ${inLocative(tag.slug, tag.label)}?`,
        body: "Vyberte si z certifikovaných makléřů.",
        primary: { text: "Najít makléře", href: "#broker-grid" },
        secondary: { text: "Chci se stát makléřem", href: "/registrace" },
      };
    case "BRAND":
      return {
        heading: `Chcete prodat ${tag.label}?`,
        body: "Využijte certifikovaného specialistu na tuto značku.",
        primary: { text: "Najít specialistu", href: "#broker-grid" },
        secondary: { text: "Jsem specialista", href: "/registrace" },
      };
    case "SPECIALIZATION":
      return {
        heading: `Hledáte specialistu: ${tag.label}?`,
        body: `Prohlédněte si certifikované makléře se specializací ${tag.label.toLowerCase()}.`,
        primary: { text: "Najít specialistu", href: "#broker-grid" },
        secondary: { text: "Chci se stát makléřem", href: "/registrace" },
      };
    case "SERVICE":
      return {
        heading: `Potřebujete ${tag.label.toLowerCase()}?`,
        body: "Makléři níže tuto službu poskytují.",
        primary: { text: "Najít makléře", href: "#broker-grid" },
        secondary: { text: "Chci se stát makléřem", href: "/registrace" },
      };
    default:
      return {
        heading: `Hledáte makléře #${tag.label}?`,
        body: "Vyberte si z profilů níže.",
        primary: { text: "Najít makléře", href: "#broker-grid" },
        secondary: { text: "Chci se stát makléřem", href: "/registrace" },
      };
  }
}

export function getFAQ(
  tag: TagCopyInput,
  stats: Pick<LandingStats, "count" | "totalSoldVehicles">
): FAQItem[] {
  switch (tag.category) {
    case "CITY": {
      const loc = inLocative(tag.slug, tag.label);
      return [
        {
          question: `Kolik stojí makléř v ${loc}?`,
          answer: `Makléři v síti Carmakléř si účtují provizi 5 % z prodejní ceny, minimálně 25 000 Kč. Cena zahrnuje kompletní servis — od ocenění po předání novému majiteli.`,
        },
        {
          question: `Jak dlouho trvá prodej auta přes makléře v ${loc}?`,
          answer: `Průměrně 2–4 týdny. Makléř převezme vozidlo, zajistí fotky, inzerci, komunikaci s kupci a přípravu smluv. Vy pouze převezmete peníze.`,
        },
        {
          question: `Co když moje auto má vadu — vezme ho makléř v ${loc}?`,
          answer: `Ano — makléř posoudí stav a doporučí férovou cenu. Transparentnost u prodeje hraje ve váš prospěch.`,
        },
        {
          question: `Jak si vybrat správného makléře v ${loc}?`,
          answer: `Projděte si profily níže, podívejte se na reference a úroveň (TOP/Senior/Makléř). Klikněte na "Zobrazit profil" pro detail.`,
        },
      ];
    }
    case "BRAND":
      return [
        {
          question: `Proč prodat ${tag.label} přes specialistu?`,
          answer: `Specialista na značku ${tag.label} zná kupce, má kontakty na sběratele a dokáže vyjednat vyšší cenu než generický inzerát.`,
        },
        {
          question: `Vezme specialista i staré ${tag.label}?`,
          answer: `Ano — u ${tag.label} často vzácné kusy mají i vyšší hodnotu s věkem. Specialista posoudí stav a navrhne cenu.`,
        },
        {
          question: `Kolik můžu získat za své ${tag.label}?`,
          answer: `Expertní ocenění na základě roku, nájezdu, stavu, výbavy. V síti Carmakléř je celkem ${stats.count} specialistů na ${tag.label} — kontaktujte kteréhokoliv pro odhad.`,
        },
        {
          question: `Jak probíhá prodej ${tag.label} přes specialistu?`,
          answer: `1) Předběžné ocenění. 2) Fyzická prohlídka. 3) Profesionální fotografie a inzerce. 4) Komunikace s kupci. 5) Smluvní prodej a předání.`,
        },
      ];
    case "SPECIALIZATION":
      return [
        {
          question: `Co znamená specializace "${tag.label}"?`,
          answer: `Makléři označení tagem ${tag.label} mají zkušenost a expertízu v této oblasti trhu s vozidly.`,
        },
        {
          question: "Jaké výhody přináší specializace?",
          answer: "Lepší cena, rychlejší prodej, odborná komunikace s kupci, znalost specifik (legislativa, servis, sběratelská hodnota).",
        },
        {
          question: "Kolik makléřů tuto specializaci nabízí?",
          answer: `Aktuálně ${stats.count} certifikovaných makléřů se specializuje na ${tag.label.toLowerCase()}.`,
        },
        {
          question: "Jak najít toho pravého?",
          answer: "Projděte si profily, prohlédněte referenční auta a kontaktujte toho, jehož styl vám sedí.",
        },
      ];
    case "SERVICE":
      return [
        {
          question: `Jak funguje "${tag.label}"?`,
          answer: "Proces je přizpůsobený rychlosti — makléř přijede, ocení, sepíše smlouvu a zaplatí buď hotově, nebo převodem.",
        },
        {
          question: "Dostanu hotovost nebo převodem?",
          answer: "Dle dohody — obojí je standardem. U částek nad 270 000 Kč zákon vyžaduje bezhotovostní úhradu.",
        },
        {
          question: "Co když mám auto na leasing?",
          answer: "Makléř pomůže s doplacením a odkupem — vyřízení leasingu prodlouží proces o 2–5 pracovních dní.",
        },
        {
          question: `Kolik stojí ${tag.label.toLowerCase()}?`,
          answer: "Provize je 5 % z prodejní ceny, minimálně 25 000 Kč. V případě výkupu se provize strhává z ceny.",
        },
      ];
    default:
      return [
        {
          question: `Co znamená #${tag.label}?`,
          answer: `Hashtag #${tag.label} používají certifikovaní makléři pro označení své specializace nebo servisní oblasti.`,
        },
        {
          question: "Kolik makléřů tento hashtag používá?",
          answer: `Aktuálně ${stats.count} makléřů.`,
        },
        {
          question: "Jak najít toho pravého?",
          answer: "Projděte si jejich profily níže.",
        },
      ];
  }
}

export function getSiblingSectionLabel(category: string | null): string {
  switch (category) {
    case "CITY":
      return "Další lokality";
    case "BRAND":
      return "Další značky";
    case "SPECIALIZATION":
      return "Další specializace";
    case "SERVICE":
      return "Další služby";
    default:
      return "Další hashtagy";
  }
}
