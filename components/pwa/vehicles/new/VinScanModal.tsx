"use client";

import { useState, useCallback, useEffect } from "react";
import { useCamera } from "@/lib/hooks/useCamera";
import { Button } from "@/components/ui/Button";

interface VinScanModalProps {
  open: boolean;
  onClose: () => void;
  onVinScanned: (vin: string) => void;
}

export function VinScanModal({ open, onClose, onVinScanned }: VinScanModalProps) {
  const { videoRef, isActive, error: cameraError, startCamera, stopCamera, captureFrame } = useCamera();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Start/stop camera when modal opens/closes
  useEffect(() => {
    if (open) {
      startCamera();
      setAttempts(0);
      setScanError(null);
    } else {
      stopCamera();
    }
  }, [open, startCamera, stopCamera]);

  const handleCapture = useCallback(async () => {
    const frame = captureFrame();
    if (!frame) return;

    setScanning(true);
    setScanError(null);

    const formData = new FormData();
    formData.append("image", frame, "vin-scan.jpg");

    try {
      const res = await fetch("/api/vin/scan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.found) {
        onVinScanned(data.vin);
        stopCamera();
        onClose();
      } else {
        setAttempts((prev) => prev + 1);
        setScanError(data.message || "VIN nebyl rozpoznán");
      }
    } catch {
      setScanError("Chyba při skenování. Zkuste to znovu.");
    } finally {
      setScanning(false);
    }
  }, [captureFrame, onVinScanned, stopCamera, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <span className="text-white font-semibold text-sm">Skenovat VIN</span>
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-white bg-white/10 rounded-full border-none cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="text-center px-6">
            <div className="text-4xl mb-4">📷</div>
            <p className="text-white font-medium mb-2">Kamera není dostupná</p>
            <p className="text-gray-400 text-sm mb-4">{cameraError}</p>
            <Button variant="outline" onClick={handleClose}>
              Zadat VIN ručně
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Dark overlay with transparent center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[85%] max-w-[400px]">
                  {/* Viewfinder rectangle */}
                  <div className="h-16 border-2 border-white/80 rounded-lg relative">
                    {/* Corner marks */}
                    <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-3 border-l-3 border-orange-500 rounded-tl" />
                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-3 border-r-3 border-orange-500 rounded-tr" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-3 border-l-3 border-orange-500 rounded-bl" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-3 border-r-3 border-orange-500 rounded-br" />

                    {/* Scanning line animation */}
                    {scanning && (
                      <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
                        <div className="w-full h-0.5 bg-orange-500 animate-[scan_1.5s_ease-in-out_infinite]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black/80 px-4 py-5 space-y-3">
        {/* Tip */}
        <p className="text-center text-gray-400 text-xs">
          {attempts >= 3
            ? "VIN se nedaří rozpoznat. Zkuste zadat ručně."
            : "Zamiřte na VIN kód na dveřním sloupku nebo palubní desce"}
        </p>

        {/* Error */}
        {scanError && (
          <div className="bg-red-500/20 text-red-300 text-sm px-4 py-2 rounded-lg text-center">
            {scanError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {attempts >= 3 ? (
            <Button
              variant="primary"
              onClick={handleClose}
              className="flex-1"
              size="lg"
            >
              Zadat VIN ručně
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCapture}
              disabled={!isActive || scanning}
              className="flex-1"
              size="lg"
            >
              {scanning ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Rozpoznávám...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  Vyfotit
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
