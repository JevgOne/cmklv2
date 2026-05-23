export default function NovyPozadavekLoading() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex-1 px-4 py-6 space-y-4">
        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
