import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrace",
  description:
    "Zaregistrujte se na CarMakléř. Prodávejte, kupujte nebo se staňte makléřem.",
  robots: { index: false, follow: true },
};

export default function RegistraceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
