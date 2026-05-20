"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScoutLeadStatusBadge } from "./ScoutLeadStatusBadge";
import { ScoutLeadActivityLog } from "./ScoutLeadActivityLog";
import { ScoutLeadConvertModal } from "./ScoutLeadConvertModal";
import { LeadDataCompleteness } from "./LeadDataCompleteness";
import { LeadPriceChart } from "./LeadPriceChart";
import { LeadPriceVerdict } from "./LeadPriceVerdict";
import { LeadEquipmentTags } from "./LeadEquipmentTags";
import { LeadSimilarTable } from "./LeadSimilarTable";

interface ScoutLeadData {
  id: string;
  category: string;
  country: string;
  source: string;
  sourceId: string | null;
  sourceUrl: string | null;
  scrapedAt: string;
  name: string;
  phone: string | null;
  email: string | null;
  web: string | null;
  contactPerson: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  ico: string | null;
  estimatedSize: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehiclePrice: number | null;
  vehicleMileage: number | null;
  listingTitle: string | null;
  vehicleFuel: string | null;
  vehicleTransmission: string | null;
  vehiclePower: number | null;
  vehicleEngineCC: number | null;
  vehicleBodyType: string | null;
  vehicleColor: string | null;
  vehicleDoors: number | null;
  vehicleEquipment: string | null;
  vehicleDescription: string | null;
  vehiclePhotos: string | null;
  rawPayload: Record<string, unknown> | null;
  score: number;
  status: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  } | null;
  linkedRegion: { id: string; name: string } | null;
  rejectionReason: string | null;
  notes: string | null;
  convertedToPartnerId: string | null;
  convertedToLeadId: string | null;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    oldStatus: string | null;
    newStatus: string | null;
    user: { firstName: string; lastName: string };
    createdAt: string;
  }>;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  VRAKOVISTE: "Vrakoviště",
  AUTOBAZAR: "Autobazar",
  SOUKROMNIK: "Soukromník",
};

const sourceLabels: Record<string, string> = {
  GOOGLE_PLACES: "Google Places",
  ARES: "ARES",
  FIRMY_CZ: "Firmy.cz",
  ZLATESTRANKY: "Zlaté stránky",
  BAZOS: "Bazoš",
  SBAZAR: "Sbazar",
  SAUTO: "Sauto",
  TIPCARS: "TipCars",
  MOBILE_DE: "Mobile.de",
  AUTOSCOUT24: "AutoScout24",
  MANUAL: "Manuální",
  HANDELSREGISTER: "Handelsregister",
};

const sizeLabels: Record<string, string> = {
  SMALL: "Malý",
  MEDIUM: "Střední",
  LARGE: "Velký",
};

const fuelLabels: Record<string, string> = {
  PETROL: "Benzín",
  DIESEL: "Diesel",
  HYBRID: "Hybrid",
  PLUGIN_HYBRID: "Plug-in Hybrid",
  ELECTRIC: "Elektro",
  LPG: "LPG",
  CNG: "CNG",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuální",
  AUTOMATIC: "Automatická",
};

const bodyTypeLabels: Record<string, string> = {
  SEDAN: "Sedan",
  HATCHBACK: "Hatchback",
  COMBI: "Kombi",
  SUV: "SUV",
  COUPE: "Coupé",
  CABRIO: "Kabriolet",
  VAN: "Van",
  PICKUP: "Pickup",
};

function VehicleDescriptionCard({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 500;
  const display = isLong && !expanded ? description.slice(0, 500) + "..." : description;

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        Popis prodejce
      </h3>
      <p className="text-sm text-gray-700 whitespace-pre-line">{display}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-orange-600 hover:underline"
        >
          {expanded ? "Zobrazit méně" : "Zobrazit celý popis"}
        </button>
      )}
    </Card>
  );
}

