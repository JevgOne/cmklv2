import type { Metadata } from "next";
import { ServicePage } from "@/components/web/ServicePage";
import { FinancovaniCalc } from "@/components/web/FinancovaniCalc";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Financování auta — schválení do 30 minut",
  description:
    "Auto na splátky bez zálohy, úrok od 3,9 %. Online schválení do 30 minut, bez návštěvy pobočky.",
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
      "Z naší nabídky nebo vlastní výběr — financujeme nová i ojetá vozidla do 10 let",
  },
  {
    icon: "🧮",
    title: "Spočítáme nejlepší splátku",
    description:
      "Porovnáme nabídky od partnerských bank a leasingových společností. Vy si vyberete tu nejlepší",
  },
  {
    icon: "⚡",
    title: "Schválení do 30 minut",
    description:
      "Online, bez papírování, bez návštěvy pobočky. Peníze na účtu ještě tentýž den",
  },
];

const benefits = [
  {
    icon: "🚀",
    title: "Bez zálohy",
    description:
      "Financování až 100 % ceny vozidla. Nemusíte mít peníze dopředu — auto můžete mít hned",
  },
  {
    icon: "📉",
    title: "Úrok od 3,9 %",
    description:
      "Díky spolupráci s předními bankami vám zajistíme sazby, které sami na pobočce nedostanete",
  },
  {
    icon: "💻",
    title: "Vše online",
    description:
      "Žádost, schválení i podpis smlouvy — vše z pohodlí domova. Na pobočku nemusíte",
  },
  {
    icon: "🛡️",
    title: "Pojištění rovnou v ceně",
    description:
      "K financování přidáme výhodné pojištění. Jedna splátka, žádné starosti navíc",
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
          "Bez zálohy, úrok od 3,9 %, schválení online. Porovnáme nabídky bank za vás.",
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
