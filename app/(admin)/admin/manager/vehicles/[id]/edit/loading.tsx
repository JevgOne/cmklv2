export default function ManagerVehicleEditLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-64 bg-gray-200 rounded mb-1" />
        <div className="h-4 w-56 bg-gray-200 rounded" />
      </div>

      {/* Form skeleton */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded-lg" />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <div className="h-10 w-32 bg-gray-200 rounded-full" />
          <div className="h-10 w-24 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
