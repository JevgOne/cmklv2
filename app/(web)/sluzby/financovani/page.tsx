import type { Metadata } from "next";
import { ServicePage } from "@/components/web/ServicePage";
import { FinancovaniCalc } from "@/components/web/FinancovaniCalc";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Financování",
  description:
    "Výhodné financování auta na splátky do 30 minut. Bez zálohy, nízký úrok od 3,9 %, schválení online.",
  openGraph: {
    title: "Financování auta | CarMakléř",
    description:
      "Auto na splátky do 30 minut. Bez zálohy, nízký úrok od 3,9 %.",
  },
  alternates: pageCanonical("/sluzby/financovani"),
};

const steps = [
  {
    icon: "🚗",
    title: "Vyberte auto",
    description:
      "Vyberte si vůz z naší nabídky nebo přineste vlastní — financujeme obojí",
  },
  {
    icon: "🧮",
    title: "Spočítáme splátky",
    description:
      "Připravíme vám nabídku s nejlepším úrokem od našich partnerských bank",
  },
  {
    icon: "⚡",
    title: "Schválení do 30 min",
    description:
      "Online schválení bez návštěvy pobočky. Peníze na účtu ještě dnes",
  },
];

const benefits = [
  {
    icon: "🚀",
    title: "Bez zálohy",
    description:
      "Financování až 100 % ceny vozidla bez nutnosti skládat zálohu",
  },
  {
    icon: "📉",
    title: "Nízký úrok od 3,9 %",
    description:
      "Spolupracujeme s předními bankami a leasingovými společnostmi pro nejlepší sazby",
  },
  {
    icon: "💻",
    title: "Schválení online",
    description:
      "Celý proces proběhne online. Žádné papírování ani návštěvy poboček",
  },
  {
    icon: "🛡️",
    title: "Pojištění v ceně",
    description:
      "K financování získáte výhodné pojištění vozidla přímo v jedné splátce",
  },
];

const faq = [
  {
    question: "Jaké jsou podmínky pro získání financování?",
    answer:
      "Stačí být starší 18 let, mít trvalý pobyt v ČR a pravidelný příjem. Schválení je rychlé — většinou do 30 minut od podání žádosti.",
  },
  {
    question: "Mohu financovat i ojeté vozidlo?",
    answer:
      "Ano. Financujeme nová i ojetá vozidla do stáří 10 let. U starších vozidel posoudíme žádost individuálně.",
  },
  {
    question: "Je možné splatit úvěr předčasně?",
    answer:
      "Ano, předčasné splacení je možné kdykoliv bez sankčních poplatků. Zaplatíte jen poměrnou část úroků.",
  },
];

export default function FinancovaniPage() {
  return (
    <ServicePage
      hero={{
        title: "Auto na splátky do 30 minut",
        highlight: "do 30 minut",
        subtitle:
          "Výhodné financování bez zbytečného papírování",
      }}
      steps={steps}
      benefits={benefits}
      cta={<FinancovaniCalc />}
      faq={faq}
      breadcrumbLabel="Financování"
      currentService="financovani"
    />
  );
}
