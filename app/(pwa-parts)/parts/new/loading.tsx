export default function NewPartLoading() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 h-0.5 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
