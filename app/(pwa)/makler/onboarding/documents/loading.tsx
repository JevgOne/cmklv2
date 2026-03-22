export default function OnboardingDocumentsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border-2 border-dashed border-gray-200 p-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
      <div className="h-12 w-full bg-orange-200 rounded-lg animate-pulse" />
    </div>
  );
}
