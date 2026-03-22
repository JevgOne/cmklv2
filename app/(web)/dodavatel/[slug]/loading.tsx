export default function DodavatelProfileLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex gap-6 mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gray-200" />
        <div className="space-y-3">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6 h-32 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm h-32" />
        ))}
      </div>
    </div>
  );
}
