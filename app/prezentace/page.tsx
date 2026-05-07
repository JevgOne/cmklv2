import type { Metadata } from "next";
import { PrezentacePage } from "@/components/web/PrezentacePage";

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
