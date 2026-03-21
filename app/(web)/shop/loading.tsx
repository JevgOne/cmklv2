export default function ShopLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">
          <div className="h-6 w-56 bg-orange-100 rounded-full mx-auto animate-pulse mb-6" />
          <div className="h-10 w-80 bg-orange-100 rounded-lg mx-auto animate-pulse" />
          <div className="h-5 w-64 bg-orange-50 rounded mt-4 mx-auto animate-pulse" />
        </div>
      </section>

      {/* Categories skeleton */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-32 bg-gray-200 rounded mx-auto mb-10 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card p-6 text-center">
                <div className="w-14 h-14 bg-gray-200 rounded-full mx-auto animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded mx-auto mt-4 animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded mx-auto mt-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
