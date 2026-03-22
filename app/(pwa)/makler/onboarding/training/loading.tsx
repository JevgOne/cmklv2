export default function OnboardingTrainingLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse shrink-0" />
            <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-12 w-full bg-orange-200 rounded-lg animate-pulse" />
    </div>
  );
}
