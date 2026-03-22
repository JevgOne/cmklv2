export default function OnboardingProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
      </div>
      <div className="h-32 w-full bg-gray-100 rounded-lg animate-pulse" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
      <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-12 w-full bg-orange-200 rounded-lg animate-pulse" />
    </div>
  );
}
