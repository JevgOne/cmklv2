"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function QuickSuccessPage() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId");

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6">
      <Card className="w-full max-w-sm p-8 text-center space-y-6">
        {/* Ikona */}
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Nadpis */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">
            Rychlý draft odeslán!
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Máte 48 hodin na doplnění zbývajících údajů — prohlídka, výbava,
            smlouva a další fotky.
          </p>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
          <span>&#9889;</span>
          Rychlý draft
        </div>

        {/* Akce */}
        <div className="space-y-3">
          {vehicleId && (
            <Link href={`/makler/vehicles/${vehicleId}/edit`}>
              <Button variant="primary" className="w-full">
                Doplnit údaje nyní
              </Button>
            </Link>
          )}

          <Link href="/makler/vehicles/quick">
            <Button variant="outline" className="w-full mt-2">
              <span className="flex items-center gap-2">
                <span>&#9889;</span>
                Nabrat další auto
              </span>
            </Button>
          </Link>

          <Link href="/makler/dashboard">
            <Button variant="ghost" className="w-full">
              Zpět na dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
