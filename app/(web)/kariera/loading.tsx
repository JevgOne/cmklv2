export default function KarieraLoading() {
  return (
    <main>
      {/* Hero skeleton */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-12 sm:py-16 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-10 w-72 bg-white/10 rounded-lg mx-auto animate-pulse" />
          <div className="h-5 w-96 bg-white/5 rounded mt-5 mx-auto animate-pulse" />
        </div>
      </section>

      {/* Benefits skeleton */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-12 animate-pulse" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card p-6">
                <div className="w-14 h-14 bg-gray-200 rounded-full animate-pulse mb-4" />
                <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
