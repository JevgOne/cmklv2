import type { Metadata } from "next";
import { ServicePage } from "@/components/web/ServicePage";
import { PojisteniForm } from "@/components/web/PojisteniForm";
import { generateServiceJsonLd } from "@/lib/seo";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Pojištění auta — srovnání všech pojišťoven",
  description:
    "Porovnáme povinné ručení i havarijní pojištění od všech pojišťoven. Najdeme nejlepší cenu, sjednáte online za 3 minuty.",
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
      "Údaje o vozu doplníme automaticky — nemusíte nic vyplňovat ručně",
  },
  {
    icon: "📊",
    title: "Porovnáme všechny pojišťovny",
    description:
      "Za pár sekund vidíte nabídky od všech pojišťoven v ČR seřazené od nejlevnější",
  },
  {
    icon: "✅",
    title: "Sjednáte za 3 minuty",
    description:
      "Kliknete, podepíšete online, zelenou kartu máte na emailu. Hotovo",
  },
];

const benefits = [
  {
    icon: "🏦",
    title: "Všechny pojišťovny na jednom místě",
    description:
      "Nemusíte obcházet weby pojišťoven — porovnáme za vás a ukážeme tu nejlepší nabídku",
  },
  {
    icon: "💻",
    title: "Kompletně online",
    description:
      "Od srovnání po podpis smlouvy. Žádné pobočky, žádné papíry, žádné čekání",
  },
  {
    icon: "💰",
    title: "Garantovaně nejlepší cena",
    description:
      "Najdete levnější? Dorovnáme. Díky objemu vyjednáme ceny, které na pobočce nedostanete",
  },
  {
    icon: "🚫",
    title: "Služba je zdarma",
    description:
      "Za srovnání a sjednání neplatíte ani korunu. Provizi platí pojišťovna, ne vy",
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: generateServiceJsonLd({
            name: "Pojištění auta",
            description: "Porovnání povinného ručení i havarijního pojištění od všech pojišťoven v ČR. Sjednání online za 3 minuty, zdarma.",
            url: "https://carmakler.cz/sluzby/pojisteni",
            areaServed: "CZ",
          }),
        }}
      />
      <ServicePage
        hero={{
          title: "Povinné ručení i havarijní online",
          highlight: "online",
          subtitle:
            "Porovnáme všechny pojišťovny v ČR a najdeme tu nejlevnější. Sjednáte za 3 minuty, zdarma.",
        }}
        steps={steps}
        benefits={benefits}
        cta={<PojisteniForm />}
        faq={faq}
        breadcrumbLabel="Pojištění"
        currentService="pojisteni"
      />
    </>
  );
}
