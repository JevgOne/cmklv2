"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";

export function PhotoStep({
  photos,
  onPhotosChange,
  onNext,
}: {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const remainingSlots = 10 - photos.length;
      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          setError("Lze nahrát pouze obrázky");
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "parts");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Nahrávání selhalo, zkuste to znovu");
          continue;
        }

        const { url } = await res.json();
        if (typeof url === "string") {
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length > 0) {
        onPhotosChange([...photos, ...uploadedUrls]);
      }
    } catch {
      setError("Nahrávání selhalo, zkontrolujte připojení");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Fotky dílu</h2>
        <p className="text-sm text-gray-500 mt-1">
          Nahrajte min. 1 fotku, doporučujeme 3-5 fotek
        </p>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img
              src={photo}
              alt={`Fotka ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white text-xs cursor-pointer border-none"
            >
              ✕
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                Hlavní
              </span>
            )}
          </div>
        ))}

        {/* Add photo button */}
        {photos.length < 10 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg className="w-8 h-8 text-green-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-xs text-gray-500 font-medium">Nahrávám…</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-400">
                  <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                  <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3H4.5a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.152-.177a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-500 font-medium">
                  {photos.length === 0 ? "Přidat fotku" : "Další"}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <p className="text-xs text-gray-400">
        Tip: Vyfotografujte díl ze všech stran. Na focení můžete použít fotoaparát telefonu.
      </p>

      {/* Navigation */}
      <div className="pt-4">
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-gradient-to-br from-green-500 to-green-600"
          onClick={onNext}
          disabled={photos.length === 0 || uploading}
        >
          {uploading ? "Nahrávám fotky…" : "Pokračovat k údajům"}
        </Button>
      </div>
    </div>
  );
}
