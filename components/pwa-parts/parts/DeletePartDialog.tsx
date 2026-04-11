"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface DeletePartDialogProps {
  partId: string;
  partName: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeletePartDialog({ partId, partName, isOpen, onClose, onDeleted }: DeletePartDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/parts/${partId}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Smazání se nezdařilo");
      }
    } catch {
      setError("Chyba připojení, zkuste to znovu");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500">
              <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Smazat díl?</h3>
          <p className="text-sm text-gray-500 mb-1">
            Opravdu chcete smazat <strong>&quot;{partName}&quot;</strong>?
          </p>
          <p className="text-xs text-gray-400 mb-5">
            Díl bude deaktivován a nebude viditelný v katalogu.
          </p>

          {error && (
            <p className="text-sm text-red-500 mb-3">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={onClose}
              disabled={deleting}
            >
              Zrušit
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Mažu..." : "Smazat"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
