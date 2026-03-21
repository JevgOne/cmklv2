export default function CommissionsLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}
