export default function ManagerBrokerDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-56 bg-gray-200 rounded" />

      {/* Profile header skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
          <div className="flex-1">
            <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded mb-3" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-gray-200 rounded-md" />
              <div className="h-6 w-16 bg-gray-200 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j}>
                  <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
