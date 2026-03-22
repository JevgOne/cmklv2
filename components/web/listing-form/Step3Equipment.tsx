"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { DEFAULT_EQUIPMENT_CATALOG } from "@/types/vehicle-draft";
import type { ListingFormData } from "./ListingFormWizard";

interface Step3Props {
  data: ListingFormData;
  updateData: (updates: Partial<ListingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step3Equipment({ data, updateData, onNext, onPrev }: Step3Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    DEFAULT_EQUIPMENT_CATALOG[0]?.id ?? null
  );
  const [customInput, setCustomInput] = useState("");
  const [highlightInput, setHighlightInput] = useState("");

  const toggleEquipment = (item: string) => {
    const isSelected = data.equipment.includes(item);
    if (isSelected) {
      updateData({ equipment: data.equipment.filter((e) => e !== item) });
    } else {
      updateData({ equipment: [...data.equipment, item] });
    }
  };

  const addCustomEquipment = () => {
    const val = customInput.trim();
    if (val && !data.customEquipment.includes(val)) {
      updateData({ customEquipment: [...data.customEquipment, val] });
      setCustomInput("");
    }
  };

  const removeCustomEquipment = (item: string) => {
    updateData({ customEquipment: data.customEquipment.filter((e) => e !== item) });
  };

  const addHighlight = () => {
    const val = highlightInput.trim();
    if (val && !data.highlights.includes(val)) {
      updateData({ highlights: [...data.highlights, val] });
      setHighlightInput("");
    }
  };

  const removeHighlight = (item: string) => {
    updateData({ highlights: data.highlights.filter((h) => h !== item) });
  };

  const totalSelected = data.equipment.length + data.customEquipment.length;

  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Výbava vozidla</h2>
      <p className="text-sm text-gray-500 mb-6">
        Vyberte výbavu vašeho vozu. Vybráno: <span className="font-semibold text-orange-500">{totalSelected}</span> položek
      </p>

      {/* Category accordion */}
      <div className="space-y-2">
        {DEFAULT_EQUIPMENT_CATALOG.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const selectedInCategory = category.items.filter((item) =>
            data.equipment.includes(item)
          ).length;

          return (
            <div key={category.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer border-none text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 text-sm">{category.label}</span>
                  {selectedInCategory > 0 && (
                    <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {selectedInCategory}
                    </span>
                  )}
                </div>
                <span className={cn("text-gray-400 transition-transform", isExpanded && "rotate-180")}>
                  &#9662;
                </span>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {category.items.map((item) => (
                    <Checkbox
                      key={item}
                      label={item}
                      checked={data.equipment.includes(item)}
                      onChange={() => toggleEquipment(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom equipment */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Přidat vlastní výbavu</h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Např. Sportovní výfuk"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomEquipment();
                }
              }}
            />
          </div>
          <Button type="button" variant="outline" onClick={addCustomEquipment} disabled={!customInput.trim()}>
            Přidat
          </Button>
        </div>
        {data.customEquipment.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.customEquipment.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeCustomEquipment(item)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-none text-base leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Highlights */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-bold text-gray-700 mb-2">Hlavní přednosti</h3>
        <p className="text-xs text-gray-500 mb-3">
          Uveďte 3-5 hlavních předností vozu, které se zobrazí v inzerátu.
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Např. Garanční prohlídka, Nové brzdy..."
              value={highlightInput}
              onChange={(e) => setHighlightInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHighlight();
                }
              }}
            />
          </div>
          <Button type="button" variant="outline" onClick={addHighlight} disabled={!highlightInput.trim()}>
            Přidat
          </Button>
        </div>
        {data.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.highlights.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeHighlight(item)}
                  className="text-orange-400 hover:text-orange-600 cursor-pointer bg-transparent border-none text-base leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={onPrev}>
          &larr; Zpět
        </Button>
        <Button variant="primary" onClick={onNext}>
          Pokračovat &rarr;
        </Button>
      </div>
    </Card>
  );
}
