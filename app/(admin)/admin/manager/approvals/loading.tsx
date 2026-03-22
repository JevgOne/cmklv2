export default function ManagerApprovalsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-4 w-36 bg-gray-200 rounded mb-2" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-56 bg-gray-200 rounded" />
          <div className="h-7 w-8 bg-gray-200 rounded-[10px]" />
        </div>
      </div>

      {/* Card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-sm p-6 flex gap-6"
        >
          <div className="w-[200px] h-[150px] bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-4 w-40 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="h-20 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <div className="h-9 w-24 bg-gray-200 rounded-full" />
              <div className="h-9 w-36 bg-gray-200 rounded-full" />
              <div className="h-9 w-24 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
