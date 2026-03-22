export default function LeadDetailLoading() {
  return (
    <div className="p-4 animate-pulse space-y-4">
      <div className="h-4 w-28 bg-gray-200 rounded" />

      <div>
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-5 w-24 bg-gray-200 rounded mt-2" />
      </div>

      {/* Kontakt skeleton */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="h-10 w-full bg-gray-100 rounded" />
        <div className="h-10 w-full bg-gray-100 rounded" />
      </div>

      {/* Auto info skeleton */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
              <div className="h-5 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full mb-1" />
              <div className="h-3 w-12 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
