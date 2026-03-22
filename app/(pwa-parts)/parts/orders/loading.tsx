export default function SupplierOrdersLoading() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 flex-1 bg-gray-200 rounded-[10px] animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-4">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-48 bg-gray-100 rounded animate-pulse mb-3" />
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
