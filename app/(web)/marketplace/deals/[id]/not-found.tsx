import Link from "next/link";

export default function DealNotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Flip nenalezen
      </h1>
      <p className="text-gray-500 mb-6">
        Tento flip neexistuje nebo k němu nemáte přístup.
      </p>
      <Link
        href="/marketplace"
        className="inline-flex items-center px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors no-underline"
      >
        Zpět na Marketplace
      </Link>
    </div>
  );
}
