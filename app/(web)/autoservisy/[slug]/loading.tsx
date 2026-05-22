export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-6 w-64 bg-gray-200 rounded mb-6" />
      <div className="h-10 w-96 bg-gray-200 rounded mb-2" />
      <div className="h-5 w-48 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
