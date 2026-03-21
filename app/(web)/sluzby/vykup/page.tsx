import type { Metadata } from "next";
import { ServicePage } from "@/components/web/ServicePage";
import { VykupForm } from "@/components/web/VykupForm";

export const metadata: Metadata = {
  title: "Výkup vozidel",
  description:
    "Rychlý a férový výkup vašeho auta. Peníze na účtu do 24 hodin, bez skrytých poplatků, přepis na počkání.",
  openGraph: {
    title: "Výkup auta za hotové | CarMakléř",
    description:
      "Férový výkup auta. Peníze na účtu do 24 hodin, bez skrytých poplatků.",
  },
};

const steps = [
  {
    icon: "📝",
    title: "Pošlete info o voze",
    description:
      "Vyplňte základní údaje o vašem vozidle — značku, model, rok a stav",
  },
  {
    icon: "💰",
    title: "Nabídneme cenu",
    description:
      "Na základě aktuálních tržních cen vám do 24 hodin pošleme férovou nabídku",
  },
  {
    icon: "🏦",
    title: "Vyplatíme do 24 h",
    description:
      "Po odsouhlasení ceny peníze pošleme na váš účet do 24 hodin",
  },
];

const benefits = [
  {
    icon: "✅",
    title: "Férová cena",
    description:
      "Nabídneme vám reálnou tržní cenu na základě aktuálních dat z trhu. Žádné podbízení",
  },
  {
    icon: "⚡",
    title: "Platba ihned",
    description:
      "Peníze na účtu do 24 hodin od schválení. Žádné čekání na kupce",
  },
  {
    icon: "🚫",
    title: "Bez skrytých poplatků",
    description:
      "Cena, kterou nabídneme, je finální. Žádné dodatečné srážky ani poplatky",
  },
  {
    icon: "📋",
    title: "Přepis na počkání",
    description:
      "Kompletní administrativu vyřídíme za vás — přepis, odhlášení, pojištění",
  },
];

const faq = [
  {
    question: "Jak se stanovuje výkupní cena?",
    answer:
      "Výkupní cenu stanovujeme na základě aktuálních tržních dat, stavu vozidla, jeho historie a poptávky na trhu. Cena je vždy férová a transparentní.",
  },
  {
    question: "Vykoupíte i auto s vadami nebo po havárii?",
    answer:
      "Ano, vykupujeme i vozidla s technickými vadami nebo po havárii. Cena se samozřejmě odvíjí od aktuálního stavu vozu.",
  },
  {
    question: "Jak rychle dostanu peníze?",
    answer:
      "Po odsouhlasení nabídky a podpisu smlouvy obdržíte peníze na účet do 24 hodin. V případě hotovostního výkupu ihned na místě.",
  },
];

export default function VykupPage() {
  return (
    <ServicePage
      hero={{
        title: "Vykoupíme vaše auto za hotové",
        highlight: "za hotové",
        subtitle: "Peníze na účtu do 24 hodin",
      }}
      steps={steps}
      benefits={benefits}
      cta={<VykupForm />}
      faq={faq}
    />
  );
}
