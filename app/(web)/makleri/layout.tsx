import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ověření makléři",
  description:
    "Najděte ověřeného automakléře ve vašem regionu. 186 makléřů po celé ČR — Praha, Brno, Ostrava a další.",
  openGraph: {
    title: "Ověření makléři | CarMakléř",
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
