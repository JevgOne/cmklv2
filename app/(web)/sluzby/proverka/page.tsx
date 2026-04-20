import type { Metadata } from "next";
import { ServicePage } from "@/components/web/ServicePage";
import { ProverkaForm } from "@/components/web/ProverkaForm";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Prověrka vozidla",
  description:
    "Kompletní prověrka historie a technického stavu vozidla. Kontrola původu, havárií, servisní historie a stočení tachometru.",
  openGraph: {
    title: "Prověrka vozidla | CarMakléř",
    description:
      "Kompletní prověrka historie a technického stavu vozidla. Kupte auto s jistotou.",
  },
  alternates: pageCanonical("/sluzby/proverka"),
};

const steps = [
  {
    icon: "🔍",
    title: "Zadejte VIN",
    description: "Stačí zadat 17místný VIN kód vozidla, které chcete prověřit",
  },
  {
    icon: "📋",
    title: "Prověříme historii",
    description:
      "Zkontrolujeme původ, havárie, servisní historii, zástavy i odcizení",
  },
  {
    icon: "✅",
    title: "Dostanete report",
    description:
      "Obdržíte přehledný report s kompletní historií a doporučením",
  },
];

const benefits = [
  {
    icon: "🌍",
    title: "Kontrola původu",
    description:
      "Ověříme zemi původu, počet předchozích majitelů a historii registrací v celé EU",
  },
  {
    icon: "💥",
    title: "Kontrola havárií",
    description:
      "Zjistíme, zda bylo vozidlo účastníkem nehody a jaký byl rozsah poškození",
  },
  {
    icon: "🔧",
    title: "Servisní historie",
    description:
      "Prověříme záznamy z autorizovaných servisů a pravidelnost údržby",
  },
  {
    icon: "⏱️",
    title: "Stav tachometru",
    description:
      "Zkontrolujeme historii nájezdu a odhalíme případné stočení tachometru",
  },
];

const faq = [
  {
    question: "Co všechno prověrka zahrnuje?",
    answer:
      "Kompletní prověrka zahrnuje kontrolu původu, historii havárií, servisní záznamy, stav tachometru, zástavy, odcizení a technický stav. Report obsahuje jasné doporučení, zda je vozidlo bezpečné ke koupi.",
  },
  {
    question: "Jak dlouho trvá prověrka?",
    answer:
      "Standardní prověrka trvá 5 až 30 minut v závislosti na dostupnosti dat. Report obdržíte na email ihned po dokončení.",
  },
  {
    question: "Funguje prověrka i pro zahraniční vozidla?",
    answer:
      "Ano. Naše prověrka pokrývá databáze v celé EU, takže dokážeme prověřit i vozidla dovezená ze zahraničí.",
  },
];

export default function ProverkaPage() {
  return (
    <ServicePage
      hero={{
        title: "Kupte auto s jistotou",
        highlight: "s jistotou",
        subtitle:
          "Kompletní prověrka historie a technického stavu vozidla",
      }}
      steps={steps}
      benefits={benefits}
      cta={<ProverkaForm />}
      faq={faq}
      breadcrumbLabel="Prověrka vozidla"
      currentService="proverka"
    />
  );
}
