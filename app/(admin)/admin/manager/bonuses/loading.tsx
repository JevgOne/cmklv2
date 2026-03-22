export default function ManagerBonusesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-48 bg-gray-200 rounded" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
            <div className="h-8 w-32 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-40 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="h-6 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-12 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          >
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-8 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
