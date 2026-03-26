export default function ContactsLoading() {
  return (
    <div className="p-4 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-200 rounded mt-2" />
        </div>
        <div className="h-10 w-20 bg-gray-200 rounded-full" />
      </div>

      <div className="h-12 bg-gray-200 rounded-lg" />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded-[10px]" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
