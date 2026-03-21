export default function LoginLoading() {
  return (
    <div className="flex min-h-[calc(100vh-144px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <div className="mb-8 text-center">
            <div className="h-7 w-32 bg-gray-200 rounded mx-auto animate-pulse" />
            <div className="h-4 w-56 bg-gray-100 rounded mx-auto mt-3 animate-pulse" />
          </div>
          <div className="space-y-5">
            <div>
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mb-1.5" />
              <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mb-1.5" />
              <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-12 w-full bg-orange-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
