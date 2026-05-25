"use client";

import dynamic from "next/dynamic";

const AnimatedOnboarding = dynamic(() => import("./AnimatedOnboarding"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
          <h1 className="text-lg font-bold text-white mb-4">Onboarding maklere</h1>
        </div>
      </div>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />
      </main>
    </div>
  ),
});

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnimatedOnboarding>{children}</AnimatedOnboarding>;
}
