export default function ContractsLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}
