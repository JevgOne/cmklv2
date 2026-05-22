export default function Loading() {
  return (
    <div>
      <div className="h-7 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="h-10 w-full bg-gray-200 rounded-lg mb-4 animate-pulse" />
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 flex-1 bg-gray-200 rounded-md animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border-b border-gray-100">
            <div className="flex gap-3">
              <div className="w-16 h-12 bg-gray-200 rounded-md animate-pulse hidden sm:block" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
