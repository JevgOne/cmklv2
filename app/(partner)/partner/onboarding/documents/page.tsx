import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingDocumentsForm } from "@/components/partner/OnboardingDocumentsForm";

export const metadata: Metadata = {
  title: "Dokumenty | Onboarding | Carmakler Partner",
  description: "Nahrajte potřebné dokumenty pro ověření partnera.",
};

export default function PartnerOnboardingDocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-6 space-y-5 animate-pulse">
          <div className="h-7 w-full bg-gray-200 rounded" />
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      }
    >
      <OnboardingDocumentsForm />
    </Suspense>
  );
}
