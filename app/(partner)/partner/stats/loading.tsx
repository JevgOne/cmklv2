export default function PartnerStatsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl shadow-sm h-64" />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm h-32" />
        <div className="bg-white rounded-2xl shadow-sm h-32" />
      </div>
    </div>
  );
}
