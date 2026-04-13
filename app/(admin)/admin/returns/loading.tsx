export default function ReturnsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-48 bg-gray-200 rounded" />
      </div>

      {/* Filters skeleton */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
          <div className="w-40 h-10 bg-gray-200 rounded-lg" />
          <div className="w-40 h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-100" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border-b border-gray-50">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
