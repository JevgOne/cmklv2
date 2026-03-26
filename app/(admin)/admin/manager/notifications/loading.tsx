export default function ManagerNotificationsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-40 bg-gray-200 rounded" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 w-40 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-56 bg-gray-200 rounded" />
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
