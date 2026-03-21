export default function InzerceLoading() {
  return (
    <main className="min-h-screen">
      {/* Hero skeleton */}
      <section className="bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-28 text-center">
          <div className="h-12 w-96 bg-orange-100 rounded-lg mx-auto animate-pulse" />
          <div className="h-5 w-80 bg-orange-50 rounded mt-5 mx-auto animate-pulse" />
          <div className="h-12 w-48 bg-orange-200 rounded-full mx-auto mt-8 animate-pulse" />
        </div>
      </section>

      {/* Stats strip skeleton */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
