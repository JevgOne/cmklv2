export default function PartEditLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
