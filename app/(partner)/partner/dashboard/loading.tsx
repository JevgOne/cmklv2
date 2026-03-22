export default function PartnerDashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm h-32" />
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm h-64" />
    </div>
  );
}
