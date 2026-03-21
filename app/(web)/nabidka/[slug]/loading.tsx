export default function VehicleDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          <span className="text-gray-300">/</span>
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <span className="text-gray-300">/</span>
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Gallery + Info skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          {/* Gallery skeleton */}
          <div className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />

          {/* Info panel skeleton */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="h-7 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-gray-100 rounded mt-2 animate-pulse" />
            </div>
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="h-9 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-gray-100 rounded-[10px] animate-pulse" />
              <div className="h-8 w-32 bg-gray-100 rounded-[10px] animate-pulse" />
            </div>
            <div className="h-12 w-full bg-orange-200 rounded-full animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}
