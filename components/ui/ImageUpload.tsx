"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * ImageUpload — shared file picker + preview + delete widget.
 * POST na /api/upload s upload_preset (napr. "avatar" / "cover")
 * a volitelnym subfolder (userId) → vrati Cloudinary/self-hosted URL.
 */
export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  preset: "avatar" | "cover";
  /** Optional subfolder pridany pod preset folder (typicky userId). */
  subfolder?: string;
  /** Kruhovy (avatar) vs obdelnik (cover). */
  shape?: "circle" | "rect";
  /** CSS aspect-ratio — napr. "1/1" pro avatar, "16/5" pro cover. */
  aspectRatio?: string;
  /** Visible label nad widgetem. */
  label?: string;
  /** Help text pod widgetem. */
  hint?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  preset,
  subfolder,
  shape = "rect",
  aspectRatio,
  label,
  hint,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      if (subfolder) fd.append("subfolder", subfolder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Chyba při uploadu");
      }
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při uploadu");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openPicker = () => inputRef.current?.click();
  const clear = () => onChange(null);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <div
        className={cn(
          "relative bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 transition-colors hover:border-orange-300",
          shape === "circle" ? "rounded-full" : "rounded-lg",
          !value && "cursor-pointer",
        )}
        style={{ aspectRatio: aspectRatio ?? (shape === "circle" ? "1 / 1" : "16 / 5") }}
        onClick={() => {
          if (!value && !uploading) openPicker();
        }}
      >
        {value ? (
          <Image
            src={value}
            alt={label || "Nahled"}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-3xl mb-1" aria-hidden>+</span>
            <span className="text-xs font-medium text-gray-600">
              {uploading ? "Nahrávám…" : "Vybrat obrázek"}
            </span>
            <span className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP (max 10 MB)</span>
          </div>
        )}

        {value && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
              disabled={uploading}
              className="px-3 py-1.5 rounded-md bg-white/95 text-gray-900 text-xs font-semibold hover:bg-white cursor-pointer border-none"
            >
              {uploading ? "Nahrávám…" : "Změnit"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clear();
              }}
              disabled={uploading}
              className="px-3 py-1.5 rounded-md bg-red-500/95 text-white text-xs font-semibold hover:bg-red-600 cursor-pointer border-none"
            >
              Smazat
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}
