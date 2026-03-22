export default function SupplierDashboardLoading() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-100 rounded mt-2 animate-pulse" />
      </div>
      <div className="h-12 w-full bg-green-200 rounded-full animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-6">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse mb-4" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-4">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
