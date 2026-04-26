"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";
import { StepComplete } from "./StepComplete";

interface DocumentFile {
  file: File;
  preview: string;
}

interface DocumentSlot {
  key: string;
  label: string;
  description: string;
  accept: string;
}

const DOCUMENT_SLOTS: DocumentSlot[] = [
  { key: "trade_license", label: "Živnostenský list", description: "Nahrajte fotku živnostenského listu", accept: "image/jpeg,image/png,image/webp" },
  { key: "id_front", label: "Občanský průkaz — přední strana", description: "Foto přední strany OP", accept: "image/jpeg,image/png" },
  { key: "id_back", label: "Občanský průkaz — zadní strana", description: "Foto zadní strany OP", accept: "image/jpeg,image/png" },
];

export function DocumentUpload() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Record<string, DocumentFile>>({});
  const [error, setError] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = useCallback((key: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setDocuments((prev) => ({
        ...prev,
        [key]: { file, preview: e.target?.result as string },
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (key: string, e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(key, file);
    },
    [handleFile]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all documents uploaded
    const missing = DOCUMENT_SLOTS.filter((slot) => !documents[slot.key]);
    if (missing.length > 0) {
      setError(`Nahrajte všechny dokumenty: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(documents).forEach(([key, doc]) => {
        formData.append(key, doc.file);
      });

      const res = await fetch("/api/onboarding/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nahrání dokumentů se nezdařilo.");
        setLoading(false);
        return;
      }

      setShowCelebration(true);
    } catch {
      setError("Došlo k neočekávané chybě. Zkuste to znovu.");
      setLoading(false);
    }
  };

  const handleContinue = useCallback(() => {
    router.push("/makler/onboarding/training");
  }, [router]);

  return (
    <>
    {showCelebration && (
      <StepComplete step={2} emoji="📄" title="Dokumenty nahrány!" subtitle="Ověření identity = důvěra klientů." onContinue={handleContinue} />
    )}
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {DOCUMENT_SLOTS.map((slot) => {
        const doc = documents[slot.key];
        const isPdf = doc?.file.type === "application/pdf";

        return (
          <div key={slot.key}>
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
              {slot.label}
            </label>

            {doc ? (
              <div className="relative rounded-lg border-2 border-success-300 bg-success-50 p-4">
                <div className="flex items-center gap-3">
                  {isPdf ? (
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl border border-gray-200">
                      PDF
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.preview}
                      alt={slot.label}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.file.name}</p>
                    <p className="text-xs text-gray-500">{(doc.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDocuments((prev) => { const n = { ...prev }; delete n[slot.key]; return n; })}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-error-500 hover:border-error-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
                  dragOver === slot.key
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"
                )}
                onClick={() => fileInputRefs.current[slot.key]?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(slot.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(slot.key, e)}
              >
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-medium text-gray-700">Přetáhněte soubor sem</p>
                <p className="text-xs text-gray-400 mt-1">{slot.description}</p>
              </div>
            )}

            <input
              ref={(el) => { fileInputRefs.current[slot.key] = el; }}
              type="file"
              accept={slot.accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(slot.key, file);
              }}
            />
          </div>
        );
      })}

      <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
        {loading ? "Nahrávání..." : "Pokračovat"}
      </Button>
    </form>
    </>
  );
}
