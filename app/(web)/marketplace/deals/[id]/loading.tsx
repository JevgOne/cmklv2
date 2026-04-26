export default function DealDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="h-5 w-48 bg-gray-100 rounded animate-pulse mb-6" />
      <div className="h-10 w-80 bg-gray-100 rounded animate-pulse mb-4" />
      <div className="h-16 bg-gray-100 rounded-xl animate-pulse mb-8" />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
