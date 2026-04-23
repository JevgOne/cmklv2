import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Košík",
  description: "Váš nákupní košík na CarMakléř Shop.",
  robots: { index: false, follow: false },
};

export default function ShopKosikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
