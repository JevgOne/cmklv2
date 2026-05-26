export default function SeoAuditLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-28 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-36 bg-gray-200 rounded mb-1" />
        <div className="h-4 w-72 bg-gray-200 rounded" />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="flex gap-4">
          <div className="h-10 w-36 bg-gray-200 rounded-lg" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-2" />
            <div className="h-3 w-20 bg-gray-200 rounded mx-auto" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
