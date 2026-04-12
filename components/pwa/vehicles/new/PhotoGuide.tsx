"use client";

import { useState, useEffect, useCallback } from "react";
import { useCamera } from "@/lib/hooks/useCamera";
import { resizeImage, createThumbnail } from "@/lib/image-utils";
import { Button } from "@/components/ui";

interface PhotoGuideProps {
  slotName: string;
  tip: string;
  categoryLabel: string;
  currentIndex: number;
  totalInCategory: number;
  positionNumber?: number;
  onCapture: (full: Blob, thumb: Blob) => void;
  onClose: () => void;
}

export function PhotoGuide({
  slotName,
  tip,
  categoryLabel,
  currentIndex,
  totalInCategory,
  positionNumber,
  onCapture,
  onClose,
}: PhotoGuideProps) {
  const { videoRef, isActive, error, startCamera, stopCamera, captureFrame } =
    useCamera();
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false);
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = useCallback(() => {
    const blob = captureFrame();
    if (!blob) return;
    setCapturedBlob(blob);
    setPreview(URL.createObjectURL(blob));
    stopCamera();
  }, [captureFrame, stopCamera]);

  const handleRetake = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCapturedBlob(null);
    startCamera();
  }, [preview, startCamera]);

  const handleUse = useCallback(async () => {
    if (!capturedBlob) return;
    setProcessing(true);
    try {
      const [full, thumb] = await Promise.all([
        resizeImage(capturedBlob),
        createThumbnail(capturedBlob),
      ]);
      onCapture(full, thumb);
    } finally {
      setProcessing(false);
      if (preview) URL.revokeObjectURL(preview);
    }
  }, [capturedBlob, onCapture, preview]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setProcessing(true);
      try {
        const [full, thumb] = await Promise.all([
          resizeImage(file),
          createThumbnail(file),
        ]);
        onCapture(full, thumb);
      } finally {
        setProcessing(false);
      }
    },
    [onCapture]
  );

  // File input fallback
  if (!cameraSupported || error) {
    return (
      <div className="fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl"
        >
          ✕
        </button>

        <h2 className="text-white text-xl font-bold mb-2">{slotName}</h2>
        <p className="text-white/70 text-sm mb-8 text-center">
          {error || "Kamera není dostupná. Vyberte fotku z galerie."}
        </p>

        <label className="cursor-pointer">
          <div className="bg-orange-500 text-white px-8 py-4 rounded-full font-semibold text-lg">
            Vybrat z galerie
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        {processing && (
          <p className="text-white/70 mt-4">Zpracování...</p>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[300] flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-xl"
          >
            ✕
          </button>
          <span className="text-white/80 text-sm font-medium">
            Fotka {currentIndex + 1} / {totalInCategory} ({categoryLabel})
          </span>
        </div>
        <h2 className="text-white text-lg font-bold text-center mt-2">
          {positionNumber && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-sm font-bold mr-2">
              {positionNumber}
            </span>
          )}
          {slotName}
        </h2>
      </div>

      {/* Camera / Preview */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {preview ? (
          <img
            src={preview}
            alt="Náhled"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Car outline overlay */}
            <div className="absolute inset-8 border-2 border-white/30 rounded-2xl pointer-events-none" />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/70 to-transparent">
        {!preview && (
          <p className="text-white/70 text-sm text-center mb-4">{tip}</p>
        )}

        <div className="flex items-center justify-center gap-6">
          {preview ? (
            <>
              <Button
                variant="outline"
                onClick={handleRetake}
                disabled={processing}
                className="!bg-white/20 !text-white !border-white/30"
              >
                Vyfotit znovu
              </Button>
              <Button onClick={handleUse} disabled={processing}>
                {processing ? "Zpracování..." : "Použít"}
              </Button>
            </>
          ) : (
            <>
              {/* File input alternative */}
              <label className="cursor-pointer">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white text-xl">
                  🖼
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {/* Capture button */}
              <button
                onClick={handleCapture}
                disabled={!isActive}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full bg-white" />
              </button>

              <div className="w-12" /> {/* Spacer for symmetry */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
