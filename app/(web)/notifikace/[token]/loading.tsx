export default function SellerNotificationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto animate-pulse space-y-4">
        <div className="text-center mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-48 bg-gray-200 rounded" />
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-6 bg-gray-200 rounded-full" />
                <div className="w-12 h-6 bg-gray-200 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
