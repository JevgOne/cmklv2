export default function ContactDetailLoading() {
  return (
    <div className="p-4 animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded mt-2" />
        </div>
        <div className="h-10 w-16 bg-gray-200 rounded-full" />
      </div>

      <div className="h-32 bg-gray-100 rounded-2xl" />

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
        ))}
      </div>

      <div className="h-24 bg-gray-100 rounded-2xl" />

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
