import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrace makléře",
  description:
    "Zaregistrujte se jako automakléř CarMakléř. Vytvořte si účet a začněte prodávat.",
  robots: { index: false, follow: true },
};

export default function RegistraceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
