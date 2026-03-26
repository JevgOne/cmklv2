export default function Loading() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 space-y-3 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-100 rounded w-48" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}
