export default function PartnerPartsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm h-48" />
        ))}
      </div>
    </div>
  );
}
