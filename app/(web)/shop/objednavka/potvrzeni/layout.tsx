import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Potvrzení objednávky",
  description: "Vaše objednávka na CarMakléř byla úspěšně odeslána.",
  robots: { index: false, follow: false },
};

export default function ShopPotvrzeniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
