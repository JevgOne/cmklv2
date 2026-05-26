export default function SeoDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>

      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 rounded w-full" />
            {i < 2 && <div className="h-20 bg-gray-100 rounded w-full" />}
          </div>
        </div>
      ))}
    </div>
  );
}
