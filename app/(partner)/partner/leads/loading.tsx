export default function PartnerLeadsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 bg-gray-200 rounded" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm h-20" />
        ))}
      </div>
    </div>
  );
}
