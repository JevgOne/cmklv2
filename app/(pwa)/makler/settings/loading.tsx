export default function SettingsLoading() {
  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}
