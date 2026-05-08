import type { Metadata } from "next";
import { Suspense } from "react";
import { NewVehicleForm } from "@/components/partner/NewVehicleForm";

export const metadata: Metadata = {
  title: "Pridat vozidlo | Carmakler Partner",
  description: "Pridejte nove vozidlo do systemu Carmakler.",
};

export default function NewVehiclePage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        Pridat vozidlo
      </h1>
      <Suspense
        fallback={
          <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-32 bg-gray-100 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-gray-100 rounded-lg" />
              <div className="h-12 bg-gray-100 rounded-lg" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-12 bg-gray-100 rounded-lg" />
              <div className="h-12 bg-gray-100 rounded-lg" />
              <div className="h-12 bg-gray-100 rounded-lg" />
            </div>
          </div>
        }
      >
        <NewVehicleForm />
      </Suspense>
    </div>
  );
}
