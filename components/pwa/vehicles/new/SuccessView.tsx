"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmailButton } from "@/components/pwa/emails/EmailButton";

interface SuccessViewProps {
  offline?: boolean;
  vehicleId?: string | null;
}

export function SuccessView({ offline = false, vehicleId }: SuccessViewProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
      {/* Ikona */}
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-10 h-10 text-green-500"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Titulek */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {offline ? "Uloženo k odeslání!" : "Odesláno ke schválení!"}
      </h1>

      {/* Popis */}
      <p className="text-gray-500 mb-8 max-w-xs">
        {offline
          ? "Vozidlo bude automaticky odesláno ke schválení, až budete online. BackOffice ho pak zkontroluje a schválí."
          : "BackOffice zkontroluje zadané údaje a fotky. O výsledku budete informováni notifikací."}
      </p>

      {/* CTA: Podepsat exkluzivni smlouvu */}
      {!offline && vehicleId && (
        <div className="w-full max-w-xs mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-600">
                  <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
                  <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-gray-900">
                  Exkluzivní smlouva
                </h3>
                <p className="text-xs text-gray-500">
                  Zajistěte si exkluzivitu na toto vozidlo
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={() =>
                router.push(`/makler/contracts?vehicleId=${vehicleId}`)
              }
            >
              Podepsat smlouvu
            </Button>
          </div>
        </div>
      )}

      {/* Tlačítka */}
      <div className="w-full max-w-xs space-y-3">
        {!offline && (
          <EmailButton
            defaultTemplate="PRESENTATION"
            label="Poslat prezentaci"
            variant="primary"
            size="lg"
            className="w-full"
          />
        )}
        <Button
          variant={offline ? "primary" : "outline"}
          className="w-full"
          size="lg"
          onClick={() => router.push("/makler/dashboard")}
        >
          Zpet na Dashboard
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/makler/vehicles/new")}
        >
          Nabrat dalsi auto
        </Button>
      </div>
    </div>
  );
}
