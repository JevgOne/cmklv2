import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail příležitosti | CarMarketplace",
  description:
    "Prohlédněte si investiční příležitost na CarMarketplace. Detaily vozu, kalkulace nákladů a očekávaný výnos.",
  robots: { index: false, follow: true },
};

export default function MarketplaceInvestorDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
