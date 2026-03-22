export default function PotvrzeniLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-card p-8 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6 animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  );
}
