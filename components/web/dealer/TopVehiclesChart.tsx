"use client";

interface VehicleData {
  brand: string;
  model: string;
  year: number;
  count: number;
}

export function TopVehiclesChart({ vehicles }: { vehicles: VehicleData[] }) {
  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Nejpoptávanější vozidla</h3>
        <p className="text-sm text-gray-400">Zatím žádné poptávky</p>
      </div>
    );
  }

  const max = vehicles[0]?.count || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Nejpoptávanější vozidla</h3>
      <div className="space-y-3">
        {vehicles.map((v, i) => {
          const pct = Math.round((v.count / max) * 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-700 font-medium">
                  {v.brand} {v.model} {v.year}
                </span>
                <span className="text-gray-500">
                  {v.count} {v.count === 1 ? "poptávka" : v.count < 5 ? "poptávky" : "poptávek"}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
