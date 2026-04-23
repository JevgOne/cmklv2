import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrace partnera",
  description:
    "Staňte se partnerem CarMakléř. Nabízejte své služby v síti certifikovaných odborníků na automobily.",
  robots: { index: true, follow: true },
};

export default function RegistracePartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
