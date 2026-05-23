"use client";

import { useState, useRef, useCallback } from "react";
import type { WorkflowDocument } from "@/types/workflow";

interface WorkflowDocumentsProps {
  documents: WorkflowDocument[];
  requestId?: string;
  canUpload?: boolean;
  onDocumentAdded?: (doc: WorkflowDocument) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  PHOTO: "Screenshot / Fotka",
  CONTRACT: "Smlouva",
  ID_CARD: "Doklad",
  INSURANCE: "Pojištění",
  INCOME_PROOF: "Doklad příjmu",
  OTHER: "Ostatní",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📄";
  if (type.includes("spreadsheet") || type.includes("excel")) return "📊";
  if (type.includes("word") || type.includes("document")) return "📝";
  return "📎";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WorkflowDocuments({ documents, requestId, canUpload = false, onDocumentAdded }: WorkflowDocumentsProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("PHOTO");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (!requestId) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Maximální velikost souboru je 10 MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "contracts");
      formData.append("subfolder", requestId);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || "Chyba při nahrávání souboru");
      }

      const { url } = await uploadRes.json();

      // Step 2: Create document record
      const docRes = await fetch(`/api/workflow/${requestId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          fileName: file.name,
          url,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          category,
        }),
      });

      if (!docRes.ok) {
        const err = await docRes.json().catch(() => ({}));
        throw new Error(err.error || "Chyba při ukládání dokumentu");
      }

      const result = await docRes.json();
      onDocumentAdded?.({
        id: result.document.id,
        name: result.document.name,
        url: result.document.url,
        type: result.document.mimeType,
        category: result.document.category,
        size: result.document.size,
        uploadedBy: result.document.uploadedBy,
        createdAt: result.document.createdAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při nahrávání");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [requestId, category, onDocumentAdded]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      {canUpload && requestId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all
              ${dragOver
                ? "border-orange-400 bg-orange-50"
                : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
              }
              ${uploading ? "opacity-50 pointer-events-none" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Nahrávám...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-gray-400">
                  <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
                <span className="text-sm text-gray-500">
                  Přetáhněte soubor nebo <span className="text-orange-500 font-medium">klikněte</span>
                </span>
                <span className="text-xs text-gray-400">Fotky, PDF, Word, Excel — max 10 MB</span>
              </>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Document list */}
      {documents.length === 0 && !canUpload ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          Žádné dokumenty
        </div>
      ) : documents.length === 0 && canUpload ? (
        <div className="text-center py-4 text-gray-400 text-sm">
          Zatím žádné dokumenty — nahrajte první
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:border-orange-200 hover:bg-orange-50/30 transition-all no-underline group"
            >
              <span className="text-xl flex-shrink-0">{getFileIcon(doc.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {doc.name}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                  <span>{formatFileSize(doc.size)}</span>
                  {doc.category && (
                    <>
                      <span>·</span>
                      <span>{CATEGORY_LABELS[doc.category] || doc.category}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatDate(doc.createdAt)}</span>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors flex-shrink-0"
              >
                <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
