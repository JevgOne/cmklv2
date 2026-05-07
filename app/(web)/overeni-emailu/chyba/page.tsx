import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailErrorContent } from "@/components/web/VerifyEmailErrorContent";

export const metadata: Metadata = {
  title: "Chyba ověření emailu",
  description: "Ověření emailového účtu se nezdařilo",
};

export default function VerifyEmailErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <VerifyEmailErrorContent />
    </Suspense>
  );
}
