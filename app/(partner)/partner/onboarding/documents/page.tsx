"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface UploadedDoc {
  name: string;
  url: string;
}

export default function PartnerOnboardingDocumentsPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [businessDoc, setBusinessDoc] = useState<UploadedDoc | null>(null);
  const [idDoc, setIdDoc] = useState<UploadedDoc | null>(null);

  const businessRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, setter: (doc: UploadedDoc) => void) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        setter({ name: file.name, url });
      } else {
        setError("Nahrávání se nezdařilo. Zkuste to znovu.");
      }
    } catch {
      setError("Chyba připojení při nahrávání");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!businessDoc || !idDoc) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/partner-onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 2,
          data: { documents: [businessDoc.url, idDoc.url] },
        }),
      });
      if (res.ok) {
        router.push("/partner/onboarding/approval");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Uložení se nezdařilo");
      }
    } catch {
      setError("Chyba připojení, zkuste to znovu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-6 space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-500">Profil</span>
        </div>
        <div className="flex-1 h-0.5 bg-orange-500 rounded-full" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">2</div>
          <span className="text-xs font-medium text-gray-900">Dokumenty</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 rounded-full" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">3</div>
          <span className="text-xs font-medium text-gray-400">Schválení</span>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900">Dokumenty</h2>
        <p className="text-sm text-gray-500 mt-1">Nahrajte potřebné dokumenty pro ověření</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Živnostenský list / Výpis z OR *</h3>
        <p className="text-xs text-gray-500 mb-3">Doklad o oprávnění k podnikání</p>
        {businessDoc ? (
          <div className="flex items-center gap-2 bg-orange-50 rounded-lg p-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-orange-500 shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-orange-700 truncate">{businessDoc.name}</span>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => businessRef.current?.click()} disabled={uploading}>
            {uploading ? "Nahrávám..." : "Nahrát dokument"}
          </Button>
        )}
        <input ref={businessRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, setBusinessDoc); }} />
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Občanský průkaz *</h3>
        <p className="text-xs text-gray-500 mb-3">Fotografie nebo sken občanského průkazu</p>
        {idDoc ? (
          <div className="flex items-center gap-2 bg-orange-50 rounded-lg p-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-orange-500 shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-orange-700 truncate">{idDoc.name}</span>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => idRef.current?.click()} disabled={uploading}>
            {uploading ? "Nahrávám..." : "Nahrát dokument"}
          </Button>
        )}
        <input ref={idRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, setIdDoc); }} />
      </div>

      <div className="pt-4">
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-gradient-to-br from-orange-500 to-orange-600"
          onClick={handleSubmit}
          disabled={!businessDoc || !idDoc || submitting}
        >
          {submitting ? "Odesílám..." : "Pokračovat"}
        </Button>
      </div>
    </div>
  );
}
