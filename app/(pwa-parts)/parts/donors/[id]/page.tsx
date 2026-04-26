"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { ZONE_LABELS, DAMAGE_LEVEL_LABELS, DAMAGE_LEVEL_COLORS, type DamageZone, type DamageLevel } from "@/lib/damage-zones";
import { getGroupName } from "@/lib/tecdoc";

interface DonorDetail {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  vin: string;
  variant: string | null;
  engine: string | null;
  fuel: string | null;
  transmission: string | null;
  disposalType: string;
  damageZones: Record<string, string> | null;
  photos: string[] | null;
  totalParts: number;
  publishedParts: number;
  totalValue: number;
  status: string;
  parts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    partGrade: string | null;
    status: string;
    tecdocProductGroup: string | null;
    images: Array<{ url: string }>;
  }>;
}

const DISPOSAL_LABELS: Record<string, string> = {
  ACCIDENT: "Nehoda",
  MECHANICAL: "Nepojízdné (mech. závada)",
  COMPLETE: "Kompletní rozebírání",
  FLOOD: "Zatopené",
  FIRE: "Požár",
};

export default function DonorVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [donor, setDonor] = useState<DonorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/donor-vehicles/${id}`)
      .then((r) => r.json())
      .then((data) => setDonor(data.donor ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-20 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 text-center">
        <p className="text-gray-600">Donor auto nenalezeno</p>
        <Link href="/parts/donors" className="text-orange-600 text-sm mt-2 inline-block">
          Zpět na seznam
        </Link>
      </div>
    );
  }

  const photos = (donor.photos ?? []) as string[];
  const damageZones = (donor.damageZones ?? {}) as Record<string, string>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <Link
          href="/parts/donors"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Zpět
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">
          {donor.brand} {donor.model}
          {donor.year && ` (${donor.year})`}
        </h1>
        <div className="text-sm text-gray-500 mt-0.5">
          VIN: {donor.vin}
        </div>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-4">
          {photos.filter(Boolean).map((url, i) => (
            <div
              key={i}
              className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
            >
              <Image
                src={url}
                alt={`Foto ${i + 1}`}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          ))}
        </div>
      )}

      <div className="px-4 pb-8 space-y-6">
        {/* Info */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="text-sm">
            <span className="text-gray-500">Typ:</span>{" "}
            <span className="font-medium text-gray-900">
              {DISPOSAL_LABELS[donor.disposalType] ?? donor.disposalType}
            </span>
          </div>
          {donor.engine && (
            <div className="text-sm">
              <span className="text-gray-500">Motor:</span>{" "}
              <span className="text-gray-900">
                {donor.engine}
                {donor.fuel && ` · ${donor.fuel}`}
                {donor.transmission && ` · ${donor.transmission}`}
              </span>
            </div>
          )}
          {donor.variant && (
            <div className="text-sm">
              <span className="text-gray-500">Varianta:</span>{" "}
              <span className="text-gray-900">{donor.variant}</span>
            </div>
          )}
        </div>

        {/* Damage zones */}
        {Object.keys(damageZones).length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-2">
              Mapa poškození
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(damageZones).map(([zone, level]) => (
                <div
                  key={zone}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        DAMAGE_LEVEL_COLORS[level as DamageLevel] ?? "#9ca3af",
                    }}
                  />
                  <span className="text-gray-700">
                    {ZONE_LABELS[zone as DamageZone] ?? zone}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {DAMAGE_LEVEL_LABELS[level as DamageLevel] ?? level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {donor.publishedParts}
            </div>
            <div className="text-xs text-gray-600 mt-1">Publikovaných dílů</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(donor.totalValue)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Celková hodnota</div>
          </div>
        </div>

        {/* Parts list */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">
            Díly ({donor.parts.length})
          </h2>
          <div className="space-y-2">
            {donor.parts.map((part) => (
              <div
                key={part.id}
                className="flex items-center gap-3 border border-gray-200 rounded-lg p-3"
              >
                {part.images[0] ? (
                  <div className="relative w-12 h-12 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                    <Image
                      src={part.images[0].url}
                      alt={part.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-300">
                      <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909-2.47-2.47a.75.75 0 0 0-1.06 0L2.5 11.06Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {part.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {part.tecdocProductGroup
                      ? getGroupName(part.tecdocProductGroup)
                      : part.category}
                    {part.partGrade && (
                      <span className="ml-1 font-bold">
                        · Stav {part.partGrade}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900 flex-shrink-0">
                  {part.price > 0 ? formatPrice(part.price) : "Dohodou"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
