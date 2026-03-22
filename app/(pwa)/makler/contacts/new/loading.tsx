export default function NewContactLoading() {
  return (
    <div className="p-4 animate-pulse space-y-4">
      <div>
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-200 rounded mt-2" />
      </div>

      <div className="bg-gray-100 rounded-2xl p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-12 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
