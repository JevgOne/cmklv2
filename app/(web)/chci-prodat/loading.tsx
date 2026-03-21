export default function ChciProdatLoading() {
  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-16 md:pb-24">
      {/* Hero skeleton */}
      <section className="max-w-6xl mx-auto w-full px-4 pt-8 md:pt-12">
        <div className="bg-orange-50 rounded-2xl p-5 sm:p-8 md:p-12 lg:p-16">
          <div className="h-10 w-3/4 bg-orange-100 rounded-lg animate-pulse" />
          <div className="h-6 w-1/2 bg-orange-100 rounded mt-4 animate-pulse" />
          <div className="flex flex-wrap gap-6 md:gap-10 mt-8">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-8 w-16 bg-orange-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-orange-50 rounded mt-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps skeleton */}
      <section className="max-w-6xl mx-auto w-full px-4">
        <div className="h-8 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
        <div className="h-5 w-64 bg-gray-100 rounded mx-auto mt-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-card p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto animate-pulse" />
              <div className="h-5 w-32 bg-gray-200 rounded mx-auto mt-4 animate-pulse" />
              <div className="h-4 w-48 bg-gray-100 rounded mx-auto mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
