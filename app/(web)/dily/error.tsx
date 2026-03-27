'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Něco se pokazilo</h2>
        <p className="text-gray-600 mb-6">{error.message || 'Došlo k neočekávané chybě.'}</p>
        <button onClick={reset} className="px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition">
          Zkusit znovu
        </button>
      </div>
    </div>
  )
}
