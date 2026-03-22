export default function AdminFlipDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="h-8 w-64 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl p-6 shadow-sm">
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
          <div className="bg-white rounded-2xl shadow-sm aspect-video" />
          <div className="bg-white rounded-2xl p-6 shadow-sm h-[200px]" />
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm h-[350px]" />
          <div className="bg-white rounded-2xl p-6 shadow-sm h-[200px]" />
        </div>
      </div>
    </div>
  );
}
