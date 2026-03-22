"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { PartnerStatusBadge } from "./PartnerStatusBadge";

interface Partner {
  id: string;
  name: string;
  type: string;
  ico: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  web: string | null;
  contactPerson: string | null;
  estimatedSize: string | null;
  status: string;
  score: number;
  rejectionReason: string | null;
  managerId: string | null;
  userId: string | null;
  slug: string;
  notes: string | null;
  description: string | null;
  manager: { id: string; firstName: string; lastName: string; email: string } | null;
  user: { id: string; email: string; firstName: string; lastName: string } | null;
  _count: { activities: number; leads: number };
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  nextContactDate: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string };
}

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
}

const activityIcons: Record<string, string> = {
  POZNAMKA: "📝",
  NAVSTEVA: "🏢",
  TELEFONAT: "📞",
  EMAIL: "📧",
  ZMENA_STAVU: "🔄",
  SYSTEM: "⚙️",
};

const statusOptions = [
  { value: "NEOSLOVENY", label: "Neosloveny" },
  { value: "PRIRAZENY", label: "Prirazeny" },
  { value: "OSLOVEN", label: "Osloven" },
  { value: "JEDNAME", label: "Jedname" },
  { value: "AKTIVNI_PARTNER", label: "Aktivni partner" },
  { value: "ODMITNUTO", label: "Odmitnuto" },
  { value: "POZASTAVENO", label: "Pozastaveno" },
];

