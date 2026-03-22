"use client";

import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { offlineStorage } from "@/lib/offline/storage";
import type { DefectRecord, DefectSeverity } from "@/types/vehicle-draft";

interface DefectCaptureProps {
  draftId: string;
  defects: DefectRecord[];
  onChange: (defects: DefectRecord[]) => void;
}

const SEVERITY_OPTIONS: { value: DefectSeverity; label: string }[] = [
  { value: "MINOR", label: "Drobna" },
  { value: "MODERATE", label: "Stredni" },
  { value: "MAJOR", label: "Vazna" },
  { value: "CRITICAL", label: "Kriticka" },
];

const SEVERITY_COLORS: Record<DefectSeverity, string> = {
  MINOR: "bg-yellow-100 text-yellow-700",
  MODERATE: "bg-orange-100 text-orange-700",
  MAJOR: "bg-red-100 text-red-700",
  CRITICAL: "bg-red-200 text-red-800",
};

export function DefectCapture({ draftId, defects, onChange }: DefectCaptureProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<DefectSeverity>("MINOR");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapturedImage(file);
    setModalOpen(true);
    // Reset input
    e.target.value = "";
  };

  const handleSaveDefect = async () => {
    const id = `defect_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let imageId: string | undefined;

    if (capturedImage) {
      imageId = `img_${id}`;
      await offlineStorage.saveImage(imageId, draftId, capturedImage);
    }

    const newDefect: DefectRecord = {
      id,
      imageId,
      description,
      severity,
    };

    onChange([...defects, newDefect]);
    resetModal();
  };

  const handleDeleteDefect = async (defect: DefectRecord) => {
    if (defect.imageId) {
      // Obrazky se smazou pri deleteDraft, pro jednotlive nepotrebujeme
    }
    onChange(defects.filter((d) => d.id !== defect.id));
  };

  const resetModal = () => {
    setModalOpen(false);
    setCapturedImage(null);
    setDescription("");
    setSeverity("MINOR");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Zjistene zavady ({defects.length})
        </h4>
        <Button variant="outline" size="sm" onClick={handleCapture}>
          + Pridat zavadu
        </Button>
      </div>

      {/* Skrytý file input pro kameru */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Seznam závad */}
      {defects.length > 0 && (
        <div className="space-y-2">
          {defects.map((defect) => (
            <div
              key={defect.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {defect.imageId && (
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 text-gray-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${SEVERITY_COLORS[defect.severity]}`}
                  >
                    {SEVERITY_OPTIONS.find((s) => s.value === defect.severity)?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate">
                  {defect.description || "Bez popisu"}
                </p>
              </div>
              <button
                onClick={() => handleDeleteDefect(defect)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                aria-label="Smazat zavadu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal pro popis závady */}
      <Modal
        open={modalOpen}
        onClose={resetModal}
        title="Popis zavady"
        footer={
          <>
            <Button variant="outline" onClick={resetModal}>
              Zrusit
            </Button>
            <Button variant="primary" onClick={handleSaveDefect}>
              Ulozit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {capturedImage && (
            <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(capturedImage)}
                alt="Fotka zavady"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <Input
            label="Popis zavady"
            placeholder="Napr.: Promackly levy blatnik"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoFocus
          />

          <Select
            label="Zavaznost"
            options={SEVERITY_OPTIONS}
            value={severity}
            onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
          />
        </div>
      </Modal>
    </div>
  );
}
