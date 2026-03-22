"use client";

import { useState, useCallback, useEffect } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_EQUIPMENT_CATALOG,
  type EquipmentCategory,
} from "@/types/vehicle-draft";
import { getDB } from "@/lib/offline/db";

interface EquipmentSelectorProps {
  selectedEquipment: string[];
  vinEquipment?: string[];
  onChange: (equipment: string[]) => void;
}

export function EquipmentSelector({
  selectedEquipment,
  vinEquipment = [],
  onChange,
}: EquipmentSelectorProps) {
  const [catalog, setCatalog] = useState<EquipmentCategory[]>(
    DEFAULT_EQUIPMENT_CATALOG
  );
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);

  // Načíst katalog z IndexedDB (pokud existuje aktualizovaná verze)
  useEffect(() => {
    async function loadCatalog() {
      try {
        const db = await getDB();
        const stored = await db.getAll("equipmentCatalog");
        if (stored.length > 0) {
          const categories: EquipmentCategory[] = stored.map((s) => ({
            id: s.id,
            label: s.category,
            items: s.items,
          }));
          setCatalog(categories);
        }
      } catch {
        // Fallback na default
      }
    }
    loadCatalog();
  }, []);

  const toggleItem = useCallback(
    (item: string) => {
      const next = selectedEquipment.includes(item)
        ? selectedEquipment.filter((i) => i !== item)
        : [...selectedEquipment, item];
      onChange(next);
    },
    [selectedEquipment, onChange]
  );

  const addCustomItem = useCallback(
    (categoryId: string) => {
      const trimmed = customInput.trim();
      if (!trimmed) return;
      if (!selectedEquipment.includes(trimmed)) {
        onChange([...selectedEquipment, trimmed]);
      }
      setCustomInput("");
      setAddingToCategory(null);
    },
    [customInput, selectedEquipment, onChange]
  );

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
    setAddingToCategory(null);
    setCustomInput("");
  }, []);

  return (
    <div className="space-y-3">
      {/* VIN výbava — pokud existuje */}
      {vinEquipment.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Výbava z VIN
          </h4>
          <div className="space-y-1.5">
            {vinEquipment.map((item) => (
              <Checkbox
                key={`vin-${item}`}
                label={item}
                checked={selectedEquipment.includes(item)}
                onChange={() => toggleItem(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Katalog výbavy po kategoriích */}
      {catalog.map((category) => {
        const isExpanded = expandedCategory === category.id;
        const selectedCount = category.items.filter((i) =>
          selectedEquipment.includes(i)
        ).length;

        return (
          <div
            key={category.id}
            className="border border-gray-100 rounded-xl overflow-hidden"
          >
            {/* Header kategorie */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900">
                {category.label}
              </span>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                    {selectedCount}
                  </span>
                )}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>

            {/* Items */}
            {isExpanded && (
              <div className="px-3.5 pb-3.5 space-y-1.5 border-t border-gray-50">
                <div className="pt-2 space-y-1.5">
                  {category.items.map((item) => (
                    <Checkbox
                      key={item}
                      label={item}
                      checked={selectedEquipment.includes(item)}
                      onChange={() => toggleItem(item)}
                    />
                  ))}
                </div>

                {/* Přidat vlastní */}
                {addingToCategory === category.id ? (
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Název položky"
                      className="!py-2 !text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomItem(category.id);
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => addCustomItem(category.id)}
                      disabled={!customInput.trim()}
                    >
                      Přidat
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAddingToCategory(null);
                        setCustomInput("");
                      }}
                    >
                      Zrušit
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingToCategory(category.id)}
                    className="mt-2 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors"
                  >
                    + Přidat vlastní položku
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
