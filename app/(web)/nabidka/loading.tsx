export default function NabidkaLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero strip skeleton */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-9 w-64 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-5 w-48 bg-gray-100 rounded mt-2 animate-pulse" />
            </div>
            <div className="h-11 w-44 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Filters + Grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter bar skeleton */}
        <div className="mb-8 flex flex-wrap gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 w-36 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Vehicle grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
              <div className="p-5">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded mt-2 animate-pulse" />
                <div className="flex gap-2 mt-3">
                  <div className="h-8 w-20 bg-gray-100 rounded-[10px] animate-pulse" />
                  <div className="h-8 w-20 bg-gray-100 rounded-[10px] animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                  <div className="h-7 w-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-9 w-20 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
