export default function MyPartsLoading() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-20 bg-green-200 rounded-full animate-pulse" />
      </div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 flex-1 bg-gray-200 rounded-[10px] animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-3 flex gap-3">
            <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
