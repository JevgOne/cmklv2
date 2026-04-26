import type { Metadata } from "next";
import { generateAggregateRatingJsonLd } from "@/lib/seo";
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

const reviewJsonLdStr = generateAggregateRatingJsonLd({
  organizationName: "CarMakléř",
  ratingValue: 4.8,
  reviewCount: 8,
  reviews: [
    { author: "Jana K.", reviewBody: "Prodej proběhl hladce a rychle. Auto bylo prodané za 12 dní.", ratingValue: 5 },
    { author: "Martin D.", reviewBody: "Konečně někdo, kdo se o všechno postará.", ratingValue: 5 },
    { author: "Lucie N.", reviewBody: "Makléř byl profesionální, vždy dostupný.", ratingValue: 5 },
  ],
});

export default function RecenzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: reviewJsonLdStr }}
      />
      {children}
    </>
  );
}
