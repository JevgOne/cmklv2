"use client";

interface ModeSelectorProps {
  onSelectDonor: () => void;
  onSelectSingle: () => void;
}

export function ModeSelector({ onSelectDonor, onSelectSingle }: ModeSelectorProps) {
  return (
    <div className="px-4 py-8">
      <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
        Co chcete přidat?
      </h2>
      <p className="text-sm text-gray-500 text-center mb-8">
        Vyberte, zda přidáváte celé auto k rozebrání nebo jednotlivý díl
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onSelectDonor}
          className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-center group"
        >
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl group-hover:bg-orange-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-[15px]">Celé auto</div>
            <div className="text-xs text-gray-500 mt-1">
              VIN → automaticky 20-30 dílů najednou
            </div>
          </div>
        </button>

        <button
          onClick={onSelectSingle}
          className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all text-center group"
        >
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl group-hover:bg-blue-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-[15px]">Jednotlivý díl</div>
            <div className="text-xs text-gray-500 mt-1">
              1 díl + fotky a cena
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
