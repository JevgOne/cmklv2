export default function AdminInzerceLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
      </div>
      <div className="h-10 w-80 bg-gray-100 rounded-lg mb-6 animate-pulse" />
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-gray-100">
            <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