function VehiclePhotosCard({ photosJson }: { photosJson: string }) {
  const [showAll, setShowAll] = useState(false);
  let photos: string[] = [];
  try {
    photos = JSON.parse(photosJson);
  } catch {
    return null;
  }
  if (photos.length === 0) return null;

  const visible = showAll ? photos : photos.slice(0, 4);
  const remaining = photos.length - 4;

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        Fotky ({photos.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {visible.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={url}
              alt={`Foto ${i + 1}`}
              className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition"
              loading="lazy"
            />
          </a>
        ))}
      </div>
      {!showAll && remaining > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs text-orange-600 hover:underline"
        >
          +{remaining} dalších fotek
        </button>
      )}
    </Card>
  );
}

export function ScoutLeadDetail({ id }: { id: string }) {
  const router = useRouter();
  const [lead, setLead] = useState<ScoutLeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Market analysis (SOUKROMNIK only)
  const [marketData, setMarketData] = useState<{
    priceDistribution: {
      buckets: Array<{ min: number; max: number; count: number; isCurrent: boolean }>;
      stats: { median: number; mean: number; min: number; max: number; count: number; percentile: number };
      sources: { autoscout24: number; sauto: number; mobile_de: number };
    } | null;
    priceVerdict: { verdict: "LOW" | "OK" | "HIGH"; deviationPercent: number; label: string } | null;
    similarOffers: Array<{
      price: number; year: number | null; mileage: number | null;
      source: string; url: string | null; title: string | null;
    }>;
    meta: { fromCache: boolean; fetchedAt: string; dbFallback: boolean };
  } | null>(null);

  // Activity form
  const [activityTitle, setActivityTitle] = useState("");
  const [activityType, setActivityType] = useState("POZNAMKA");
  const [addingActivity, setAddingActivity] = useState(false);

  async function fetchLead() {
    setLoading(true);
    try {
      const res = await fetch(`/api/scout-leads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLead(data);
        setNotes(data.notes || "");
      }
    } catch (err) {
      console.error("Failed to fetch scout lead:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch market analysis for SOUKROMNIK leads
  useEffect(() => {
    if (!lead || lead.category !== "SOUKROMNIK") return;
    async function fetchMarket() {
      try {
        const res = await fetch(`/api/scout-leads/${id}/market-analysis`);
        if (res.ok) setMarketData(await res.json());
      } catch {
        // silent — non-critical feature
      }
    }
    fetchMarket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.category, id]); // re-fetch when lead loads

  async function handleSaveNotes() {
    setSaving(true);
    try {
      await fetch(`/api/scout-leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      await fetchLead();
    } finally {
      setSaving(false);
    }
  }

  async function handleClaim() {
    setClaiming(true);
    try {
      const res = await fetch(`/api/scout-leads/${id}/claim`, {
        method: "POST",
      });
      if (res.ok) await fetchLead();
    } finally {
      setClaiming(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      const res = await fetch(`/api/scout-leads/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setShowReject(false);
        await fetchLead();
      }
    } finally {
      setRejecting(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    await fetch(`/api/scout-leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchLead();
  }

  async function handleAddActivity() {
    if (!activityTitle.trim()) return;
    setAddingActivity(true);
    try {
      await fetch(`/api/scout-leads/${id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activityType,
          title: activityTitle,
        }),
      });
      setActivityTitle("");
      await fetchLead();
    } finally {
      setAddingActivity(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Načítám...</div>;
  }

  if (!lead) {
    return <div className="p-8 text-center text-gray-400">Lead nenalezen</div>;
  }

  const isPartner =
    lead.category === "AUTOBAZAR" || lead.category === "VRAKOVISTE";
  const isSoukromnik = lead.category === "SOUKROMNIK";
  const canConvert =
    lead.status !== "WON" &&
    lead.status !== "REJECTED" &&
    lead.status !== "LOST";

  // Parse photos for hero
  let photos: string[] = [];
  if (lead.vehiclePhotos) {
    try { photos = JSON.parse(lead.vehiclePhotos); } catch { /* */ }
  }
  const heroPhoto = photos[0] || null;

  // Parse equipment
  let equipmentItems: string[] = [];
  if (lead.vehicleEquipment) {
    try { equipmentItems = JSON.parse(lead.vehicleEquipment); } catch { /* */ }
  }

  // Vehicle spec chips
  const specChips: Array<{ label: string; value: string }> = [];
  if (lead.vehicleYear) specChips.push({ label: "Rok", value: String(lead.vehicleYear) });
  if (lead.vehicleMileage != null) specChips.push({ label: "Km", value: `${lead.vehicleMileage.toLocaleString("cs-CZ")} km` });
  if (lead.vehicleFuel) specChips.push({ label: "Palivo", value: fuelLabels[lead.vehicleFuel] || lead.vehicleFuel });
  if (lead.vehicleTransmission) specChips.push({ label: "Převodovka", value: transmissionLabels[lead.vehicleTransmission] || lead.vehicleTransmission });
  if (lead.vehiclePower != null) specChips.push({ label: "Výkon", value: `${lead.vehiclePower} kW` });
  if (lead.vehicleEngineCC != null) specChips.push({ label: "Motor", value: `${lead.vehicleEngineCC} ccm` });
  if (lead.vehicleBodyType) specChips.push({ label: "Karoserie", value: bodyTypeLabels[lead.vehicleBodyType] || lead.vehicleBodyType });
  if (lead.vehicleColor) specChips.push({ label: "Barva", value: lead.vehicleColor });
  if (lead.vehicleDoors != null) specChips.push({ label: "Dveře", value: String(lead.vehicleDoors) });

  return (
    <>
      {/* === HERO BANNER === */}
      <div className={`relative rounded-2xl overflow-hidden mb-6 ${heroPhoto ? "bg-gray-900" : "bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900/40"}`}>
        {/* Background photo or decorative pattern */}
        {heroPhoto ? (
          <img
            src={heroPhoto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        )}
        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: title + meta */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ScoutLeadStatusBadge status={lead.status} />
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/80 border border-white/20">
                  {categoryLabels[lead.category]} / {lead.country}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/80 border border-white/20">
                  {sourceLabels[lead.source] || lead.source}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {lead.listingTitle || lead.name}
              </h1>
              {isSoukromnik && lead.vehicleBrand && (
                <p className="text-white/60 text-sm">
                  {lead.vehicleBrand} {lead.vehicleModel}
                  {lead.vehicleYear ? ` (${lead.vehicleYear})` : ""}
                </p>
              )}
              {/* Quick contact in hero */}
              <div className="flex flex-wrap gap-2 pt-1">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {lead.phone}
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition border border-white/20"
                  >
                    {lead.email}
                  </a>
                )}
                {lead.sourceUrl && (
                  <a
                    href={lead.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition border border-white/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Zdrojový inzerát
                  </a>
                )}
              </div>
            </div>

            {/* Right: price + score */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {isSoukromnik && lead.vehiclePrice != null && lead.vehiclePrice > 0 && (
                <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
                  {lead.vehiclePrice.toLocaleString("cs-CZ")} Kč
                </div>
              )}
              {marketData?.priceVerdict && (
                <LeadPriceVerdict
                  verdict={marketData.priceVerdict.verdict}
                  label={marketData.priceVerdict.label}
                  deviationPercent={marketData.priceVerdict.deviationPercent}
                  fromCache={marketData.meta?.fromCache}
                  sourceCount={marketData.priceDistribution?.stats.count}
                />
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/40 text-xs">Score</span>
                <span className="text-xl font-bold text-orange-400">{lead.score}</span>
              </div>
            </div>
          </div>

          {/* Spec chips bar */}
          {isSoukromnik && specChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/10">
              {specChips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs border border-white/10"
                >
                  <span className="text-white/50">{chip.label}</span>
                  <span className="font-medium">{chip.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === DATA COMPLETENESS === */}
      <LeadDataCompleteness lead={lead as unknown as Record<string, unknown>} category={lead.category} />

      {/* === MAIN CONTENT === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Photos gallery (SOUKROMNIK) */}
          {isSoukromnik && photos.length > 0 && (
            <VehiclePhotosCard photosJson={lead.vehiclePhotos!} />
          )}

          {/* Vehicle description (SOUKROMNIK) */}
          {isSoukromnik && lead.vehicleDescription && (
            <VehicleDescriptionCard description={lead.vehicleDescription} />
          )}

          {/* Equipment (SOUKROMNIK) */}
          {isSoukromnik && (equipmentItems.length > 0 || lead.listingTitle) && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Výbava
              </h3>
              <LeadEquipmentTags title={lead.listingTitle} />
              {equipmentItems.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {equipmentItems.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* === MARKET ANALYSIS SECTION === */}
          {isSoukromnik && (
            <div className="space-y-6">
              {/* Price chart */}
              {marketData?.priceDistribution ? (
                <LeadPriceChart
                  buckets={marketData.priceDistribution.buckets}
                  stats={marketData.priceDistribution.stats}
                  sources={marketData.priceDistribution.sources}
                />
              ) : marketData && !marketData.priceDistribution ? (
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Cenová distribuce
                  </h3>
                  <p className="text-sm text-gray-400">Nedostatek dat pro cenovou analýzu</p>
                </Card>
              ) : null}

              {/* Similar offers */}
              {marketData?.similarOffers && marketData.similarOffers.length > 0 && (
                <LeadSimilarTable offers={marketData.similarOffers} />
              )}
            </div>
          )}

          {/* Contact + Location (non-SOUKROMNIK or expanded for SOUKROMNIK) */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Kontakt a lokace
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Název</dt>
                <dd className="font-medium text-gray-900">{lead.name}</dd>
              </div>
              {lead.phone && (
                <div>
                  <dt className="text-gray-500">Telefon</dt>
                  <dd className="font-medium">
                    <a href={`tel:${lead.phone}`} className="text-orange-600 hover:underline">
                      {lead.phone}
                    </a>
                  </dd>
                </div>
              )}
              {lead.email && (
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd>
                    <a href={`mailto:${lead.email}`} className="text-orange-600 hover:underline">
                      {lead.email}
                    </a>
                  </dd>
                </div>
              )}
              {lead.web && (
                <div>
                  <dt className="text-gray-500">Web</dt>
                  <dd>
                    <a
                      href={lead.web.startsWith("http") ? lead.web : `https://${lead.web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline"
                    >
                      {lead.web}
                    </a>
                  </dd>
                </div>
              )}
              {lead.contactPerson && (
                <div>
                  <dt className="text-gray-500">Kontaktní osoba</dt>
                  <dd>{lead.contactPerson}</dd>
                </div>
              )}
              {lead.city && (
                <div>
                  <dt className="text-gray-500">Město</dt>
                  <dd>{lead.city}{lead.region ? `, ${lead.region}` : ""}{lead.zip ? ` ${lead.zip}` : ""}</dd>
                </div>
              )}
              {lead.address && (
                <div>
                  <dt className="text-gray-500">Adresa</dt>
                  <dd>{lead.address}</dd>
                </div>
              )}
            </dl>
            {lead.latitude && lead.longitude && (
              <a
                href={`https://maps.google.com/?q=${lead.latitude},${lead.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-orange-600 hover:underline"
              >
                Zobrazit na mapě
              </a>
            )}
          </Card>

          {/* Business info (AUTOBAZAR/VRAKOVISTE) */}
          {isPartner && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                Firemní údaje
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {lead.ico && (
                  <div>
                    <dt className="text-gray-500">IČO</dt>
                    <dd>{lead.ico}</dd>
                  </div>
                )}
                {lead.estimatedSize && (
                  <div>
                    <dt className="text-gray-500">Velikost</dt>
                    <dd>{sizeLabels[lead.estimatedSize] || lead.estimatedSize}</dd>
                  </div>
                )}
                {lead.googleRating != null && (
                  <div>
                    <dt className="text-gray-500">Google hodnocení</dt>
                    <dd>
                      {lead.googleRating.toFixed(1)} / 5.0
                      {lead.googleReviewCount != null &&
                        ` (${lead.googleReviewCount} recenzí)`}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          {/* Source info — collapsed */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500 uppercase">
                Zdroj
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{sourceLabels[lead.source] || lead.source}</span>
                {lead.sourceId && <span className="font-mono">{lead.sourceId}</span>}
                <span>{new Date(lead.scrapedAt).toLocaleString("cs-CZ")}</span>
              </div>
            </div>
            {lead.rawPayload && (
              <div className="mt-3">
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {showRaw ? "Skrýt raw data" : "Zobrazit raw data"}
                </button>
                {showRaw && (
                  <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(lead.rawPayload, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right column — 1/3 sidebar */}
        <div className="space-y-6">
          {/* Actions card — primary */}
          <Card className="p-6 border-orange-200 bg-orange-50/30">
            <div className="space-y-3">
              {!lead.assignedTo && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? "Přebírám..." : "Převzít lead"}
                </Button>
              )}
              {lead.assignedTo && (
                <div className="text-sm text-center text-gray-600">
                  Přiřazeno: <span className="font-semibold">{lead.assignedTo.firstName} {lead.assignedTo.lastName}</span>
                </div>
              )}
              {canConvert && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowConvert(true)}
                >
                  Konvertovat na {isPartner ? "partnera" : "lead"}
                </Button>
              )}
              {canConvert && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowReject(true)}
                >
                  Odmítnout
                </Button>
              )}

              {/* Status change */}
              {lead.status !== "WON" &&
                lead.status !== "REJECTED" &&
                lead.status !== "LOST" && (
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="NEW">Nový</option>
                    <option value="CONTACTED">Kontaktován</option>
                    <option value="QUALIFIED">Kvalifikován</option>
                    <option value="LOST">Ztracen</option>
                  </select>
                )}
            </div>

            {lead.rejectionReason && (
              <div className="mt-3 text-sm text-red-600">
                Odmítnuto: {lead.rejectionReason}
              </div>
            )}
            {lead.convertedToPartnerId && (
              <a href={`/admin/partners/${lead.convertedToPartnerId}`} className="block mt-2 text-sm text-orange-600 hover:underline">
                Zobrazit partnera
              </a>
            )}
            {lead.convertedToLeadId && (
              <a href={`/admin/leads/${lead.convertedToLeadId}`} className="block mt-2 text-sm text-orange-600 hover:underline">
                Zobrazit lead
              </a>
            )}
          </Card>

          {/* Reject modal */}
          {showReject && (
            <Card className="p-6 border-red-200">
              <h3 className="text-sm font-semibold text-red-600 mb-3">
                Odmítnutí leadu
              </h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Důvod odmítnutí..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowReject(false)}>
                  Zrušit
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleReject}
                  disabled={rejecting || !rejectReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {rejecting ? "Odmítám..." : "Odmítnout"}
                </Button>
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Poznámky
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interní poznámky..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2"
              rows={4}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveNotes}
              disabled={saving}
            >
              {saving ? "Ukládám..." : "Uložit"}
            </Button>
          </Card>

          {/* Add activity */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Přidat aktivitu
            </h3>
            <div className="space-y-2">
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="POZNAMKA">Poznámka</option>
                <option value="TELEFONAT">Telefonát</option>
                <option value="EMAIL">Email</option>
              </select>
              <input
                type="text"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="Popis aktivity..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddActivity}
                disabled={addingActivity || !activityTitle.trim()}
              >
                {addingActivity ? "Přidávám..." : "Přidat"}
              </Button>
            </div>
          </Card>

          {/* Activity log */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Historie aktivit
            </h3>
            <ScoutLeadActivityLog activities={lead.activities} />
          </Card>
        </div>
      </div>

      {/* Convert modal */}
      <ScoutLeadConvertModal
        lead={lead}
        open={showConvert}
        onClose={() => setShowConvert(false)}
        onConverted={(targetType, targetId) => {
          if (targetType === "Partner") {
            router.push(`/admin/partners/${targetId}`);
          } else {
            router.push(`/admin/leads/${targetId}`);
          }
        }}
      />
    </>
  );
}
