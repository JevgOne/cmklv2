import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kariéra",
  description:
    "Přidejte se k síti makléřů CarMakléř. Flexibilní úvazek, neomezený výdělek, moderní nástroje a školení.",
  openGraph: {
    title: "Kariéra u CarMakléř — staňte se automakléřem",
    description:
      "Přidejte se k nejmodernější platformě pro prodej aut v Česku. Flexibilní práce, provizní systém bez stropu.",
  },
};

export default function KarieraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
