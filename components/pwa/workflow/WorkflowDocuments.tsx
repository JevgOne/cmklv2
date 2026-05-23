"use client";

import type { WorkflowDocument } from "@/types/workflow";

interface WorkflowDocumentsProps {
  documents: WorkflowDocument[];
}

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

export function WorkflowDocuments({ documents }: WorkflowDocumentsProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Žádné dokumenty
      </div>
    );
  }

  return (
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
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>{formatFileSize(doc.size)}</span>
              {doc.category && (
                <>
                  <span>·</span>
                  <span>{doc.category}</span>
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
  );
}
