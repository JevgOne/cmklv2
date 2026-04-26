"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface DonorPhotosStepProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const REQUIRED_SLOTS = [
  { label: "Předek", icon: "arrow-up" },
  { label: "Zadek", icon: "arrow-down" },
  { label: "Levý bok", icon: "arrow-left" },
  { label: "Pravý bok", icon: "arrow-right" },
] as const;

export function DonorPhotosStep({
  photos,
  onPhotosChange,
  onNext,
  onBack,
}: DonorPhotosStepProps) {
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<number | null>(null);

  const handleUpload = async (file: File, index: number) => {
    setUploading(index);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newPhotos = [...photos];
        newPhotos[index] = data.url;
        onPhotosChange(newPhotos);
      }
    } catch {
      // silently fail
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget !== null) {
      handleUpload(file, uploadTarget);
    }
    e.target.value = "";
  };

  const triggerUpload = (index: number) => {
    setUploadTarget(index);
    fileInputRef.current?.click();
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos[index] = "";
    onPhotosChange(newPhotos);
  };

  const addExtraPhoto = () => {
    onPhotosChange([...photos, ""]);
    setTimeout(() => triggerUpload(photos.length), 100);
  };

  const requiredFilled = REQUIRED_SLOTS.every(
    (_, i) => photos[i] && photos[i].length > 0
  );

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Fotky donor auta</h2>
        <span className="text-sm text-gray-500">Krok 5 / 8</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Required photos */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3">
          Povinné fotky (celkový stav)
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {REQUIRED_SLOTS.map((slot, i) => (
            <div key={i} className="relative">
              {photos[i] ? (
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={photos[i]}
                    alt={slot.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs"
                  >
                    X
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-xs text-center py-1">
                    {slot.label}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => triggerUpload(i)}
                  disabled={uploading === i}
                  className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-400 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  {uploading === i ? (
                    <span className="text-xs">Nahrávám...</span>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
                        />
                      </svg>
                      <span className="text-xs font-medium">{slot.label}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Extra damage photos */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">
          Fotky poškození (volitelné)
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {photos.slice(4).map((photo, i) => {
            const idx = i + 4;
            return photo ? (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <Image
                  src={photo}
                  alt={`Poškození ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-[10px]"
                >
                  X
                </button>
              </div>
            ) : null;
          })}
          <button
            onClick={addExtraPhoto}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-400 flex items-center justify-center text-gray-400 hover:text-orange-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Fotky jednotlivých dílů můžete přidat v dalším kroku při nastavení cen.
      </p>

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
          disabled={!requiredFilled}
          onClick={onNext}
        >
          Pokračovat
        </Button>
      </div>
    </div>
  );
}
