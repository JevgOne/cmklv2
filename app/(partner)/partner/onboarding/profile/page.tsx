import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingProfileForm } from "@/components/partner/OnboardingProfileForm";

export const metadata: Metadata = {
  title: "Profil firmy | Onboarding | Carmakler Partner",
  description: "Vyplňte základní údaje o vaší firmě pro registraci partnera.",
};

export default function PartnerOnboardingProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-6 space-y-5 animate-pulse">
          <div className="h-7 w-full bg-gray-200 rounded" />
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <OnboardingProfileForm />
    </Suspense>
  );
}
