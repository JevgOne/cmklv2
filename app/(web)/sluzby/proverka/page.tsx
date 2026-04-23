import type { Metadata } from "next";
import { ServicePage } from "@/components/web/ServicePage";
import { ProverkaForm } from "@/components/web/ProverkaForm";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Prověrka vozidla — kupte auto bez rizika",
  description:
    "Zjistěte pravdu o autě, než ho koupíte. Kontrola havárií, stočení km, zástav a servisní historie. Report do 30 minut.",
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
    title: "Zadejte VIN kód",
    description: "Stačí 17místný VIN — najdete ho v technickém průkazu nebo na sloupku dveří",
  },
  {
    icon: "📋",
    title: "Prověříme historii v EU databázích",
    description:
      "Havárie, stočení km, zástavy, odcizení, servisní záznamy — vše za pár minut",
  },
  {
    icon: "✅",
    title: "Dostanete jasný verdikt",
    description:
      "Přehledný report s doporučením: kupovat / nekupovat. Žádné odborné hádanky",
  },
];

const benefits = [
  {
    icon: "🌍",
    title: "Původ a majitelé",
    description:
      "Zjistíme, odkud auto pochází, kolik mělo majitelů a zda nebylo dovezeno po havárii ze zahraničí",
  },
  {
    icon: "💥",
    title: "Havárie a poškození",
    description:
      "Odhalíme, zda auto bouralo — a jak moc. Neopravené škody mohou snížit hodnotu o desítky tisíc",
  },
  {
    icon: "🔧",
    title: "Servisní záznamy",
    description:
      "Prověříme, zda auto chodilo do servisu pravidelně. Zanedbaná údržba = drahé opravy",
  },
  {
    icon: "⏱️",
    title: "Stočení tachometru",
    description:
      "Každé třetí ojeté auto v ČR má stočený tachometr. Odhalíme to z historie nájezdů",
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
          "Zjistěte pravdu o autě, než za něj zaplatíte. Report do 30 minut.",
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
