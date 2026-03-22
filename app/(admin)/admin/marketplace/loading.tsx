export default function AdminMarketplaceLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-48 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
            <div className="h-8 w-20 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div>
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
