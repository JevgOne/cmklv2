import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recenze",
  description:
    "Přečtěte si recenze spokojených klientů CarMakléř. Skutečné zkušenosti prodejců i kupujících.",
  openGraph: {
    title: "Recenze klientů | CarMakléř",
    description:
      "Skutečné zkušenosti prodejců i kupujících. Přečtěte si hodnocení od našich klientů.",
  },
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
