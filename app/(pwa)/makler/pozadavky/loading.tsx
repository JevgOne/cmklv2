export default function PozadavkyLoading() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Stats skeleton */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="h-7 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
              <div className="h-3 w-12 bg-gray-100 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>

        {/* Filter skeleton */}
        <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />

        {/* Cards skeleton */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
