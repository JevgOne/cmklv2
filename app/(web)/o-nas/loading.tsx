export default function ONasLoading() {
  return (
    <main>
      {/* Hero skeleton */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-12 sm:py-16 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-10 w-96 bg-white/10 rounded-lg mx-auto animate-pulse" />
          <div className="h-5 w-72 bg-white/5 rounded mt-5 mx-auto animate-pulse" />
        </div>
      </section>

      {/* Story skeleton */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card p-6 text-center">
                <div className="h-10 w-20 bg-gray-200 rounded mx-auto animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded mx-auto mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
