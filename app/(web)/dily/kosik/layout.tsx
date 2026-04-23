import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Košík",
  description: "Váš nákupní košík na CarMakléř.",
  robots: { index: false, follow: false },
};

export default function DilyKosikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
