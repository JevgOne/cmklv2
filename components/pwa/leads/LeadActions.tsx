"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface LeadActionsProps {
  leadId: string;
  status: string;
  brand?: string | null;
  model?: string | null;
}

const REJECTION_REASONS = [
  { value: "no_answer", label: "Nezvedá telefon" },
  { value: "not_selling", label: "Nechce prodávat" },
  { value: "unrealistic_price", label: "Nereálná cena" },
  { value: "out_of_region", label: "Mimo region" },
  { value: "other", label: "Jiný důvod" },
];

export function LeadActions({ leadId, status, brand, model }: LeadActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [meetingDate, setMeetingDate] = useState("");

  async function updateStatus(newStatus: string, extra?: Record<string, string>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // chyba
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    const reason = rejectReason === "other" ? rejectNote : REJECTION_REASONS.find((r) => r.value === rejectReason)?.label || rejectNote;
    if (!reason) return;
    await updateStatus("REJECTED", { rejectionReason: reason });
    setShowRejectModal(false);
  }

  async function handleMeeting() {
    if (!meetingDate) return;
    await updateStatus("MEETING_SCHEDULED", { meetingDate });
    setShowMeetingModal(false);
  }

  const vehicleParams = new URLSearchParams();
  if (brand) vehicleParams.set("brand", brand);
  if (model) vehicleParams.set("model", model);
  vehicleParams.set("leadId", leadId);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {status === "NEW" && (
          <Button
            variant="success"
            size="sm"
            disabled={loading}
            onClick={() => updateStatus("ASSIGNED")}
          >
            Přijmout lead
          </Button>
        )}

        {status === "ASSIGNED" && (
          <Button
            variant="primary"
            size="sm"
            disabled={loading}
            onClick={() => updateStatus("CONTACTED")}
          >
            Kontaktováno
          </Button>
        )}

        {status === "CONTACTED" && (
          <Button
            variant="primary"
            size="sm"
            disabled={loading}
            onClick={() => setShowMeetingModal(true)}
          >
            Schůzka domluvena
          </Button>
        )}

        {status === "MEETING_SCHEDULED" && (
          <Button
            variant="primary"
            size="sm"
            disabled={loading}
            onClick={() => {
              router.push(`/makler/vehicles/new?${vehicleParams.toString()}`);
            }}
          >
            Nabrat toto auto
          </Button>
        )}

        {(status === "NEW" || status === "ASSIGNED" || status === "CONTACTED" || status === "MEETING_SCHEDULED") && (
          <Button
            variant="danger"
            size="sm"
            disabled={loading}
            onClick={() => setShowRejectModal(true)}
          >
            Odmitnout
          </Button>
        )}
      </div>

      {/* Reject modal */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Odmitnout lead"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              Zrušit
            </Button>
            <Button
              variant="danger"
              disabled={!rejectReason || (rejectReason === "other" && !rejectNote) || loading}
              onClick={handleReject}
            >
              Odmítnout
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Důvod"
            placeholder="Vyberte důvod..."
            options={REJECTION_REASONS}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          {rejectReason === "other" && (
            <Input
              label="Poznámka"
              placeholder="Popište důvod..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          )}
        </div>
      </Modal>

      {/* Meeting modal */}
      <Modal
        open={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        title="Schůzka domluvena"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowMeetingModal(false)}>
              Zrušit
            </Button>
            <Button
              variant="primary"
              disabled={!meetingDate || loading}
              onClick={handleMeeting}
            >
              Potvrdit
            </Button>
          </>
        }
      >
        <Input
          label="Datum a čas schůzky"
          type="datetime-local"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
        />
      </Modal>
    </>
  );
}
