import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Objednávka dílů",
  description: "Dokončete objednávku autodílů.",
  robots: { index: false, follow: false },
};

export default function ObjednavkaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
