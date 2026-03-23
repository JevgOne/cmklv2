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

export default function RecenzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
