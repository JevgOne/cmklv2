import type { Metadata } from "next";
import { generateJobPostingJsonLd } from "@/lib/seo";
import { pageCanonical } from "@/lib/canonical";

// Canonical exportujeme na layout level (kontrolovaná výjimka pravidla Q5):
// /kariera/page.tsx je client component (`"use client"`) a NEMŮŽE exportovat
// vlastní `metadata`. Single-page subtree → layout-level canonical bez rizika
// inheritance leak-u na child routes (žádné child routes nejsou).
export const metadata: Metadata = {
  title: "Kariéra",
  description:
    "Přidejte se k síti makléřů CarMakléř. Flexibilní úvazek, neomezený výdělek, moderní nástroje a školení.",
  openGraph: {
    title: "Kariéra u CarMakléř — staňte se automakléřem",
    description:
      "Přidejte se k nejmodernější platformě pro prodej aut v Česku. Flexibilní práce, provizní systém bez stropu.",
  },
  alternates: pageCanonical("/kariera"),
};

const positions = [
  {
    title: "Automakléř",
    location: "Praha",
    streetAddress: "Praha",
    postalCode: "11000",
    addressRegion: "Praha",
    description: "Pomáhejte klientům s prodejem a nákupem vozidel. Zajišťujte kompletní servis od prvního kontaktu po předání klíčů.",
    salary: { minValue: 40000, maxValue: 80000 },
  },
  {
    title: "Automakléř",
    location: "Brno",
    streetAddress: "Brno",
    postalCode: "60200",
    addressRegion: "Jihomoravský kraj",
    description: "Pomáhejte klientům s prodejem a nákupem vozidel. Zajišťujte kompletní servis od prvního kontaktu po předání klíčů.",
    salary: { minValue: 40000, maxValue: 80000 },
  },
  {
    title: "Regionální manažer",
    location: "Celá ČR",
    streetAddress: "Česká republika",
    postalCode: "",
    addressRegion: "Česká republika",
    description: "Řiďte tým makléřů a rozvíjejte region. Zodpovídejte za výkon, kvalitu služeb a růst v přiděleném regionu.",
    salary: { minValue: 50000, maxValue: 100000 },
  },
];

export default function KarieraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {positions.map((pos, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: generateJobPostingJsonLd({
              title: pos.title,
              description: pos.description,
              location: pos.location,
              streetAddress: pos.streetAddress,
              postalCode: pos.postalCode,
              addressRegion: pos.addressRegion,
              employmentType: "CONTRACTOR",
              baseSalary: pos.salary,
            }),
          }}
        />
      ))}
      {children}
    </>
  );
}
