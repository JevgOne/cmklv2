import Link from "next/link";

export function AddVehicleCTA() {
  return (
    <Link
      href="/makler/vehicles/new"
      className="block w-full rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-orange transition-all duration-200 hover:-translate-y-0.5 hover:shadow-orange-hover no-underline"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          🚗
        </div>
        <div>
          <div className="text-lg font-bold">Pridat vozidlo</div>
          <div className="text-sm text-white/80">Vytvorit novy inzerat</div>
        </div>
      </div>
    </Link>
  );
}
