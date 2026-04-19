import type { Metadata } from "next";
import { ServicePage } from "@/components/web/ServicePage";
import { VykupForm } from "@/components/web/VykupForm";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Výkup vozidel",
  description:
    "Vykoupíme vaše auto za hotové. Férová cena, peníze na účtu do 24 hodin, bez skrytých poplatků.",
  openGraph: {
    title: "Výkup auta za hotové | CarMakléř",
    description:
      "Vykoupíme vaše auto za hotové. Férová cena, peníze na účtu do 24 hodin.",
  },
  alternates: pageCanonical("/sluzby/vykup"),
};

const steps = [
  {
    icon: "📋",
    title: "Pošlete info o voze",
    description:
      "Vyplňte značku, model, rok a stav — ozveme se do 30 minut",
  },
  {
    icon: "💵",
    title: "Nabídneme férovou cenu",
    description:
      "Na základě aktuální tržní hodnoty vám nabídneme konkrétní částku",
  },
  {
    icon: "✅",
    title: "Vyplatíme do 24 hodin",
    description:
      "Po odsouhlasení ceny peníze odešleme na účet a přepíšeme auto",
  },
];

const benefits = [
  {
    icon: "💰",
    title: "Férová tržní cena",
    description:
      "Cenu stanovíme na základě aktuální tržní hodnoty a stavu vozidla",
  },
  {
    icon: "⚡",
    title: "Platba ihned",
    description:
      "Peníze na účtu do 24 hodin od odsouhlasení ceny",
  },
  {
    icon: "🚫",
    title: "Bez skrytých poplatků",
    description:
      "Žádné poplatky za ocenění ani za převod. Cena = to, co dostanete",
  },
  {
    icon: "📝",
    title: "Přepis na počkání",
    description:
      "Zajistíme kompletní administrativu — přepis, odhlášení pojištění, vše",
  },
];

const faq = [
  {
    question: "Jak se stanoví výkupní cena?",
    answer:
      "Cenu stanovíme na základě aktuální tržní hodnoty, stavu vozu, servisní historie a poptávky na trhu. Vždy vám poskytneme transparentní kalkulaci.",
  },
  {
    question: "Jak rychle dostanu peníze?",
    answer:
      "Peníze odesíláme na účet do 24 hodin od odsouhlasení ceny a podpisu smlouvy.",
  },
  {
    question: "Vykupujete i auta s vadami?",
    answer:
      "Ano, vykupujeme i vozidla s technickými vadami, po nehodě nebo s vyšším nájezdem. Cena se přizpůsobí stavu.",
  },
  {
    question: "Musím mít auto splacené?",
    answer:
      "Pokud je auto na leasing nebo úvěr, pomůžeme s předčasným ukončením a vyrovnáním. Výkup je možný i v tomto případě.",
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
      breadcrumbLabel="Výkup vozidel"
    />
  );
}
