import Link from "next/link";
import { cn } from "@/lib/utils";

interface VehicleDetailTabsProps {
  parameters: { label: string; value: string }[];
  equipment: string[];
  description: string;
  history: { date: string; event: string; detail: string | null }[];
  activeTab?: string;
  slug: string;
}

const tabItems = [
  { value: "params", label: "Parametry" },
  { value: "equipment", label: "Výbava" },
  { value: "description", label: "Popis" },
  { value: "history", label: "Historie" },
];

export function VehicleDetailTabs({
  parameters,
  equipment,
  description,
  history,
  activeTab = "params",
  slug,
}: VehicleDetailTabsProps) {
  const tab = tabItems.some((t) => t.value === activeTab) ? activeTab : "params";

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      {/* Tab buttons — Link-based, no client JS needed */}
      <div className="p-3 sm:p-4 pb-0 overflow-x-auto">
        <div role="tablist" className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {tabItems.map((t) => {
            const isActive = tab === t.value;
            return (
              <Link
                key={t.value}
                href={`/nabidka/${slug}?tab=${t.value}`}
                replace
                scroll={false}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-600 rounded-[10px] transition-all duration-200 hover:text-gray-900 whitespace-nowrap flex-shrink-0 no-underline",
                  isActive && "bg-white text-gray-900 shadow-sm",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 sm:p-6">
        {/* ---- Parametry ---- */}
        {tab === "params" && (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0">
            {parameters.map((param) => (
              <div
                key={param.label}
                className="flex justify-between items-center py-3 border-b border-gray-100"
              >
                <span className="text-sm text-gray-500">{param.label}</span>
                <span className="text-sm font-semibold text-gray-900 text-right">
                  {param.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ---- Výbava ---- */}
        {tab === "equipment" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {equipment.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 py-2 text-sm text-gray-700"
              >
                <span className="w-5 h-5 bg-success-50 text-success-500 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
        )}

        {/* ---- Popis ---- */}
        {tab === "description" && (
          <div className="max-w-3xl">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>
        )}

        {/* ---- Historie ---- */}
        {tab === "history" && (
          <div className="relative pl-6">
            {/* Timeline line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />

            <div className="flex flex-col gap-6">
              {history.map((entry, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1.5 w-[18px] h-[18px] rounded-full bg-white border-2 border-orange-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>

                  {/* Content */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1">
                      {entry.date}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {entry.event}
                    </div>
                    {entry.detail && (
                      <div className="text-sm text-gray-500 mt-0.5">
                        {entry.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
