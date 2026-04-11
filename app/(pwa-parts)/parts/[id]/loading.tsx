export default function PartDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
