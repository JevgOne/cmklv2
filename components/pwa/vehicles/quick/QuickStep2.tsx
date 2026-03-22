"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDraftContext } from "@/lib/hooks/useDraft";
import { StepLayout } from "@/components/pwa/vehicles/new/StepLayout";
import { PhotoGuide } from "@/components/pwa/vehicles/new/PhotoGuide";
import { Button, ProgressBar, Dropdown } from "@/components/ui";
import { offlineStorage } from "@/lib/offline/storage";
import { resizeImage, createThumbnail } from "@/lib/image-utils";

// ============================================
// QUICK PHOTO SLOTS — 5 povinných + volitelné
// ============================================

interface PhotoSlot {
  id: string;
  label: string;
  tip: string;
  required: boolean;
}

const QUICK_PHOTO_SLOTS: PhotoSlot[] = [
  {
    id: "quick_front_34",
    label: "Přední 3/4",
    tip: "Foťte za denního světla z pravého předního rohu",
    required: true,
  },
  {
    id: "quick_rear_34",
    label: "Zadní 3/4",
    tip: "Zachyťte celé auto z levého zadního rohu",
    required: true,
  },
  {
    id: "quick_interior",
    label: "Interiér",
    tip: "Celkový pohled na palubní desku zepředu",
    required: true,
  },
  {
    id: "quick_odometer",
    label: "Tachometr",
    tip: "Nastartujte motor a vyfoťte stav km",
    required: true,
  },
  {
    id: "quick_vin_tag",
    label: "VIN štítek",
    tip: "Štítek ve dveřích nebo pod kapotou, musí být čitelný",
    required: true,
  },
];

const MIN_QUICK_PHOTOS = 5;

