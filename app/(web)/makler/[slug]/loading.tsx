export default function MaklerProfileLoading() {
  return (
    <main>
      {/* Header skeleton */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-10 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            <div className="w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] bg-white/10 rounded-2xl animate-pulse" />
            <div className="text-center sm:text-left">
              <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
              <div className="h-5 w-56 bg-white/5 rounded mt-2 animate-pulse" />
              <div className="flex gap-3 mt-3 justify-center sm:justify-start">
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card p-5 text-center">
                <div className="h-8 w-16 bg-gray-200 rounded mx-auto animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 rounded mx-auto mt-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
