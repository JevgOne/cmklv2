import type { Metadata } from "next";
import Link from "next/link";
import { OpportunityWizard } from "@/components/web/marketplace/OpportunityWizard";
import { pageCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Nová příležitost | Realizátor | Marketplace | CarMakléř",
  alternates: pageCanonical("/marketplace/dealer/nova"),
};

export default function NewOpportunityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-1">
          <Link href="/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
            Marketplace
          </Link>
          <span>/</span>
          <Link href="/marketplace/dealer" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
            Realizátor
          </Link>
          <span>/</span>
          <span className="text-gray-900">Nová příležitost</span>
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">
          Přidat novou příležitost
        </h1>
        <p className="text-gray-500 mt-1">
          Popište auto, plán opravy a prodejní odhad. Příležitost bude schválena naším týmem.
        </p>
      </div>

      <OpportunityWizard />
    </div>
  );
}
