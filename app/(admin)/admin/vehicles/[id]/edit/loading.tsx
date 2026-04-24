export default function VehicleEditLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          <div className="h-10 w-20 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
