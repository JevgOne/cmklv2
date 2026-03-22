export default function ManagerDashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-64 bg-gray-200 rounded" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
            <div className="h-8 w-20 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="h-5 w-32 bg-gray-200 rounded mb-6" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
            <div className="h-16 bg-gray-100 rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-3">
                <div className="w-2.5 h-2.5 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
