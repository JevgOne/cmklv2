import type { Metadata } from "next";
import { CompareTable } from "./CompareTable";

export const metadata: Metadata = {
  title: "Porovnání vozidel — CarMakléř",
  description: "Porovnejte až 3 vozidla vedle sebe. Srovnání ceny, parametrů, výbavy a stavu.",
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-8">
          Porovnání vozidel
        </h1>
        <CompareTable />
      </div>
    </div>
  );
}
