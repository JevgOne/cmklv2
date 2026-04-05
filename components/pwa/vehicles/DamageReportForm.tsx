"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface DamageReportFormProps {
  vehicleId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const SEVERITY_OPTIONS = [
  { value: "COSMETIC", label: "Kosmetické", description: "Škrábance, drobné oděrky", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "FUNCTIONAL", label: "Funkční", description: "Ovlivňuje funkci, ale jede", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "SEVERE", label: "Vážné", description: "Bezpečnostní riziko, nejde použít", color: "bg-red-100 text-red-700 border-red-300" },
];

export function DamageReportForm({ vehicleId, onSuccess, onCancel }: DamageReportFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("COSMETIC");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhotos((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Upload photos na Cloudinary
      const imageData: string[] = [];
      for (const photo of photos) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", photo);
        uploadFormData.append("upload_preset", "damages");
        uploadFormData.append("subfolder", vehicleId);

        try {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            imageData.push(url);
          }
        } catch (err) {
          console.error("Failed to upload damage photo:", err);
        }
      }

      const res = await fetch(`/api/vehicles/${vehicleId}/damage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          severity,
          images: imageData.length > 0 ? imageData : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Nepodařilo se odeslat hlášení");
      }

      router.refresh();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se odeslat");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      <Textarea
        label="Popis poškození"
        placeholder="Popište co je poškozeno..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      {/* Severity */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
          Závažnost
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverity(opt.value)}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                severity === opt.value
                  ? opt.color + " border-current"
                  : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"
              }`}
            >
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-[10px] mt-0.5 opacity-75">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
          Fotky
        </label>
        <div className="flex flex-wrap gap-2">
          {previews.map((preview, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              >
                x
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
              <path d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8z" />
              <path d="M12.5 11a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="text-[10px] mt-1">Přidat</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      <div className="flex gap-3 mt-2">
        <Button variant="ghost" type="button" onClick={onCancel} className="flex-1">
          Zrušit
        </Button>
        <Button variant="danger" type="submit" disabled={submitting || !description.trim()} className="flex-1">
          {submitting ? "Odesílám..." : "Odeslat hlášení"}
        </Button>
      </div>
    </form>
  );
}
