export default function AdminListingDetailLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-6">
            <div className="h-6 w-12 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="h-6 w-40 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="flex gap-3">
          <div className="h-10 w-36 bg-gray-100 rounded-full animate-pulse" />
          <div className="h-10 w-28 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
