"use client";

import { useState } from "react";
import type { InquiryData } from "./InquiryCard";

interface InquiryReplyModalProps {
  inquiry: InquiryData;
  onClose: () => void;
  onSubmit: (id: string, reply: string) => Promise<void>;
}

export function InquiryReplyModal({ inquiry, onClose, onSubmit }: InquiryReplyModalProps) {
  const [reply, setReply] = useState(inquiry.reply || "");
  const [loading, setLoading] = useState(false);

  const vehicleName = `${inquiry.listing.brand} ${inquiry.listing.model} ${inquiry.listing.year}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    try {
      await onSubmit(inquiry.id, reply.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Odpovědět na poptávku</h3>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              &times;
            </button>
          </div>

          {/* Inquiry context */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-gray-900">{inquiry.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{vehicleName}</div>
            <p className="text-sm text-gray-600 mt-2">{inquiry.message}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-1">
              Vaše odpověď
            </label>
            <textarea
              id="reply"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none"
              placeholder="Napište odpověď..."
              required
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={loading || !reply.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
              >
                {loading ? "Odesílám..." : "Odeslat odpověď"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
