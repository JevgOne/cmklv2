import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Produkt nenalezen</h1>
      <p className="text-gray-500 mb-6">Tento produkt neexistuje nebo byl odstraněn z nabídky.</p>
      <Link
        href="/shop"
        className="inline-flex items-center px-6 py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
      >
        Zpět do shopu
      </Link>
    </div>
  );
}
