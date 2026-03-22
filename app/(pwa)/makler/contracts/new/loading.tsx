export default function NewContractLoading() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      <div className="p-4 border-b border-gray-100">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
