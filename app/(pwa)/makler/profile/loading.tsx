export default function ProfileLoading() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-40 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );
}
