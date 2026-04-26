"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Application {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  companyName: string | null;
  ico: string | null;
  investmentRange: string | null;
  message: string;
  status: string;
  adminNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: { firstName: string; lastName: string } | null;
  convertedUser: { id: string; firstName: string; lastName: string; role: string; email?: string } | null;
  ipAddress: string | null;
}

const STATUS_BADGE: Record<string, "new" | "pending" | "success" | "rejected" | "default"> = {
  NEW: "new",
  CONTACTED: "pending",
  APPROVED: "success",
  REJECTED: "rejected",
  SPAM: "default",
};

const ROLE_LABEL: Record<string, string> = {
  VERIFIED_DEALER: "Realizátor",
  INVESTOR: "Investor",
};

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetch(`/api/admin/marketplace/applications/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setApp(data.application);
        setAdminNotes(data.application?.adminNotes || "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    if (status === "APPROVED" && !confirm("Schválit žádost? Bude vytvořen uživatelský účet.")) return;
    if (status === "REJECTED" && !rejectionReason) {
      alert("Vyplňte důvod zamítnutí.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/marketplace/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes, rejectionReason: rejectionReason || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!app) {
    return <div className="text-center py-20 text-gray-500">Žádost nenalezena.</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <Link href="/admin/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
            Admin / Marketplace
          </Link>
          <span>/</span>
          <Link href="/admin/marketplace/applications" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
            Žádosti
          </Link>
          <span>/</span>
          <span className="text-gray-900">Detail</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-extrabold text-gray-900">
            {app.firstName} {app.lastName}
          </h1>
          <Badge variant={STATUS_BADGE[app.status] || "default"}>{app.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Kontaktní údaje</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Jméno" value={`${app.firstName} ${app.lastName}`} />
              <InfoRow label="Email" value={app.email} />
              <InfoRow label="Telefon" value={app.phone} />
              <InfoRow label="Role" value={ROLE_LABEL[app.role] || app.role} />
              <InfoRow label="Datum podání" value={new Date(app.createdAt).toLocaleString("cs-CZ")} />
              {app.ipAddress && <InfoRow label="IP adresa" value={app.ipAddress} />}
            </div>
          </Card>

          {/* Role-specific */}
          {app.role === "VERIFIED_DEALER" && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Údaje firmy</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Název firmy" value={app.companyName || "—"} />
                <InfoRow label="IČO" value={app.ico || "—"} />
              </div>
            </Card>
          )}

          {app.role === "INVESTOR" && app.investmentRange && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Investiční profil</h3>
              <InfoRow label="Investiční rozsah" value={app.investmentRange} />
            </Card>
          )}

          {/* Message */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Zpráva od žadatele</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.message}</p>
          </Card>

          {/* Converted user */}
          {app.convertedUser && (
            <Card className="p-6 bg-green-50 border-green-200">
              <h3 className="text-lg font-bold text-green-800 mb-2">Propojený účet</h3>
              <p className="text-sm text-green-700">
                {app.convertedUser.firstName} {app.convertedUser.lastName} ({app.convertedUser.role})
                {" — "}
                <Link href={`/admin/users`} className="text-orange-500 hover:text-orange-600 no-underline font-medium">
                  Správa uživatelů
                </Link>
              </p>
            </Card>
          )}
        </div>

        {/* Actions sidebar */}
        <div className="space-y-6">
          {/* Admin notes */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Poznámky admina</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Interní poznámky..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            />
            {app.reviewedBy && app.reviewedAt && (
              <p className="text-xs text-gray-400 mt-2">
                Naposledy: {app.reviewedBy.firstName} {app.reviewedBy.lastName},{" "}
                {new Date(app.reviewedAt).toLocaleString("cs-CZ")}
              </p>
            )}
          </Card>

          {/* Actions */}
          {app.status !== "APPROVED" && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Akce</h3>
              <div className="space-y-3">
                {app.status === "NEW" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => updateStatus("CONTACTED")}
                    disabled={saving}
                  >
                    Označit jako kontaktovaný
                  </Button>
                )}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => updateStatus("APPROVED")}
                  disabled={saving}
                >
                  {saving ? "Zpracovávám..." : "Schválit (vytvořit účet)"}
                </Button>
                <div>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Důvod zamítnutí..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none mb-2"
                  />
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => updateStatus("REJECTED")}
                    disabled={saving}
                  >
                    Zamítnout
                  </Button>
                </div>
                {app.status !== "SPAM" && (
                  <Button
                    variant="outline"
                    className="w-full text-gray-400"
                    onClick={() => updateStatus("SPAM")}
                    disabled={saving}
                  >
                    Označit jako spam
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Back */}
          <Button variant="outline" className="w-full" onClick={() => router.push("/admin/marketplace/applications")}>
            Zpět na seznam
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
