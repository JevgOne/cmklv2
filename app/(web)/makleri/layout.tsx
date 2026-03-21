import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certifikovaní makléři",
  description:
    "Najděte certifikovaného automakléře ve vašem regionu. 186 makléřů po celé ČR — Praha, Brno, Ostrava a další.",
  openGraph: {
    title: "Certifikovaní makléři | CarMakléř",
    description:
      "186 ověřených automakléřů po celé ČR. Najděte makléře ve svém městě.",
  },
};

export default function MakleriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