export function PartnerDetail({ partnerId }: { partnerId: string }) {
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    web: "",
    address: "",
    city: "",
    region: "",
    notes: "",
  });

  // Activity form
  const [activityForm, setActivityForm] = useState({
    type: "POZNAMKA",
    title: "",
    description: "",
  });

  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateResult, setActivateResult] = useState<{ email: string; temporaryPassword: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [partnerRes, activitiesRes] = await Promise.all([
          fetch(`/api/partners/${partnerId}`),
          fetch(`/api/partners/${partnerId}/activities`),
        ]);

        if (partnerRes.ok) {
          const p = await partnerRes.json();
          setPartner(p);
          setFormData({
            name: p.name || "",
            contactPerson: p.contactPerson || "",
            phone: p.phone || "",
            email: p.email || "",
            web: p.web || "",
            address: p.address || "",
            city: p.city || "",
            region: p.region || "",
            notes: p.notes || "",
          });
        }

        if (activitiesRes.ok) {
          setActivities(await activitiesRes.json());
        }
      } catch (err) {
        console.error("Failed to load partner:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [partnerId]);

  async function savePartner() {
    setSaving(true);
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        setPartner((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(newStatus: string) {
    if (newStatus === "ODMITNUTO") {
      setShowRejectModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPartner((prev) => (prev ? { ...prev, ...updated } : null));
        // Refresh activities
        const actRes = await fetch(`/api/partners/${partnerId}/activities`);
        if (actRes.ok) setActivities(await actRes.json());
      }
    } catch (err) {
      console.error("Failed to change status:", err);
    }
  }

  async function submitRejection() {
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ODMITNUTO",
          rejectionReason,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPartner((prev) => (prev ? { ...prev, ...updated } : null));
        setShowRejectModal(false);
        setRejectionReason("");
        const actRes = await fetch(`/api/partners/${partnerId}/activities`);
        if (actRes.ok) setActivities(await actRes.json());
      }
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  }

  async function activatePartnership() {
    try {
      const res = await fetch(`/api/partners/${partnerId}/activate`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        setActivateResult(result);
        // Refresh data
        const partnerRes = await fetch(`/api/partners/${partnerId}`);
        if (partnerRes.ok) setPartner(await partnerRes.json());
        const actRes = await fetch(`/api/partners/${partnerId}/activities`);
        if (actRes.ok) setActivities(await actRes.json());
      } else {
        const err = await res.json();
        alert(err.error || "Chyba pri aktivaci");
      }
    } catch (err) {
      console.error("Failed to activate:", err);
    }
  }

  async function addActivity() {
    if (!activityForm.title.trim()) return;

    try {
      const res = await fetch(`/api/partners/${partnerId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityForm),
      });
      if (res.ok) {
        const newActivity = await res.json();
        setActivities((prev) => [newActivity, ...prev]);
        setActivityForm({ type: "POZNAMKA", title: "", description: "" });
      }
    } catch (err) {
      console.error("Failed to add activity:", err);
    }
  }

  async function assignManager(managerId: string) {
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: managerId || null }),
      });
      if (res.ok) {
        const partnerRes = await fetch(`/api/partners/${partnerId}`);
        if (partnerRes.ok) setPartner(await partnerRes.json());
        const actRes = await fetch(`/api/partners/${partnerId}/activities`);
        if (actRes.ok) setActivities(await actRes.json());
      }
    } catch (err) {
      console.error("Failed to assign manager:", err);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm h-96" />
          <div className="bg-white rounded-2xl p-6 shadow-sm h-96" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-bold mb-2">Partner nenalezen</h2>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <button
              onClick={() => router.push("/admin/partners")}
              className="hover:text-gray-900 cursor-pointer bg-transparent border-none text-[13px] text-gray-500"
            >
              Partneri
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{partner.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900">
              {partner.name}
            </h1>
            <PartnerStatusBadge status={partner.status} />
            <Badge variant="default">
              {partner.type === "AUTOBAZAR" ? "Autobazar" : "Vrakoviste"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {partner.status !== "AKTIVNI_PARTNER" && !partner.userId && (
            <Button
              variant="success"
              size="sm"
              onClick={() => setShowActivateModal(true)}
            >
              Aktivovat partnerstvi
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Details */}
        <div className="space-y-6">
          {/* Edit form */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Udaje partnera
            </h3>
            <div className="space-y-4">
              <Input
                label="Nazev"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
              <Input
                label="Kontaktni osoba"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, contactPerson: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Telefon"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                />
                <Input
                  label="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <Input
                label="Web"
                value={formData.web}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, web: e.target.value }))
                }
              />
              <Input
                label="Adresa"
                value={formData.address}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, address: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Mesto"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, city: e.target.value }))
                  }
                />
                <Input
                  label="Kraj"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, region: e.target.value }))
                  }
                />
              </div>
              <Textarea
                label="Poznamky"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
                rows={3}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={savePartner}
                disabled={saving}
              >
                {saving ? "Ukladam..." : "Ulozit zmeny"}
              </Button>
            </div>
          </Card>

          {/* Status + Manager */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Stav a prirazeni
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600 w-20">
                  Score:
                </span>
                <span className="text-2xl font-extrabold text-orange-500">
                  {partner.score}
                </span>
              </div>

              <Select
                label="Stav"
                value={partner.status}
                onChange={(e) => changeStatus(e.target.value)}
                options={statusOptions}
              />

              <div>
                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                  Prirazen manazerovi
                </label>
                <div className="text-sm text-gray-600">
                  {partner.manager
                    ? `${partner.manager.firstName} ${partner.manager.lastName} (${partner.manager.email})`
                    : "Neprirazeno"}
                </div>
              </div>

              {partner.userId && (
                <div className="p-3 bg-green-50 rounded-lg text-sm">
                  <span className="font-bold text-green-700">Aktivni ucet: </span>
                  <span className="text-green-600">
                    {partner.user?.email}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column — Timeline */}
        <div className="space-y-6">
          {/* Add activity form */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Zaznamenat kontakt
            </h3>
            <div className="space-y-3">
              <Select
                value={activityForm.type}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, type: e.target.value }))
                }
                options={[
                  { value: "POZNAMKA", label: "Poznamka" },
                  { value: "NAVSTEVA", label: "Navsteva" },
                  { value: "TELEFONAT", label: "Telefonat" },
                  { value: "EMAIL", label: "Email" },
                ]}
              />
              <Input
                placeholder="Nazev aktivity"
                value={activityForm.title}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, title: e.target.value }))
                }
              />
              <Textarea
                placeholder="Popis (volitelne)"
                value={activityForm.description}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
              />
              <Button variant="primary" size="sm" onClick={addActivity}>
                Ulozit
              </Button>
            </div>
          </Card>

          {/* Activity timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Timeline ({activities.length})
            </h3>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400">
                Zadne zaznamy aktivity.
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="text-lg">
                      {activityIcons[activity.type] || "📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-sm text-gray-900">
                          {activity.title}
                        </div>
                        <div className="text-[11px] text-gray-400 whitespace-nowrap">
                          {new Date(activity.createdAt).toLocaleDateString(
                            "cs-CZ"
                          )}
                        </div>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                      )}
                      <div className="text-[11px] text-gray-400 mt-1">
                        {activity.user.firstName} {activity.user.lastName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Rejection modal */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Odmitnutí partnera"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRejectModal(false)}
            >
              Zrusit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={submitRejection}
              disabled={!rejectionReason.trim()}
            >
              Odmitnout
            </Button>
          </>
        }
      >
        <Textarea
          label="Duvod odmitnuti"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Proc partnerstvi odmitnout?"
          rows={3}
        />
      </Modal>

      {/* Activate modal */}
      <Modal
        open={showActivateModal}
        onClose={() => {
          setShowActivateModal(false);
          setActivateResult(null);
        }}
        title="Aktivovat partnerstvi"
        footer={
          activateResult ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowActivateModal(false);
                setActivateResult(null);
              }}
            >
              Hotovo
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActivateModal(false)}
              >
                Zrusit
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={activatePartnership}
              >
                Aktivovat
              </Button>
            </>
          )
        }
      >
        {activateResult ? (
          <div className="space-y-3">
            <p className="text-sm text-green-700 font-semibold">
              Ucet uspesne vytvoren!
            </p>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div>
                <span className="font-semibold">Email: </span>
                {activateResult.email}
              </div>
              <div>
                <span className="font-semibold">Docasne heslo: </span>
                <code className="bg-gray-200 px-2 py-0.5 rounded">
                  {activateResult.temporaryPassword}
                </code>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Odselete partnerovi tyto udaje emailem.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Aktivaci se vytvori uzivatelsky ucet pro partnera{" "}
              <strong>{partner.name}</strong> s emailem{" "}
              <strong>{partner.email || "chybi email!"}</strong>.
            </p>
            {!partner.email && (
              <p className="text-sm text-error-500 font-semibold">
                Partner nema vyplneny email. Nejdriv doplnte email.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
