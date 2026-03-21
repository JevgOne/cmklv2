export default function MakleriLoading() {
  return (
    <main>
      {/* Hero skeleton */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-950 py-10 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-10 w-80 bg-white/10 rounded-lg mx-auto animate-pulse" />
          <div className="h-5 w-40 bg-white/5 rounded mt-4 mx-auto animate-pulse" />
        </div>
      </section>

      {/* Filters + Grid skeleton */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="h-12 w-full sm:w-64 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-12 w-full sm:w-64 bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card p-7">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-[60px] h-[60px] bg-gray-200 rounded-xl animate-pulse" />
                  <div>
                    <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-100 rounded mt-1 animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-2 mb-5">
                  <div className="h-7 w-24 bg-gray-100 rounded-[10px] animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-5 border-t border-gray-100">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="text-center">
                      <div className="h-7 w-10 bg-gray-200 rounded mx-auto animate-pulse" />
                      <div className="h-3 w-14 bg-gray-100 rounded mx-auto mt-1 animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
