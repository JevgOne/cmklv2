export default function KosikLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card p-4 flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-xl animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded mt-2 animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded mt-3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-4" />
              <div className="h-10 w-full bg-orange-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
