"use client";

export default function ErrorPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Něco se pokazilo</h1>
        <p className="text-gray-500 mb-6">Stránka se nepodařila načíst. Zkuste to prosím znovu.</p>
        <a href="/" className="inline-flex items-center py-3 px-6 bg-orange-500 text-white font-semibold rounded-full no-underline hover:bg-orange-600 transition-colors">
          Zpět na hlavní stránku
        </a>
      </div>
    </main>
  );
}
