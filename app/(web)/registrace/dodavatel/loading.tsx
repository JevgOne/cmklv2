export default function DodavatelRegistraceLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="h-6 w-48 bg-green-100 rounded-full mx-auto animate-pulse mb-4" />
          <div className="h-10 w-80 bg-green-100 rounded-lg mx-auto animate-pulse" />
          <div className="h-5 w-64 bg-green-50 rounded mt-3 mx-auto animate-pulse" />
        </div>
      </section>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
