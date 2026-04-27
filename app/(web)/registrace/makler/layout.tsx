import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrace makléře",
  description:
    "Připojte se k týmu profesionálních automakléřů na CarMakléř. Zprostředkovávejte prodej vozidel a vydělávejte provize.",
  robots: { index: true, follow: true },
};

export default function RegistraceMaklerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
