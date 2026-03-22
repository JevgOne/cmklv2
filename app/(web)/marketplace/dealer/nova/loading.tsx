export default function NewOpportunityLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-96 bg-gray-200 rounded mb-8" />
      <div className="flex items-center gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            {i < 3 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
