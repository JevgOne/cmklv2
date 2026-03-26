"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import type { EmailTemplateType } from "@/lib/validators/email";

interface TemplateInfo {
  type: EmailTemplateType;
  name: string;
  description: string;
  requiredContext: string;
  requiresVehicle: boolean;
}

interface EmailSendModalProps {
  open: boolean;
  onClose: () => void;
  vehicleId?: string;
  vehicleName?: string;
  /** Pre-select template */
  defaultTemplate?: EmailTemplateType;
  /** Pre-fill recipient */
  defaultRecipientEmail?: string;
  defaultRecipientName?: string;
}

type Step = "select" | "compose" | "preview" | "sent";

export function EmailSendModal({
  open,
  onClose,
  vehicleId,
  vehicleName,
  defaultTemplate,
  defaultRecipientEmail,
  defaultRecipientName,
}: EmailSendModalProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [step, setStep] = useState<Step>("select");
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType | "">(
    defaultTemplate || ""
  );
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail || "");
  const [recipientName, setRecipientName] = useState(defaultRecipientName || "");
  const [customText, setCustomText] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Extra variables for specific templates
  const [newPrice, setNewPrice] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      fetch("/api/emails/templates")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setTemplates(data);
        })
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setStep(defaultTemplate ? "compose" : "select");
      setSelectedTemplate(defaultTemplate || "");
      setRecipientEmail(defaultRecipientEmail || "");
      setRecipientName(defaultRecipientName || "");
      setCustomText("");
      setPreviewHtml("");
      setPreviewSubject("");
      setError("");
      setNewPrice("");
      setReason("");
    }
  }, [open, defaultTemplate, defaultRecipientEmail, defaultRecipientName]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadPreview = useCallback(async () => {
    if (!selectedTemplate) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        templateType: selectedTemplate,
      });
      if (recipientName) params.set("recipientName", recipientName);
      if (vehicleId) params.set("vehicleId", vehicleId);
      if (customText) params.set("customText", customText);
      if (newPrice) params.set("newPrice", newPrice);
      if (reason) params.set("reason", reason);

      const res = await fetch(`/api/emails/preview?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba při nahrání preview");
      setPreviewHtml(data.html);
      setPreviewSubject(data.subject);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při nahrání preview");
    } finally {
      setLoading(false);
    }
  }, [selectedTemplate, recipientName, vehicleId, customText, newPrice, reason]);

  const sendEmail = async () => {
    if (!selectedTemplate || !recipientEmail || !recipientName) return;
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        templateType: selectedTemplate,
        recipientEmail,
        recipientName,
        customText: customText || undefined,
        vehicleId: vehicleId || undefined,
      };
      const variables: Record<string, unknown> = {};
      if (newPrice) variables.newPrice = Number(newPrice);
      if (reason) variables.reason = reason;
      if (Object.keys(variables).length > 0) body.variables = variables;

      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba při odesílání");
      setStep("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při odesílání");
    } finally {
      setLoading(false);
    }
  };

  const selectedInfo = templates.find((t) => t.type === selectedTemplate);
  const needsNewPrice = selectedTemplate === "PRICE_CHANGE";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        step === "select"
          ? "Poslat email"
          : step === "compose"
          ? selectedInfo?.name || "Napsat email"
          : step === "preview"
          ? "Náhled emailu"
          : "Odesláno"
      }
      className="max-w-[600px]"
    >
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          Odesílání emailů vyžaduje internetové připojení
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Select template */}
      {step === "select" && (
        <div className="space-y-3">
          {templates.map((t) => (
            <button
              key={t.type}
              onClick={() => {
                setSelectedTemplate(t.type);
                setStep("compose");
              }}
              className="w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer bg-white"
            >
              <p className="font-semibold text-gray-900 text-[15px]">{t.name}</p>
              <p className="text-sm text-gray-500 mt-1">{t.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Compose */}
      {step === "compose" && (
        <div className="space-y-4">
          <Input
            label="Jméno příjemce"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Jan Novak"
          />
          <Input
            label="Email příjemce"
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="jan@email.cz"
          />
          {vehicleName && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Vozidlo</p>
              <p className="font-semibold text-gray-900">{vehicleName}</p>
            </div>
          )}
          {needsNewPrice && (
            <>
              <Input
                label="Nová doporučená cena (Kč)"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="399000"
              />
              <Input
                label="Důvod snížení"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nižší poptávka v daném segmentu"
              />
            </>
          )}
          <Textarea
            label="Vlastní text (volitelně)"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Přidejte osobní zprávu..."
            rows={3}
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("select")}
              className="flex-1"
            >
              Zpět
            </Button>
            <Button
              variant="primary"
              onClick={loadPreview}
              disabled={loading || !recipientName || !recipientEmail}
              className="flex-1"
            >
              {loading ? "Načítám..." : "Náhled"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Předmět</p>
            <p className="font-semibold text-gray-900 text-sm">{previewSubject}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Příjemce</p>
            <p className="text-sm text-gray-900">
              {recipientName} &lt;{recipientEmail}&gt;
            </p>
          </div>
          <div
            className="border border-gray-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep("compose")}
              className="flex-1"
            >
              Upravit
            </Button>
            <Button
              variant="primary"
              onClick={sendEmail}
              disabled={loading || !isOnline}
              className="flex-1"
            >
              {loading ? "Odesílám..." : "Odeslat"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Sent */}
      {step === "sent" && (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-8 h-8 text-green-600"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Email odeslán</h3>
          <p className="text-sm text-gray-500">
            Email byl odeslán na {recipientEmail}
          </p>
          <Button variant="primary" onClick={onClose} className="mt-6">
            Zavřít
          </Button>
        </div>
      )}
    </Modal>
  );
}
