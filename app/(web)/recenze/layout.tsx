import type { Metadata } from "next";
import { pageCanonical } from "@/lib/canonical";

// Canonical exportujeme na layout level (kontrolovaná výjimka pravidla Q5):
// /recenze/page.tsx je client component (`"use client"`) a NEMŮŽE exportovat
// vlastní `metadata`. Single-page subtree → layout-level canonical bez rizika
// inheritance leak-u na child routes (žádné child routes nejsou).
export const metadata: Metadata = {
  title: "Recenze",
  description:
    "Přečtěte si recenze spokojených klientů CarMakléř. Skutečné zkušenosti prodejců i kupujících.",
  openGraph: {
    title: "Recenze klientů | CarMakléř",
    description:
      "Skutečné zkušenosti prodejců i kupujících. Přečtěte si hodnocení od našich klientů.",
  },
  alternates: pageCanonical("/recenze"),
};

const reviewJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CarMakléř",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "8",
    bestRating: "5",
    worstRating: "1",
  },
};

export default function RecenzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewJsonLd) }}
      />
      {children}
    </>
  );
}
