"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { filterPartsByDamage, type DamageZone, type DamageLevel } from "@/lib/damage-zones";
import { getGroupsForParts, type TecdocArticle } from "@/lib/tecdoc";

export interface SelectedPart {
  articleId: number;
  name: string;
  productGroup: string;
  grade: "A" | "B" | "C";
  note: string;
  suggestedPrice: { A: number; B: number; C: number };
}

interface PartsFilterStepProps {
  kTypeId: number | null;
  damageZones: Record<DamageZone, DamageLevel>;
  selectedParts: SelectedPart[];
  onPartsChange: (parts: SelectedPart[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const GRADE_OPTIONS = [
  { value: "A", label: "A — Jako nový" },
  { value: "B", label: "B — Použitý OK" },
  { value: "C", label: "C — Opotřebený" },
] as const;

export function PartsFilterStep({
  kTypeId,
  damageZones,
  selectedParts,
  onPartsChange,
  onNext,
  onBack,
}: PartsFilterStepProps) {
  const [allParts, setAllParts] = useState<TecdocArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExcluded, setShowExcluded] = useState(false);

  useEffect(() => {
    async function loadParts() {
      try {
        const res = await fetch("/api/tecdoc/parts-for-vehicle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kTypeId }),
        });
        if (res.ok) {
          const data = await res.json();
          setAllParts(data.parts ?? []);
        }
      } catch {
        // fallback empty
      } finally {
        setLoading(false);
      }
    }
    loadParts();
  }, [kTypeId]);

  const { available, warning, excluded } = filterPartsByDamage(
    allParts,
    damageZones
  );

  const isSelected = (articleId: number) =>
    selectedParts.some((p) => p.articleId === articleId);

  const getSelectedPart = (articleId: number) =>
    selectedParts.find((p) => p.articleId === articleId);

  const togglePart = (part: TecdocArticle) => {
    if (isSelected(part.articleId)) {
      onPartsChange(selectedParts.filter((p) => p.articleId !== part.articleId));
    } else {
      onPartsChange([
        ...selectedParts,
        {
          articleId: part.articleId,
          name: part.name,
          productGroup: part.productGroup,
          grade: "B",
          note: "",
          suggestedPrice: part.suggestedPrice,
        },
      ]);
    }
  };

  const updatePartGrade = (articleId: number, grade: "A" | "B" | "C") => {
    onPartsChange(
      selectedParts.map((p) =>
        p.articleId === articleId ? { ...p, grade } : p
      )
    );
  };

  const selectAllInGroup = (parts: TecdocArticle[]) => {
    const newParts = parts.filter((p) => !isSelected(p.articleId));
    onPartsChange([
      ...selectedParts,
      ...newParts.map((p) => ({
        articleId: p.articleId,
        name: p.name,
        productGroup: p.productGroup,
        grade: "B" as const,
        note: "",
        suggestedPrice: p.suggestedPrice,
      })),
    ]);
  };

  const deselectAllInGroup = (parts: TecdocArticle[]) => {
    const ids = new Set(parts.map((p) => p.articleId));
    onPartsChange(selectedParts.filter((p) => !ids.has(p.articleId)));
  };

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-gray-500">
        Načítám seznam dílů...
      </div>
    );
  }

  const groupedAvailable = getGroupsForParts(available);
  const groupedWarning = getGroupsForParts(warning);

  const renderPartRow = (
    part: TecdocArticle,
    isWarning = false
  ) => {
    const selected = isSelected(part.articleId);
    const sel = getSelectedPart(part.articleId);

    return (
      <div
        key={part.articleId}
        className={`flex items-center gap-3 py-2 ${
          isWarning ? "bg-amber-50 px-2 rounded-lg" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => togglePart(part)}
          className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
        />
        <span
          className={`flex-1 text-sm ${
            selected ? "text-gray-900 font-medium" : "text-gray-600"
          }`}
        >
          {part.name}
          {isWarning && (
            <span className="text-xs text-amber-600 ml-1">
              (zkontrolujte stav)
            </span>
          )}
        </span>
        {selected && sel && (
          <select
            value={sel.grade}
            onChange={(e) =>
              updatePartGrade(part.articleId, e.target.value as "A" | "B" | "C")
            }
            className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white"
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.value}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Výběr dílů</h2>
        <span className="text-sm text-gray-500">Krok 4 / 8</span>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Dostupných {available.length + warning.length} z {allParts.length} dílů
        · Vybráno: <strong>{selectedParts.length}</strong>
      </div>

      {/* Available parts by group */}
      <div className="space-y-4">
        {groupedAvailable.map(({ group, groupName, parts }) => (
          <div key={group}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                {groupName}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => selectAllInGroup(parts)}
                  className="text-xs text-orange-600 hover:text-orange-700"
                >
                  Vše
                </button>
                <button
                  onClick={() => deselectAllInGroup(parts)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Nic
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {parts.map((part) => renderPartRow(part))}
            </div>
          </div>
        ))}

        {/* Warning parts */}
        {groupedWarning.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wide mb-2">
              Díly s varováním (těžce poškozená zóna)
            </h3>
            {groupedWarning.map(({ parts }) =>
              parts.map((part) => renderPartRow(part, true))
            )}
          </div>
        )}

        {/* Excluded parts */}
        {excluded.length > 0 && (
          <div>
            <button
              onClick={() => setShowExcluded(!showExcluded)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              {showExcluded ? "Skrýt" : "Zobrazit"} vyřazené díly (
              {excluded.length})
            </button>
            {showExcluded && (
              <div className="mt-2 opacity-60">
                {excluded.map((part) => renderPartRow(part))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Zpět
        </button>
        <Button
          variant="primary"
          size="sm"
          disabled={selectedParts.length === 0}
          onClick={onNext}
        >
          Pokračovat ({selectedParts.length} dílů)
        </Button>
      </div>
    </div>
  );
}
