export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
      <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-24 bg-gray-200 rounded mb-6" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
