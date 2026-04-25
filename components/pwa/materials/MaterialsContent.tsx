"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

export function MaterialsContent() {
  const [signatureHtml, setSignatureHtml] = useState<string | null>(null);
  const [signatureText, setSignatureText] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function loadSignature() {
    const res = await fetch("/api/materials/email-signature");
    if (res.ok) {
      const data = await res.json();
      setSignatureHtml(data.html);
      setSignatureText(data.text);
    }
  }

  async function copyToClipboard(text: string, type: string) {
    try {
      if (type === "html" && signatureHtml) {
        const blob = new Blob([signatureHtml], { type: "text/html" });
        const textBlob = new Blob([signatureText || ""], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blob,
            "text/plain": textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Moje materiály</h1>
      <p className="text-sm text-gray-500 mb-6">
        Personalizované materiály pro vaši práci
      </p>

      {/* Email signature */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg">
            ✉️
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Email podpis</h2>
            <p className="text-xs text-gray-500">Zkopírujte do emailového klienta</p>
          </div>
        </div>

        {!signatureHtml ? (
          <button
            onClick={loadSignature}
            className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors"
          >
            Načíst podpis
          </button>
        ) : (
          <div>
            <div
              className="border border-gray-200 rounded-xl p-4 mb-3 bg-white"
              dangerouslySetInnerHTML={{ __html: signatureHtml }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(signatureHtml, "html")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  copied === "html"
                    ? "bg-green-500 text-white"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {copied === "html" ? "Zkopírováno!" : "Kopírovat HTML"}
              </button>
              <button
                onClick={() => copyToClipboard(signatureText || "", "text")}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  copied === "text"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {copied === "text" ? "Zkopírováno!" : "Kopírovat text"}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Business Card */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg">
            🪪
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Vizitka</h2>
            <p className="text-xs text-gray-500">4 vizitky na A4, připraveno k tisku</p>
          </div>
        </div>
        <a
          href="/api/materials/business-card"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold text-center hover:bg-blue-600 transition-colors"
        >
          Otevřít a vytisknout
        </a>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Otevře se v novém okně — použijte Ctrl+P pro tisk
        </p>
      </Card>

      {/* Sales Presentation */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg">
            📊
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Obchodní prezentace</h2>
            <p className="text-xs text-gray-500">Personalizovaná prezentace s vaším jménem a kontaktem</p>
          </div>
        </div>
        <a
          href="/api/materials/sales-presentation"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold text-center hover:bg-purple-600 transition-colors"
        >
          Otevřít prezentaci
        </a>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Otevře se HTML prezentace — můžete tisknout nebo uložit jako PDF
        </p>
      </Card>

      {/* Info */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="text-xs text-orange-700 leading-relaxed">
          <strong>Tip:</strong> Všechny materiály jsou automaticky personalizované s vašimi údaji z profilu.
          Aktualizujte si <a href="/makler/profile" className="underline font-semibold">profil</a> pro aktuální informace.
        </p>
      </div>
    </div>
  );
}
