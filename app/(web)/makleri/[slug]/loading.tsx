export default function HashtagLandingLoading() {
  return (
    <main>
      {/* Breadcrumb skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Hero skeleton */}
      <section className="bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 py-14 sm:py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-5 w-24 bg-white/20 rounded-full animate-pulse" />
          <div className="h-10 w-96 bg-white/20 rounded-lg mt-4 animate-pulse" />
          <div className="h-5 w-full max-w-2xl bg-white/15 rounded mt-4 animate-pulse" />
          <div className="flex gap-3 mt-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-9 w-36 bg-white/15 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Grid skeleton */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 mb-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-10 w-32 bg-gray-100 rounded-full animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 h-64 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
