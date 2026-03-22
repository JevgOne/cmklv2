export default function OrderDetailLoading() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-100 rounded mt-1 animate-pulse" />
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-[10px] animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-card p-4">
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
