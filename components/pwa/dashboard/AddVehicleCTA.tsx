import Link from "next/link";

interface AddVehicleCTAProps {
  quickModeEnabled?: boolean;
}

export function AddVehicleCTA({ quickModeEnabled = false }: AddVehicleCTAProps) {
  if (quickModeEnabled) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {/* Rychlé nabírání */}
        <Link
          href="/makler/vehicles/quick"
          className="block rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white shadow-orange transition-all duration-200 hover:-translate-y-0.5 hover:shadow-orange-hover no-underline"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              &#9889;
            </div>
            <div>
              <div className="text-sm font-bold">Rychle nabrat</div>
              <div className="text-xs text-white/70 mt-0.5">3 kroky</div>
            </div>
          </div>
        </Link>

        {/* Kompletní flow */}
        <Link
          href="/makler/vehicles/new"
          className="block rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 p-4 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg no-underline"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              &#128203;
            </div>
            <div>
              <div className="text-sm font-bold">Kompletně</div>
              <div className="text-xs text-white/70 mt-0.5">7 kroků</div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Výchozí CTA — pouze kompletní flow
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
          <div className="text-lg font-bold">Přidat vozidlo</div>
          <div className="text-sm text-white/80">Vytvořit nový inzerát</div>
        </div>
      </div>
    </Link>
  );
}
