export default function AdminPartnerDetailLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
        <div className="h-8 w-72 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm h-[500px]" />
          <div className="bg-white rounded-2xl p-6 shadow-sm h-48" />
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm h-48" />
          <div className="bg-white rounded-2xl p-6 shadow-sm h-64" />
        </div>
      </div>
    </div>
  );
}
