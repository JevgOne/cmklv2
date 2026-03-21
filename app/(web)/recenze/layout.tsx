import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recenze",
  description:
    "Přečtěte si recenze spokojených klientů CarMakléř. 4.8 z 5 hvězdiček, 247 hodnocení od prodejců i kupujících.",
  openGraph: {
    title: "Recenze klientů | CarMakléř",
    description:
      "Skutečné zkušenosti prodejců i kupujících. 4.8 z 5 hvězdiček od 247 klientů.",
  },
};

export default function RecenzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
