import type { Metadata } from "next";
import dynamic from "next/dynamic";
const PrezentacePage = dynamic(
  () => import("@/components/web/PrezentacePage").then((m) => ({ default: m.PrezentacePage })),
  { loading: () => <div className="min-h-screen animate-pulse bg-gray-50" /> }
);

export const metadata: Metadata = {
  title: "Prezentace pro partnery",
  description: "CarMakléř — síť certifikovaných makléřů. Nabídka spolupráce pro autobazary a vrakoviště.",
  openGraph: {
    title: "CarMakléř — Prezentace pro partnery",
    description: "Spolupráce pro autobazary a vrakoviště. Transparentní provize, žádné vstupní náklady.",
  },
};

export default function PrezentacePageWrapper() {
  return <PrezentacePage />;
}
