export default function AdminLeadDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="flex items-center gap-3">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hlavni obsah */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="h-5 w-36 bg-gray-200 rounded" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
                  <div className="h-5 w-28 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="h-5 w-44 bg-gray-200 rounded" />
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
                  <div className="h-5 w-20 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
            <div className="h-12 bg-gray-100 rounded-lg mb-3" />
            <div className="h-10 bg-gray-200 rounded-full" />
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
            <div className="h-5 w-20 bg-gray-200 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
