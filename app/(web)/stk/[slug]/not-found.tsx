import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">STK stanice nenalezena</h1>
      <p className="text-gray-500 mb-6">Tato STK stanice neexistuje nebo byla odstraněna.</p>
      <Link
        href="/stk"
        className="inline-flex items-center px-6 py-3 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
      >
        Zpět na seznam STK stanic
      </Link>
    </div>
  );
}
