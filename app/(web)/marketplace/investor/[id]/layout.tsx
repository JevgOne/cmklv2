import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail příležitosti | Marketplace",
  description:
    "Prohlédněte si investiční příležitost na Marketplace. Detaily vozu, kalkulace nákladů a očekávaný výnos.",
  robots: { index: false, follow: true },
};

export default function MarketplaceInvestorDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
