export default function NotificationSettingsLoading() {
  return (
    <div className="p-4 animate-pulse space-y-4 max-w-lg mx-auto">
      <div>
        <div className="h-8 w-56 bg-gray-200 rounded" />
        <div className="h-4 w-72 bg-gray-200 rounded mt-2" />
      </div>

      <div className="h-10 bg-gray-100 rounded-2xl" />

      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  );
}
