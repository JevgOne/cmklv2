import Link from "next/link";
import { ListingFormWizard } from "@/components/web/listing-form";

export default function PridatInzeratPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header + Breadcrumb */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link
              href="/inzerce"
              className="text-orange-500 hover:text-orange-600 no-underline transition-colors"
            >
              Inzerce
            </Link>
            <span>/</span>
            <span className="text-gray-600">Vložit inzerát</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            Vložit inzerát zdarma
          </h1>
          <p className="text-gray-500 mt-2">
            Vyplňte údaje o voze a inzerát bude online během minuty.
          </p>
        </div>
      </section>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ListingFormWizard />
      </div>
    </main>
  );
}
