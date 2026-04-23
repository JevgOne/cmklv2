import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrace dodavatele dílů",
  description:
    "Zaregistrujte své vrakoviště nebo sklad dílů na CarMakléř. Přidávejte díly přes jednoduchou PWA a prodávejte online.",
  robots: { index: true, follow: true },
};

export default function RegistraceDodavatelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
