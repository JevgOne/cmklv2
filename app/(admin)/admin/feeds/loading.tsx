export default function FeedsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-16 bg-gray-200 rounded mb-1" />
        <div className="flex items-center justify-between">
          <div className="h-8 w-36 bg-gray-200 rounded" />
          <div className="h-9 w-28 bg-gray-200 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl h-20 shadow-sm" />
        ))}
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl h-32 shadow-sm" />
      ))}
    </div>
  );
}
