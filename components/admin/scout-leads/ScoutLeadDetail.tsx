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
    } | null;
    priceVerdict: { verdict: "LOW" | "OK" | "HIGH"; deviationPercent: number; label: string } | null;
    similarLeads: Array<{
      id: string; listingTitle: string | null; vehicleYear: number | null;
      vehiclePrice: number | null; vehicleMileage: number | null;
      city: string | null; source: string; sourceUrl: string | null;
    }>;
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
  const canConvert =
    lead.status !== "WON" &&
    lead.status !== "REJECTED" &&
    lead.status !== "LOST";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data completeness — always visible */}
          <LeadDataCompleteness lead={lead as unknown as Record<string, unknown>} category={lead.category} />

          {/* Contact info */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Kontaktní údaje
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
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-orange-600 hover:underline"
                    >
                      {lead.phone}
                    </a>
                  </dd>
                </div>
              )}
              {lead.email && (
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd>
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-orange-600 hover:underline"
                    >
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
                      href={
                        lead.web.startsWith("http")
                          ? lead.web
                          : `https://${lead.web}`
                      }
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
            </dl>
          </Card>

          {/* Location */}
          {(lead.address || lead.city) && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                Lokace
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {lead.address && (
                  <div>
                    <dt className="text-gray-500">Adresa</dt>
                    <dd>{lead.address}</dd>
                  </div>
                )}
                {lead.city && (
                  <div>
                    <dt className="text-gray-500">Město</dt>
                    <dd>{lead.city}</dd>
                  </div>
                )}
                {lead.region && (
                  <div>
                    <dt className="text-gray-500">Region</dt>
                    <dd>{lead.region}</dd>
                  </div>
                )}
                {lead.zip && (
                  <div>
                    <dt className="text-gray-500">PSČ</dt>
                    <dd>{lead.zip}</dd>
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
          )}

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

          {/* Vehicle info (SOUKROMNIK) */}
          {lead.category === "SOUKROMNIK" &&
            (lead.vehicleBrand || lead.listingTitle) && (
              <Card className="p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                  Vozidlo
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {lead.listingTitle && (
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500">Název inzerátu</dt>
                      <dd className="font-medium">{lead.listingTitle}</dd>
                    </div>
                  )}
                  {lead.vehicleBrand && (
                    <div>
                      <dt className="text-gray-500">Značka / Model</dt>
                      <dd>
                        {lead.vehicleBrand} {lead.vehicleModel}
                      </dd>
                    </div>
                  )}
                  {lead.vehicleYear && (
                    <div>
                      <dt className="text-gray-500">Rok</dt>
                      <dd>{lead.vehicleYear}</dd>
                    </div>
                  )}
                  {lead.vehiclePrice != null && (
                    <div>
                      <dt className="text-gray-500">Cena</dt>
                      <dd>
                        {lead.vehiclePrice.toLocaleString("cs-CZ")} Kč
                      </dd>
                    </div>
                  )}
                  {lead.vehicleMileage != null && (
                    <div>
                      <dt className="text-gray-500">Nájezd</dt>
                      <dd>
                        {lead.vehicleMileage.toLocaleString("cs-CZ")} km
                      </dd>
                    </div>
                  )}
                </dl>
                {/* Equipment tags from listing title */}
                <LeadEquipmentTags title={lead.listingTitle} />
              </Card>
            )}

          {/* Price distribution chart (SOUKROMNIK, >= 5 similar) */}
          {lead.category === "SOUKROMNIK" && marketData?.priceDistribution ? (
            <LeadPriceChart
              buckets={marketData.priceDistribution.buckets}
              stats={marketData.priceDistribution.stats}
            />
          ) : lead.category === "SOUKROMNIK" && marketData && !marketData.priceDistribution ? (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Cenová distribuce
              </h3>
              <p className="text-sm text-gray-400">Nedostatek dat pro cenovou analýzu</p>
            </Card>
          ) : null}

          {/* Similar leads table (SOUKROMNIK) */}
          {lead.category === "SOUKROMNIK" && marketData?.similarLeads && marketData.similarLeads.length > 0 && (
            <LeadSimilarTable leads={marketData.similarLeads} />
          )}

          {/* Source info */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Zdroj
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Zdroj</dt>
                <dd>{sourceLabels[lead.source] || lead.source}</dd>
              </div>
              {lead.sourceId && (
                <div>
                  <dt className="text-gray-500">Source ID</dt>
                  <dd className="font-mono text-xs">{lead.sourceId}</dd>
                </div>
              )}
              {lead.sourceUrl && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">URL</dt>
                  <dd>
                    <a
                      href={lead.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline break-all"
                    >
                      {lead.sourceUrl}
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Staženo</dt>
                <dd>
                  {new Date(lead.scrapedAt).toLocaleString("cs-CZ")}
                </dd>
              </div>
            </dl>
            {lead.rawPayload && (
              <div className="mt-4">
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {showRaw
                    ? "Skrýt raw payload"
                    : "Zobrazit raw payload"}
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

        {/* Right column */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Stav
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <ScoutLeadStatusBadge status={lead.status} />
                <span className="text-sm text-gray-500">
                  Score:{" "}
                  <span className="font-bold text-orange-500">
                    {lead.score}
                  </span>
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Kategorie: </span>
                <span className="font-medium">
                  {categoryLabels[lead.category]} ({lead.country})
                </span>
              </div>
              {lead.assignedTo && (
                <div className="text-sm">
                  <span className="text-gray-500">Přiřazeno: </span>
                  <span className="font-medium">
                    {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                  </span>
                </div>
              )}
              {lead.rejectionReason && (
                <div className="text-sm text-red-600">
                  Důvod odmítnutí: {lead.rejectionReason}
                </div>
              )}
              {lead.convertedToPartnerId && (
                <a
                  href={`/admin/partners/${lead.convertedToPartnerId}`}
                  className="block text-sm text-orange-600 hover:underline"
                >
                  Zobrazit partnera
                </a>
              )}
              {lead.convertedToLeadId && (
                <a
                  href={`/admin/leads/${lead.convertedToLeadId}`}
                  className="block text-sm text-orange-600 hover:underline"
                >
                  Zobrazit lead
                </a>
              )}
            </div>

            {/* Price verdict (SOUKROMNIK) */}
            {marketData?.priceVerdict && (
              <div className="mt-3">
                <LeadPriceVerdict
                  verdict={marketData.priceVerdict.verdict}
                  label={marketData.priceVerdict.label}
                  deviationPercent={marketData.priceVerdict.deviationPercent}
                />
              </div>
            )}

            {/* Status change buttons */}
            {lead.status !== "WON" &&
              lead.status !== "REJECTED" &&
              lead.status !== "LOST" && (
                <div className="mt-4 space-y-2">
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    value={lead.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                  >
                    <option value="NEW">Nový</option>
                    <option value="CONTACTED">Kontaktován</option>
                    <option value="QUALIFIED">Kvalifikován</option>
                    <option value="LOST">Ztracen</option>
                  </select>
                </div>
              )}
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Akce
            </h3>
            <div className="space-y-2">
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
            </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReject(false)}
                >
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
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Poznámky
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interní poznámky..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
              rows={4}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveNotes}
              disabled={saving}
            >
              {saving ? "Ukládám..." : "Uložit poznámky"}
            </Button>
          </Card>

          {/* Add activity */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Přidat aktivitu
            </h3>
            <div className="space-y-3">
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
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
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
