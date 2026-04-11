export default function VehicleDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="aspect-video bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4" />
      <div className="h-8 bg-gray-100 rounded animate-pulse w-1/3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
