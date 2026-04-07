import type { Metadata } from "next";
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

export default function KarieraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
