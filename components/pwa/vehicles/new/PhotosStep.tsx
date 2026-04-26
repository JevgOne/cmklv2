"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { StepLayout } from "@/components/pwa/vehicles/new/StepLayout";
import { PhotoGuide } from "@/components/pwa/vehicles/new/PhotoGuide";
import { Button, ProgressBar, Dropdown } from "@/components/ui";
import { PhotoPositionDiagram } from "@/components/pwa/vehicles/new/PhotoPositionDiagram";
import { HintBox } from "@/components/pwa/vehicles/new/HintBox";
import { offlineStorage } from "@/lib/offline/storage";
import { resizeImage, createThumbnail } from "@/lib/image-utils";

// ============================================
// PHOTO SLOT DEFINITIONS
// ============================================

interface PhotoSlot {
  id: string;
  label: string;
  tip: string;
  required: boolean;
}

interface PhotoCategory {
  id: string;
  label: string;
  slots: PhotoSlot[];
}

const PHOTO_CATEGORIES: PhotoCategory[] = [
  {
    id: "exterior",
    label: "Exteriér",
    slots: [
      { id: "ext_front_34", label: "1. Přední 3/4 pohled", tip: "Klasický prodejní záběr. Pravý přední roh, 45°. Vůz čistý, denní světlo.", required: true },
      { id: "ext_front", label: "2. Přímý přední pohled", tip: "Přímo zepředu, symetricky. Zachyťte masku, světla, SPZ.", required: true },
      { id: "ext_right", label: "3. Pravý bok", tip: "Kolmo k pravému boku, ze středu vozu. Foťte z pasu, ne shora.", required: true },
      { id: "ext_rear_34", label: "4. Zadní 3/4 (pravý)", tip: "Pravý zadní roh, 45°. Zachyťte svítilny, výfuk.", required: true },
      { id: "ext_rear", label: "5. Přímý zadní pohled", tip: "Přímo zezadu, symetricky. SPZ, svítilny, nárazník.", required: true },
      { id: "ext_left", label: "6. Levý bok", tip: "Kolmo k levému boku, ze středu vozu. Stejná výška jako pravý bok.", required: true },
      { id: "ext_front_34_left", label: "7. Přední 3/4 (levý)", tip: "Levý přední roh, 45°. Doplňkový záběr z druhé strany.", required: true },
      { id: "ext_rear_34_left", label: "8. Zadní 3/4 (levý)", tip: "Levý zadní roh, 45°. Doplňkový záběr z druhé strany.", required: true },
      { id: "ext_headlight", label: "9. Detail předního světla", tip: "Přibližte se k pravému světlu. Detail DRL, čočky. Bez orosení.", required: false },
      { id: "ext_wheel_front", label: "10. Přední kolo", tip: "Pravé přední kolo. Disk, pneumatika (DOT viditelný), brzdový kotouč.", required: false },
      { id: "ext_wheel_rear", label: "11. Zadní kolo", tip: "Pravé zadní kolo. Stav pneumatiky, hloubka dezénu.", required: false },
      { id: "ext_badge", label: "12. Logo / badge", tip: "Zadní badge výrobce + model. Pro verifikaci typu vozu.", required: false },
      { id: "ext_roof", label: "13. Střecha", tip: "Ze strany, mírně shora. Stav střechy, panoramatické okno.", required: false },
    ],
  },
  {
    id: "interior",
    label: "Interiér",
    slots: [
      { id: "int_dashboard", label: "Palubní deska", tip: "Celkový pohled na palubní desku zepředu", required: true },
      { id: "int_front_seats", label: "Přední sedadla", tip: "Pohled z prostoru zadních sedadel", required: true },
      { id: "int_rear_seats", label: "Zadní sedadla", tip: "Pohled zepředu na zadní sedadla", required: true },
      { id: "int_trunk", label: "Zavazadlový prostor", tip: "Otevřený kufr, pohled zezadu", required: true },
    ],
  },
  {
    id: "engine",
    label: "Motor",
    slots: [
      { id: "eng_bay", label: "Motorový prostor", tip: "Otevřená kapota, pohled shora", required: true },
    ],
  },
  {
    id: "evidence",
    label: "Důkazní fotky",
    slots: [
      { id: "evi_odometer", label: "Tachometr", tip: "Nastartujte motor a vyfoťte stav km", required: true },
      { id: "evi_vin", label: "VIN štítek", tip: "Štítek ve dveřích nebo pod kapotou, musí být čitelný", required: true },
      { id: "evi_keys", label: "Klíče s doklady", tip: "Položte klíče vedle technického průkazu", required: true },
    ],
  },
  {
    id: "documents",
    label: "Doklady",
    slots: [
      { id: "doc_tp", label: "Technický průkaz", tip: "Obě strany technického průkazu", required: false },
      { id: "doc_service", label: "Servisní kniha", tip: "Otevřená servisní kniha s posledním záznamem", required: false },
    ],
  },
];

