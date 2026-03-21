export default function KontaktLoading() {
  return (
    <main>
      {/* Map placeholder skeleton */}
      <section className="bg-gray-200 h-[250px] sm:h-[300px] md:h-[400px] animate-pulse" />

      {/* Contact info + form skeleton */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <div className="h-9 w-56 bg-gray-200 rounded animate-pulse mb-6" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-8" />
              <div className="flex flex-col gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse shrink-0" />
                    <div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                      <div className="h-5 w-40 bg-gray-100 rounded mt-1 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
                ))}
                <div className="h-12 w-full bg-orange-200 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
