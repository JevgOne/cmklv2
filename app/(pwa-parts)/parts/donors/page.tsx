"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface DonorVehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  vin: string;
  disposalType: string;
  totalParts: number;
  publishedParts: number;
  totalValue: number;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Koncept", color: "bg-gray-100 text-gray-700" },
  PUBLISHED: { label: "Publikováno", color: "bg-green-100 text-green-700" },
  ARCHIVED: { label: "Archivováno", color: "bg-yellow-100 text-yellow-700" },
};

const DISPOSAL_LABELS: Record<string, string> = {
  ACCIDENT: "Nehoda",
  MECHANICAL: "Mech. závada",
  COMPLETE: "Kompletní",
  FLOOD: "Zatopené",
  FIRE: "Požár",
};

export default function DonorVehiclesListPage() {
  const [donors, setDonors] = useState<DonorVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/donor-vehicles")
      .then((r) => r.json())
      .then((data) => setDonors(data.donors ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Donor auta</h1>
          <Link
            href="/parts/new"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            + Přidat
          </Link>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-16 h-16 mx-auto text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">
              Zatím žádná donor auta
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Přidejte celé auto a vygenerujte díly automaticky
            </p>
            <Link
              href="/parts/new"
              className="inline-block mt-4 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600"
            >
              Přidat donor auto
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {donors.map((donor) => {
              const st = STATUS_LABELS[donor.status] ?? STATUS_LABELS.DRAFT;
              return (
                <Link
                  key={donor.id}
                  href={`/parts/donors/${donor.id}`}
                  className="block border border-gray-200 rounded-xl p-4 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-gray-900">
                        {donor.brand} {donor.model}
                        {donor.year && ` (${donor.year})`}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        VIN: {donor.vin} ·{" "}
                        {DISPOSAL_LABELS[donor.disposalType] ??
                          donor.disposalType}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      {donor.publishedParts} dílů
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatPrice(donor.totalValue)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
