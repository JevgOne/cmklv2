export default function ProfileLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-xl" />
        <div className="space-y-2">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
          <div className="h-5 w-24 bg-gray-200 rounded-full" />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 w-24 bg-gray-100 rounded mb-2" />
            <div className="h-10 w-full bg-gray-100 rounded-lg" />
          </div>
        ))}
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
