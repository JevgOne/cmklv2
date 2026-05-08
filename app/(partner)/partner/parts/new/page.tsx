import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPartForm } from "@/components/partner/NewPartForm";

export const metadata: Metadata = {
  title: "Pridat dil | Carmakler Partner",
  description: "Pridejte novy dil do systemu Carmakler.",
};

export default function NewPartPage() {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">
        Pridat dil
      </h1>
      <Suspense
        fallback={
          <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-32 bg-gray-100 rounded-xl" />
            <div className="h-12 bg-gray-100 rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-gray-100 rounded-lg" />
              <div className="h-12 bg-gray-100 rounded-lg" />
            </div>
          </div>
        }
      >
        <NewPartForm />
      </Suspense>
    </div>
  );
}
