export default function PridatInzeratLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-10 w-72 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mt-3" />
        </div>
      </section>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-3 w-12 bg-gray-100 rounded animate-pulse hidden sm:block" />
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-100 rounded-full animate-pulse mb-8" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
