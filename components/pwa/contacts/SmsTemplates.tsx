"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface SmsTemplatesProps {
  contactName: string;
  contactPhone: string;
  brokerName: string;
}

const TEMPLATES = [
  {
    id: "intro",
    label: "Uvodni zprava",
    template:
      "Dobry den, {jmeno}. Jsem {makler} z Carmakler. Zavolam vam ohledne prodeje vaseho vozu.",
  },
  {
    id: "buyer",
    label: "Mam zajemce",
    template:
      "Mam pro vase auto zajemce, zavolam vam zitra s detaily.",
  },
  {
    id: "followup",
    label: "Follow-up",
    template:
      "Jak jste spokojeni? Jsme stale v kontaktu, kdybyste potrebovali cokoliv.",
  },
  {
    id: "price",
    label: "Snizeni ceny",
    template:
      "Doporucujeme snizit cenu vaseho vozu pro rychlejsi prodej.",
  },
];

export function SmsTemplates({
  contactName,
  contactPhone,
  brokerName,
}: SmsTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");

  function handleSelect(templateId: string) {
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    const text = tmpl.template
      .replace("{jmeno}", contactName)
      .replace("{makler}", brokerName);

    setSelectedTemplate(templateId);
    setEditedText(text);
  }

  function handleSend() {
    const encoded = encodeURIComponent(editedText);
    window.open(`sms:${contactPhone}?body=${encoded}`, "_self");
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
        SMS sablony
      </h4>

      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => handleSelect(tmpl.id)}
            className={`p-3 rounded-xl text-left text-sm border-2 transition-all cursor-pointer ${
              selectedTemplate === tmpl.id
                ? "border-orange-500 bg-orange-50"
                : "border-transparent bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <span className="font-semibold text-gray-900">{tmpl.label}</span>
          </button>
        ))}
      </div>

      {selectedTemplate && (
        <Card className="p-4 space-y-3">
          <textarea
            className="w-full text-sm text-gray-700 bg-transparent border-none outline-none resize-y min-h-[80px]"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <Button variant="primary" size="sm" onClick={handleSend}>
            Odeslat SMS
          </Button>
        </Card>
      )}
    </div>
  );
}
