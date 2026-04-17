import Link from "next/link";

export default function HashtagNotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">🔎</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Tento hashtag zatím nemá žádné makléře
        </h1>
        <p className="text-gray-600 mt-3">
          Možná jsme ho přejmenovali nebo ještě čeká na svého prvního makléře.
          Zkuste procházet všechny naše ověřené makléře.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link
            href="/makleri"
            className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-full no-underline transition-colors"
          >
            Všichni makléři
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center border border-gray-300 hover:border-orange-300 text-gray-700 font-semibold px-6 py-3 rounded-full no-underline transition-colors"
          >
            Domů
          </Link>
        </div>
      </div>
    </main>
  );
}
