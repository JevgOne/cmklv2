"use client";

interface TypeStepProps {
  selectedType: "BROKERAGE" | "HANDOVER" | null;
  onSelect: (type: "BROKERAGE" | "HANDOVER") => void;
}

const CONTRACT_TYPES = [
  {
    type: "BROKERAGE" as const,
    title: "Zprostředkovatelská smlouva",
    description:
      "Smlouva o zprostředkování prodeje vozidla. Prodejce pověřuje makléře nalezením kupce.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
  },
  {
    type: "HANDOVER" as const,
    title: "Předávací protokol",
    description:
      "Protokol o předání vozidla. Dokumentuje stav vozu při předání mezi stranami.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-8 h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
    ),
  },
];

export function TypeStep({ selectedType, onSelect }: TypeStepProps) {
  return (
    <div className="p-6 space-y-4">
      <p className="text-gray-500 text-sm">
        Vyberte typ dokumentu, který chcete vytvořit.
      </p>

      {CONTRACT_TYPES.map((ct) => (
        <button
          key={ct.type}
          onClick={() => onSelect(ct.type)}
          className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
            selectedType === ct.type
              ? "border-orange-500 bg-orange-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selectedType === ct.type
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {ct.icon}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{ct.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{ct.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
