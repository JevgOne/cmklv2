export default function FeedDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-40 bg-gray-200 rounded" />
      <div className="flex items-center justify-between">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-gray-200 rounded-lg" />
          <div className="h-9 w-20 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl h-48 shadow-sm" />
        <div className="bg-white rounded-2xl h-48 shadow-sm" />
      </div>
      <div className="bg-white rounded-2xl h-64 shadow-sm" />
    </div>
  );
}
