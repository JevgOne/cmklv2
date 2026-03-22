export default function OnboardingApprovalLoading() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
      <div className="h-7 w-56 bg-gray-200 rounded mx-auto animate-pulse mb-3" />
      <div className="h-4 w-72 bg-gray-100 rounded mx-auto animate-pulse mb-2" />
      <div className="h-4 w-40 bg-gray-100 rounded mx-auto animate-pulse mb-8" />
      <div className="bg-white rounded-2xl shadow-card p-6 max-w-sm mx-auto space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse shrink-0" />
            <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
