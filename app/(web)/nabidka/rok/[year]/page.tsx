import type { Metadata } from "next";
import { YEAR_RANGES } from "@/lib/seo-data";
import { YearLandingContent } from "@/components/web/YearLandingContent";
import { notFound } from "next/navigation";
import { pageCanonical } from "@/lib/canonical";

interface Props {
  params: Promise<{ year: string }>;
}

export function generateStaticParams() {
  return YEAR_RANGES.map((y) => ({ year: y.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params;
  const yearData = YEAR_RANGES.find((y) => y.slug === year);
  if (!yearData) return {};

  return {
    title: `Ojetá auta ${yearData.year} | Ročník ${yearData.year} bazar`,
    description: `Prověřené ojeté vozy ročník ${yearData.year}. Široký výběr značek a modelů od ověřených makléřů na CarMakler.`,
    openGraph: {
      title: `Ojetá auta ročník ${yearData.year}`,
      description: `Ojeté vozy z roku ${yearData.year} od ověřených makléřů.`,
    },
    alternates: pageCanonical(`/nabidka/rok/${yearData.slug}`),
  };
}

export default async function Page({ params }: Props) {
  const { year } = await params;
  const yearData = YEAR_RANGES.find((y) => y.slug === year);
  if (!yearData) notFound();
  return <YearLandingContent yearData={yearData} />;
}
