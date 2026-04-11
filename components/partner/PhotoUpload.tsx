"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
  preset: string;
}

export function PhotoUpload({ photos, onChange, max = 10, preset }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    const newPhotos = [...photos];

    for (const file of Array.from(files)) {
      if (newPhotos.length >= max) break;
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", preset);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const { url } = await res.json();
          newPhotos.push(url);
        }
      } catch {
        // skip failed uploads
      }
    }

    onChange(newPhotos);
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Fotografie ({photos.length}/{max})
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" sizes="120px" />
            {i === 0 && (
              <span className="absolute top-1 left-1 text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded">
                Hlavní
              </span>
            )}
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs cursor-pointer border-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {photos.length < max && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50"
        >
          {uploading ? "Nahrávám..." : "Přidat fotky"}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleUpload(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
