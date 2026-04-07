import type { Metadata } from "next";
import { ServicePage } from "@/components/web/ServicePage";
import { PojisteniForm } from "@/components/web/PojisteniForm";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Pojištění",
  description:
    "Povinné ručení i havarijní pojištění online. Srovnání nabídek všech pojišťoven, nejlepší cena, sjednání bez papírování.",
  openGraph: {
    title: "Pojištění auta online | CarMakléř",
    description:
      "Srovnání nabídek všech pojišťoven. Nejlepší cena, sjednání online bez papírování.",
  },
  alternates: pageCanonical("/sluzby/pojisteni"),
};

const steps = [
  {
    icon: "🔢",
    title: "Zadejte SPZ",
    description:
      "Stačí zadat registrační značku a my dohledáme údaje o vozidle",
  },
  {
    icon: "📊",
    title: "Porovnáme nabídky",
    description:
      "Srovnáme nabídky všech pojišťoven na trhu a najdeme tu nejvýhodnější",
  },
  {
    icon: "✅",
    title: "Sjednáte online",
    description:
      "Pojištění sjednáte kompletně online. Smlouvu obdržíte na email",
  },
];

const benefits = [
  {
    icon: "🏦",
    title: "Srovnání pojišťoven",
    description:
      "Porovnáváme nabídky od všech pojišťoven v ČR — najdeme tu nejlepší pro vás",
  },
  {
    icon: "💻",
    title: "Online sjednání",
    description:
      "Celý proces proběhne online. Žádné návštěvy poboček ani papírování",
  },
  {
    icon: "💰",
    title: "Nejlepší cena",
    description:
      "Garantujeme nejnižší cenu na trhu. Pokud najdete levnější, dorovnáme ji",
  },
  {
    icon: "🚫",
    title: "Bez poplatků",
    description:
      "Za srovnání a sjednání pojištění neplatíte žádné poplatky. Služba je zdarma",
  },
];

const faq = [
  {
    question: "Jaký je rozdíl mezi povinným ručením a havarijním pojištěním?",
    answer:
      "Povinné ručení kryje škody způsobené ostatním účastníkům provozu. Havarijní pojištění kryje škody na vašem vlastním vozidle — havárie, krádež, vandalismus, živelní události.",
  },
  {
    question: "Jak rychle bude pojištění platné?",
    answer:
      "Pojištění je platné okamžitě po sjednání, případně od data, které si zvolíte. Zelenou kartu obdržíte elektronicky na email.",
  },
  {
    question: "Mohu převést stávající pojištění?",
    answer:
      "Ano. Pomůžeme vám s výpovědí stávajícího pojištění a přechodem k výhodnějšímu poskytovateli bez přerušení krytí.",
  },
];

export default function PojisteniPage() {
  return (
    <ServicePage
      hero={{
        title: "Povinné ručení i havarijní online",
        highlight: "online",
        subtitle:
          "Porovnáme nabídky a najdeme tu nejlepší pro vás",
      }}
      steps={steps}
      benefits={benefits}
      cta={<PojisteniForm />}
      faq={faq}
      breadcrumbLabel="Pojištění"
    />
  );
}
