import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zapomenuté heslo",
  description: "Obnovte si heslo k účtu CarMakléř.",
  robots: { index: false, follow: false },
};

export default function ZapomenuteHesloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
