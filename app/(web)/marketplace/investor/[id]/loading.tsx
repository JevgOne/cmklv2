export default function InvestorOpportunityDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
      <div className="h-8 w-64 bg-gray-200 rounded mb-8" />
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <div className="h-5 w-32 bg-gray-200 rounded mb-6" />
        <div className="flex items-center gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              {i < 6 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm aspect-video bg-gray-200" />
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm h-[350px]" />
          <div className="bg-white rounded-2xl p-6 shadow-sm h-[200px]" />
        </div>
      </div>
    </div>
  );
}
