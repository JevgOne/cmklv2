export default function OnboardingContractLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="bg-white rounded-2xl shadow-card p-6 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
      <div className="h-[200px] bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-6 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="h-12 w-full bg-orange-200 rounded-lg animate-pulse" />
    </div>
  );
}
