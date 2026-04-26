"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/Card";

interface DealPhotoGalleryProps {
  photos: string[];
  repairPhotos: string[];
  canUpload?: boolean;
  opportunityId: string;
}

export function DealPhotoGallery({
  photos,
  repairPhotos,
  canUpload = false,
  opportunityId,
}: DealPhotoGalleryProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"auto" | "repair">("auto");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

  const currentPhotos = activeTab === "auto" ? photos : repairPhotos;
  const mainPhoto = currentPhotos[selectedIndex] ?? null;

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      try {
        const urls: string[] = [];
        for (const file of Array.from(files)) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", "marketplace");
          formData.append("subfolder", opportunityId);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = (await res.json()) as { url: string };
            urls.push(data.url);
          }
        }

        if (urls.length > 0) {
          // Save repair photos to opportunity
          const allRepairPhotos = [...repairPhotos, ...urls];
          await fetch(`/api/marketplace/opportunities/${opportunityId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              repairPhotos: JSON.stringify(allRepairPhotos),
            }),
          });
          router.refresh();
        }
      } catch {
        // Silent fail
      } finally {
        setUploading(false);
      }
    },
    [opportunityId, repairPhotos, router]
  );

  if (photos.length === 0 && repairPhotos.length === 0) {
    return (
      <Card className="aspect-video flex items-center justify-center bg-gray-50">
        <span className="text-gray-400 text-sm">Žádné fotky</span>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Main photo */}
      <div className="relative aspect-video bg-gray-100">
        {mainPhoto ? (
          <Image
            src={mainPhoto}
            alt="Fotka vozu"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Žádné fotky v této kategorii
          </div>
        )}
      </div>

      {/* Tabs */}
      {repairPhotos.length > 0 && (
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => {
              setActiveTab("auto");
              setSelectedIndex(0);
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "auto"
                ? "text-orange-600 border-b-2 border-orange-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Auto ({photos.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("repair");
              setSelectedIndex(0);
            }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "repair"
                ? "text-orange-600 border-b-2 border-orange-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Oprava ({repairPhotos.length})
          </button>
        </div>
      )}

      {/* Thumbnails */}
      {currentPhotos.length > 1 && (
        <div className="flex gap-1 p-2 overflow-x-auto">
          {currentPhotos.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
                i === selectedIndex
                  ? "border-orange-500"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Upload button (dealer repair photos) */}
      {canUpload && (
        <div className="p-3 border-t border-gray-100">
          <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer">
            {uploading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Nahrávám...
              </>
            ) : (
              <>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                Přidat fotky z opravy
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </Card>
  );
}
