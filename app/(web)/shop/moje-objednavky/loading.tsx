export default function MojeObjednavkyLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex justify-between mb-4">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex-1 h-1 bg-gray-200 rounded-full animate-pulse" />
              ))}
            </div>
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
