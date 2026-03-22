export default function TransferVehiclesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-56 bg-gray-200 rounded" />
      <div className="h-8 w-72 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="w-16 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
