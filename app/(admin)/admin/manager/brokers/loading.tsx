export default function ManagerBrokersLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-48 bg-gray-200 rounded" />
      </div>

      {/* Tabs + button skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-full" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-40 bg-gray-200 rounded" />
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
