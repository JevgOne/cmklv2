export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="relative h-56 sm:h-72 md:h-96 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <section className="-mt-20 sm:-mt-24 relative z-10">
          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="w-28 h-28 sm:w-36 sm:h-36 -mt-16 sm:-mt-20 rounded-full border-4 border-white bg-gray-200 animate-pulse shrink-0 mx-auto sm:mx-0" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-6 pt-3 border-t border-gray-100">
                  <div className="h-10 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-10 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-10 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-9 w-32 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-9 w-32 bg-gray-100 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-card p-6 sm:p-8 space-y-3"
          >
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