const MIN_REGULAR_PHOTOS = 13;
const EVIDENCE_REQUIRED = 3;

interface StoredPhoto {
  slotId: string;
  imageId: string;
  thumbnailUrl: string;
  isMain: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function PhotosStep() {
  const router = useRouter();
  const { draft, updateSection, updateStep } = useDraftContext();
  const draftId = draft?.id;
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [defectPhotos, setDefectPhotos] = useState<StoredPhoto[]>([]);
  const [activeGuide, setActiveGuide] = useState<{
    slot: PhotoSlot;
    category: PhotoCategory;
    slotIndex: number;
  } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Migrace starých slot IDs z draftů
  const SLOT_MIGRATION: Record<string, string> = {
    ext_lights: "ext_headlight",
    ext_wheels: "ext_wheel_front",
  };

  // Load saved photos from draft on mount
  useEffect(() => {
    if (draft?.photos) {
      const raw = draft.photos as unknown as StoredPhoto[];
      const migrated = raw.map((p) => ({
        ...p,
        slotId: SLOT_MIGRATION[p.slotId] || p.slotId,
      }));
      setPhotos(migrated);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.photos]);

  // Persist photos to draft
  const persistPhotos = useCallback(
    (updated: StoredPhoto[], updatedDefects?: StoredPhoto[]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateSection("photos", { photos: updated as any });
    },
    [updateSection, defectPhotos]
  );

  const getPhotoForSlot = useCallback(
    (slotId: string) => photos.find((p) => p.slotId === slotId),
    [photos]
  );

  const regularPhotoCount = photos.length;
  const evidencePhotoCount = photos.filter((p) =>
    p.slotId.startsWith("evi_")
  ).length;

  const canContinue =
    regularPhotoCount >= MIN_REGULAR_PHOTOS &&
    evidencePhotoCount >= EVIDENCE_REQUIRED;

  const totalRequired = MIN_REGULAR_PHOTOS + EVIDENCE_REQUIRED;
  const totalFilled = regularPhotoCount;
  const progressPercent = Math.min(
    100,
    Math.round((totalFilled / totalRequired) * 100)
  );

  // Handle photo capture from PhotoGuide
  const handleCapture = useCallback(
    async (slotId: string, fullBlob: Blob, thumbBlob: Blob) => {
      const imageId = `${draftId}_${slotId}_${Date.now()}`;

      // Save full image to IndexedDB
      await offlineStorage.saveImage(imageId, draftId ?? "", fullBlob);

      const thumbnailUrl = URL.createObjectURL(thumbBlob);

      const isDefect = slotId.startsWith("defect_");

      if (isDefect) {
        const updated = [
          ...defectPhotos,
          { slotId, imageId, thumbnailUrl, isMain: false },
        ];
        setDefectPhotos(updated);
        persistPhotos(photos, updated);
      } else {
        // Remove existing photo for this slot if any
        const existing = photos.find((p) => p.slotId === slotId);
        if (existing) {
          // Clean up old image
          try {
            const db = await import("@/lib/offline/db").then((m) => m.getDB());
            const dbInstance = await db;
            await dbInstance.delete("images", existing.imageId);
          } catch {
            // Ignore cleanup errors
          }
        }

        const updated = [
          ...photos.filter((p) => p.slotId !== slotId),
          { slotId, imageId, thumbnailUrl, isMain: false },
        ];
        setPhotos(updated);
        persistPhotos(updated);
      }

      setActiveGuide(null);
    },
    [draftId, photos, defectPhotos, persistPhotos]
  );

  // Handle file input fallback for slots
  const handleFileInput = useCallback(
    async (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const [full, thumb] = await Promise.all([
        resizeImage(file),
        createThumbnail(file),
      ]);

      await handleCapture(slotId, full, thumb);
    },
    [handleCapture]
  );

  const handleDeletePhoto = useCallback(
    async (slotId: string, isDefect: boolean) => {
      if (isDefect) {
        const photo = defectPhotos.find((p) => p.slotId === slotId);
        if (photo) {
          try {
            const db = await import("@/lib/offline/db").then((m) => m.getDB());
            const dbInstance = await db;
            await dbInstance.delete("images", photo.imageId);
          } catch {
            // Ignore
          }
          URL.revokeObjectURL(photo.thumbnailUrl);
        }
        const updated = defectPhotos.filter((p) => p.slotId !== slotId);
        setDefectPhotos(updated);
        persistPhotos(photos, updated);
      } else {
        const photo = photos.find((p) => p.slotId === slotId);
        if (photo) {
          try {
            const db = await import("@/lib/offline/db").then((m) => m.getDB());
            const dbInstance = await db;
            await dbInstance.delete("images", photo.imageId);
          } catch {
            // Ignore
          }
          URL.revokeObjectURL(photo.thumbnailUrl);
        }
        const updated = photos.filter((p) => p.slotId !== slotId);
        setPhotos(updated);
        persistPhotos(updated);
      }
    },
    [photos, defectPhotos, persistPhotos]
  );

  const handleSetMain = useCallback(
    (slotId: string) => {
      const updated = photos.map((p) => ({
        ...p,
        isMain: p.slotId === slotId,
      }));
      setPhotos(updated);
      persistPhotos(updated);
    },
    [photos, persistPhotos]
  );

  const handleViewFullscreen = useCallback(
    async (imageId: string) => {
      try {
        const images = await offlineStorage.getImages(draftId ?? "");
        const img = images.find((i) => i.id === imageId);
        if (img) {
          setFullscreenImage(URL.createObjectURL(img.blob));
        }
      } catch {
        // Ignore
      }
    },
    [draftId]
  );

  const handleAddDefect = useCallback(() => {
    const defectId = `defect_${Date.now()}`;
    const fakeSlot: PhotoSlot = {
      id: defectId,
      label: `Defekt ${defectPhotos.length + 1}`,
      tip: "Vyfoťte detail defektu zblízka",
      required: false,
    };
    const fakeCategory: PhotoCategory = {
      id: "defects",
      label: "Defekty",
      slots: [],
    };
    setActiveGuide({
      slot: fakeSlot,
      category: fakeCategory,
      slotIndex: defectPhotos.length,
    });
  }, [defectPhotos.length]);

  const handleContinue = useCallback(() => {
    updateStep(5);
    router.push(`/makler/vehicles/new/details?draft=${draftId}`);
  }, [router, draftId, updateStep]);

  if (loading) {
    return (
      <StepLayout step={4} title="Fotodokumentace">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout step={4} title="Fotodokumentace">
      <div className="space-y-6">
        <HintBox>
          Kvalitní fotky prodávají! Foťte za denního světla, auto čisté.
          Povinné jsou fotky VIN štítku a tachometru.
          Klikněte na číslo v diagramu nebo na slot v seznamu.
        </HintBox>

        {/* Categories */}
        {PHOTO_CATEGORIES.map((category) => (
          <div key={category.id}>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
              {category.label}
              {category.id === "evidence" && (
                <span className="text-orange-500 ml-1">(povinné)</span>
              )}
            </h3>

            {category.id === "exterior" && (
              <PhotoPositionDiagram
                activeSlot={null}
                completedSlots={photos
                  .filter((p) => p.slotId.startsWith("ext_"))
                  .map((p) => p.slotId)}
                onSlotClick={(slotId) => {
                  const slot = category.slots.find((s) => s.id === slotId);
                  if (slot) {
                    const slotIndex = category.slots.indexOf(slot);
                    setActiveGuide({ slot, category, slotIndex });
                  }
                }}
              />
            )}

            <div className="grid grid-cols-4 gap-2">
              {category.slots.map((slot, slotIndex) => {
                const photo = getPhotoForSlot(slot.id);

                return (
                  <div key={slot.id} className="relative">
                    {photo ? (
                      <Dropdown
                        trigger={
                          <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer border-2 border-green-500">
                            <img
                              src={photo.thumbnailUrl}
                              alt={slot.label}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                              ✓
                            </div>
                            {photo.isMain && (
                              <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-[10px] text-center py-0.5">
                                Hlavní
                              </div>
                            )}
                          </div>
                        }
                        items={[
                          {
                            label: "Zobrazit",
                            icon: "🔍",
                            onClick: () => handleViewFullscreen(photo.imageId),
                          },
                          {
                            label: "Označit jako hlavní",
                            icon: "⭐",
                            onClick: () => handleSetMain(slot.id),
                          },
                          {
                            label: "Smazat",
                            icon: "🗑",
                            danger: true,
                            onClick: () => handleDeletePhoto(slot.id, false),
                          },
                        ]}
                        dividerAfter={[1]}
                      />
                    ) : (
                      <button
                        onClick={() =>
                          setActiveGuide({ slot, category, slotIndex })
                        }
                        className="w-full aspect-square rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-gray-150 hover:border-gray-400 transition-colors"
                      >
                        <span className="text-xl text-gray-400">📷</span>
                        <span className="text-[10px] text-gray-500 leading-tight text-center px-1">
                          {slot.label}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Defect Photos */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
            Defekty
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {defectPhotos.map((photo) => (
              <Dropdown
                key={photo.slotId}
                trigger={
                  <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer border-2 border-amber-500">
                    <img
                      src={photo.thumbnailUrl}
                      alt="Defekt"
                      className="w-full h-full object-cover"
                    />
                  </div>
                }
                items={[
                  {
                    label: "Zobrazit",
                    icon: "🔍",
                    onClick: () => handleViewFullscreen(photo.imageId),
                  },
                  {
                    label: "Smazat",
                    icon: "🗑",
                    danger: true,
                    onClick: () => handleDeletePhoto(photo.slotId, true),
                  },
                ]}
              />
            ))}
            <button
              onClick={handleAddDefect}
              className="aspect-square rounded-lg bg-amber-50 border-2 border-dashed border-amber-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <span className="text-xl text-amber-500">+</span>
              <span className="text-[10px] text-amber-600">Přidat</span>
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {totalFilled} / {totalRequired} (minimum {MIN_REGULAR_PHOTOS}+
              {EVIDENCE_REQUIRED})
            </span>
            <span className="font-semibold text-gray-900">
              {progressPercent}%
            </span>
          </div>
          <ProgressBar
            value={progressPercent}
            variant={canContinue ? "green" : "default"}
          />
          {!canContinue && (
            <p className="text-xs text-gray-500">
              {evidencePhotoCount < EVIDENCE_REQUIRED
                ? `Chybí ${EVIDENCE_REQUIRED - evidencePhotoCount} důkazní fotky (tachometr, VIN, klíče)`
                : `Přidejte ještě ${MIN_REGULAR_PHOTOS - regularPhotoCount} fotek`}
            </p>
          )}
        </div>

        {/* Continue button */}
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full"
          size="lg"
        >
          Pokračovat
        </Button>
      </div>

      {/* PhotoGuide overlay */}
      {activeGuide && (
        <PhotoGuide
          slotName={activeGuide.slot.label}
          tip={activeGuide.slot.tip}
          categoryLabel={activeGuide.category.label}
          currentIndex={activeGuide.slotIndex}
          totalInCategory={activeGuide.category.slots.length || defectPhotos.length + 1}
          positionNumber={activeGuide.category.id === "exterior" ? activeGuide.slotIndex + 1 : undefined}
          onCapture={(full, thumb) =>
            handleCapture(activeGuide.slot.id, full, thumb)
          }
          onClose={() => setActiveGuide(null)}
        />
      )}

      {/* Fullscreen viewer */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black z-[250] flex items-center justify-center"
          onClick={() => {
            URL.revokeObjectURL(fullscreenImage);
            setFullscreenImage(null);
          }}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl z-10"
            onClick={() => {
              URL.revokeObjectURL(fullscreenImage);
              setFullscreenImage(null);
            }}
          >
            ✕
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </StepLayout>
  );
}
