import type { Metadata } from "next";
import Link from "next/link";
import { OpportunityWizard } from "@/components/web/marketplace/OpportunityWizard";

export const metadata: Metadata = {
  title: "Nova prilezitost | Dealer | Marketplace | CarMakler",
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
            Dealer
          </Link>
          <span>/</span>
          <span className="text-gray-900">Nova prilezitost</span>
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">
          Pridat novou prilezitost
        </h1>
        <p className="text-gray-500 mt-1">
          Popiste auto, plan opravy a prodejni odhad. Prilezitost bude schvalena nasim teamem.
        </p>
      </div>

      <OpportunityWizard />
    </div>
  );
}
