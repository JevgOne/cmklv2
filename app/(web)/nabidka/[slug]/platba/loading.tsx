export default function PaymentLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
