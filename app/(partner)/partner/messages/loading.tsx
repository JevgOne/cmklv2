export default function PartnerMessagesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-64 bg-gray-200 rounded" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm h-20" />
        ))}
      </div>
    </div>
  );
}
