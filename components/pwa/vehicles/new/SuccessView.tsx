"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmailButton } from "@/components/pwa/emails/EmailButton";

interface SuccessViewProps {
  offline?: boolean;
}

export function SuccessView({ offline = false }: SuccessViewProps) {
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
          Zpět na Dashboard
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/makler/vehicles/new")}
        >
          Nabrat další auto
        </Button>
      </div>
    </div>
  );
}
