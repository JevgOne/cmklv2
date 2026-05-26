export default function SeoMetadataLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-48 bg-gray-200 rounded mb-1" />
        <div className="h-4 w-72 bg-gray-200 rounded" />
      </div>

      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-36 bg-gray-200 rounded-lg" />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-12 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-gray-100 px-4 flex items-center gap-4">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="w-16 h-6 bg-gray-200 rounded" />
            <div className="w-40 h-4 bg-gray-200 rounded" />
            <div className="w-32 h-4 bg-gray-200 rounded hidden lg:block" />
            <div className="w-12 h-4 bg-gray-200 rounded hidden xl:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
