export default function RecenzeLoading() {
  return (
    <main>
      {/* Header skeleton */}
      <section className="py-10 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-10 w-80 bg-gray-200 rounded-lg mx-auto animate-pulse" />
          <div className="h-5 w-40 bg-gray-100 rounded mt-4 mx-auto animate-pulse" />
        </div>
      </section>

      {/* Reviews skeleton */}
      <section className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-10">
            <div className="h-10 w-64 bg-gray-200 rounded-full animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
