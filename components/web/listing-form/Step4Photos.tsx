"use client";

import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import type { ListingFormData, PhotoFile } from "./ListingFormWizard";

interface Step4Props {
  data: ListingFormData;
  updateData: (updates: Partial<ListingFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const maxSize = 1920;
      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export function Step4Photos({ data, updateData, onNext, onPrev }: Step4Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const addPhotos = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0) return;

      const newPhotos: PhotoFile[] = [];

      for (const file of fileArray) {
        const compressed = await compressImage(file);
        const preview = URL.createObjectURL(compressed);
        const order = data.photos.length + newPhotos.length;

        newPhotos.push({
          id: generateId(),
          file: compressed,
          preview,
          isPrimary: data.photos.length === 0 && newPhotos.length === 0,
          order,
        });
      }

      updateData({ photos: [...data.photos, ...newPhotos] });
    },
    [data.photos, updateData]
  );

  const removePhoto = (id: string) => {
    const filtered = data.photos.filter((p) => p.id !== id);
    // If we removed the primary photo, make the first remaining photo primary
    if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    // Reorder
    const reordered = filtered.map((p, i) => ({ ...p, order: i }));
    updateData({ photos: reordered });
  };

  const setPrimary = (id: string) => {
    const updated = data.photos.map((p) => ({
      ...p,
      isPrimary: p.id === id,
    }));
    updateData({ photos: updated });
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= data.photos.length) return;
    const photos = [...data.photos];
    const [moved] = photos.splice(fromIndex, 1);
    photos.splice(toIndex, 0, moved);
    const reordered = photos.map((p, i) => ({ ...p, order: i }));
    updateData({ photos: reordered });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      if (e.dataTransfer.files.length > 0) {
        addPhotos(e.dataTransfer.files);
      }
    },
    [addPhotos]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const minPhotos = 3;
  const hasEnoughPhotos = data.photos.length >= minPhotos;

  return (
    <Card className="p-6 md:p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Fotografie</h2>
      <p className="text-sm text-gray-500 mb-6">
        Nahrajte minimálně {minPhotos} fotky, doporučujeme 10 a více. Fotky budou automaticky komprimovány.
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={() => dragCounter.current++}
        onDragLeave={() => dragCounter.current--}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-[32px] mx-auto">
          &#128247;
        </div>
        <p className="text-gray-700 font-semibold mt-4">Přetáhněte fotky sem</p>
        <p className="text-sm text-gray-500 mt-2">nebo klikněte pro výběr z galerie</p>
        <p className="text-xs text-gray-500 mt-1">JPG, PNG, max 10 MB na fotku</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addPhotos(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Photo grid */}
      {data.photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-6">
          {data.photos.map((photo, index) => (
            <div
              key={photo.id}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border-2 group",
                photo.isPrimary ? "border-orange-500" : "border-gray-200"
              )}
            >
              <img
                src={photo.preview}
                alt={`Fotka ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary badge */}
              {photo.isPrimary && (
                <span className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Hlavní
                </span>
              )}

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {!photo.isPrimary && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimary(photo.id);
                    }}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs cursor-pointer border-none hover:bg-orange-50"
                    title="Nastavit jako hlavní"
                  >
                    &#9733;
                  </button>
                )}
                {index > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      movePhoto(index, index - 1);
                    }}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs cursor-pointer border-none hover:bg-gray-50"
                    title="Posunout doleva"
                  >
                    &#8592;
                  </button>
                )}
                {index < data.photos.length - 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      movePhoto(index, index + 1);
                    }}
                    className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs cursor-pointer border-none hover:bg-gray-50"
                    title="Posunout doprava"
                  >
                    &#8594;
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(photo.id);
                  }}
                  className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-xs cursor-pointer border-none hover:bg-red-50 text-red-500"
                  title="Smazat"
                >
                  &#10005;
                </button>
              </div>
            </div>
          ))}

          {/* Add more button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors"
          >
            <span className="text-2xl text-gray-300">+</span>
          </div>
        </div>
      )}

      {/* Photo count info */}
      <div className="mt-4 flex items-center gap-2">
        <span className={cn("text-sm font-medium", hasEnoughPhotos ? "text-success-500" : "text-warning-500")}>
          {data.photos.length} / {minPhotos} min. fotek
        </span>
        {data.photos.length > 0 && data.photos.length < 10 && (
          <span className="text-xs text-gray-500">
            (doporučujeme alespoň 10)
          </span>
        )}
      </div>

      {!hasEnoughPhotos && data.photos.length > 0 && (
        <Alert variant="warning" className="mt-3">
          Nahrajte prosím alespoň {minPhotos} fotky pro publikaci inzerátu.
        </Alert>
      )}

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