interface StoredPhoto {
  slotId: string;
  imageId: string;
  thumbnailUrl: string;
  isMain: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function QuickStep2() {
  const router = useRouter();
  const { draft, updateSection } = useDraftContext();
  const draftId = draft?.id;
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [extraPhotos, setExtraPhotos] = useState<StoredPhoto[]>([]);
  const [activeGuide, setActiveGuide] = useState<{
    slot: PhotoSlot;
    slotIndex: number;
  } | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from draft
  useEffect(() => {
    if (draft?.photos) {
      const allPhotos = draft.photos as unknown as StoredPhoto[];
      if (Array.isArray(allPhotos)) {
        const quick = allPhotos.filter((p) => p.slotId.startsWith("quick_"));
        const extra = allPhotos.filter((p) => p.slotId.startsWith("extra_"));
        setPhotos(quick);
        setExtraPhotos(extra);
      }
    }
    setLoading(false);
  }, [draft?.photos]);

  // Persist photos
  const persistPhotos = useCallback(
    (mainPhotos: StoredPhoto[], extras: StoredPhoto[]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateSection("photos", { photos: [...mainPhotos, ...extras] as any });
    },
    [updateSection]
  );

  const getPhotoForSlot = useCallback(
    (slotId: string) => photos.find((p) => p.slotId === slotId),
    [photos]
  );

  const requiredFilled = photos.filter((p) =>
    QUICK_PHOTO_SLOTS.some((s) => s.id === p.slotId && s.required)
  ).length;

  const totalPhotos = photos.length + extraPhotos.length;
  const canContinue = requiredFilled >= MIN_QUICK_PHOTOS;

  const progressPercent = Math.min(
    100,
    Math.round((requiredFilled / MIN_QUICK_PHOTOS) * 100)
  );

  // Capture
  const handleCapture = useCallback(
    async (slotId: string, fullBlob: Blob, thumbBlob: Blob) => {
      const imageId = `${draftId}_${slotId}_${Date.now()}`;
      await offlineStorage.saveImage(imageId, draftId ?? "", fullBlob);
      const thumbnailUrl = URL.createObjectURL(thumbBlob);

      const isExtra = slotId.startsWith("extra_");

      if (isExtra) {
        const updated = [
          ...extraPhotos,
          { slotId, imageId, thumbnailUrl, isMain: false },
        ];
        setExtraPhotos(updated);
        persistPhotos(photos, updated);
      } else {
        const existing = photos.find((p) => p.slotId === slotId);
        if (existing) {
          try {
            const db = await import("@/lib/offline/db").then((m) => m.getDB());
            const dbInstance = await db;
            await dbInstance.delete("images", existing.imageId);
          } catch {
            // Ignore
          }
        }
        const updated = [
          ...photos.filter((p) => p.slotId !== slotId),
          { slotId, imageId, thumbnailUrl, isMain: slotId === "quick_front_34" },
        ];
        setPhotos(updated);
        persistPhotos(updated, extraPhotos);
      }

      setActiveGuide(null);
    },
    [draftId, photos, extraPhotos, persistPhotos]
  );

  // File input fallback
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

  // Delete
  const handleDeletePhoto = useCallback(
    async (slotId: string, isExtra: boolean) => {
      const list = isExtra ? extraPhotos : photos;
      const photo = list.find((p) => p.slotId === slotId);
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

      if (isExtra) {
        const updated = extraPhotos.filter((p) => p.slotId !== slotId);
        setExtraPhotos(updated);
        persistPhotos(photos, updated);
      } else {
        const updated = photos.filter((p) => p.slotId !== slotId);
        setPhotos(updated);
        persistPhotos(updated, extraPhotos);
      }
    },
    [photos, extraPhotos, persistPhotos]
  );

  // Fullscreen viewer
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

  // Přidat další fotku
  const handleAddExtra = useCallback(() => {
    const extraId = `extra_${Date.now()}`;
    const fakeSlot: PhotoSlot = {
      id: extraId,
      label: `Další fotka ${extraPhotos.length + 1}`,
      tip: "Vyfoťte další detail vozidla",
      required: false,
    };
    setActiveGuide({ slot: fakeSlot, slotIndex: extraPhotos.length });
  }, [extraPhotos.length]);

  const handleContinue = useCallback(() => {
    router.push(`/makler/vehicles/quick/step3?draft=${draftId}`);
  }, [router, draftId]);

  if (loading) {
    return (
      <StepLayout step={2} title="Fotky" totalSteps={3}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </StepLayout>
    );
  }

  return (
    <StepLayout step={2} title="Fotky" totalSteps={3}>
      <div className="space-y-6">
        {/* Povinné fotky */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
            Povinné fotky <span className="text-orange-500">(5)</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {QUICK_PHOTO_SLOTS.map((slot, slotIndex) => {
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
                            &#10003;
                          </div>
                        </div>
                      }
                      items={[
                        {
                          label: "Zobrazit",
                          icon: "🔍",
                          onClick: () => handleViewFullscreen(photo.imageId),
                        },
                        {
                          label: "Předělat",
                          icon: "📷",
                          onClick: () => setActiveGuide({ slot, slotIndex }),
                        },
                        {
                          label: "Smazat",
                          icon: "🗑",
                          danger: true,
                          onClick: () => handleDeletePhoto(slot.id, false),
                        },
                      ]}
                    />
                  ) : (
                    <button
                      onClick={() => setActiveGuide({ slot, slotIndex })}
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

        {/* Další fotky */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
            Další fotky
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {extraPhotos.map((photo) => (
              <Dropdown
                key={photo.slotId}
                trigger={
                  <div className="aspect-square rounded-lg overflow-hidden relative cursor-pointer border-2 border-blue-400">
                    <img
                      src={photo.thumbnailUrl}
                      alt="Další fotka"
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
              onClick={handleAddExtra}
              className="aspect-square rounded-lg bg-blue-50 border-2 border-dashed border-blue-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-blue-100 transition-colors"
            >
              <span className="text-xl text-blue-500">+</span>
              <span className="text-[10px] text-blue-600">Přidat</span>
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {requiredFilled} / {MIN_QUICK_PHOTOS} povinných
              {extraPhotos.length > 0 &&
                ` + ${extraPhotos.length} dalších`}
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
              Chybí {MIN_QUICK_PHOTOS - requiredFilled} povinných fotek
            </p>
          )}
        </div>

        {/* Continue */}
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
          categoryLabel="Rychlé fotky"
          currentIndex={activeGuide.slotIndex}
          totalInCategory={QUICK_PHOTO_SLOTS.length}
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
            &#10005;
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
