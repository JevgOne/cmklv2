"use client";

import { useState, useEffect, useCallback } from "react";
import { InquiryCard, type InquiryData } from "./InquiryCard";
import { InquiryReplyModal } from "./InquiryReplyModal";

const TABS = [
  { key: "new", label: "Nové", statuses: "NEW,READ" },
  { key: "replied", label: "Rozpracované", statuses: "REPLIED" },
  { key: "viewing", label: "Prohlídky", statuses: "VIEWING" },
  { key: "closed", label: "Uzavřené", statuses: "SOLD,CLOSED,NO_INTEREST" },
] as const;

interface InboxData {
  inquiries: InquiryData[];
  total: number;
  page: number;
  totalPages: number;
}

export function DealerInquiryInbox() {
  const [activeTab, setActiveTab] = useState("new");
  const [data, setData] = useState<InboxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [replyTarget, setReplyTarget] = useState<InquiryData | null>(null);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    const tab = TABS.find((t) => t.key === activeTab);
    const params = new URLSearchParams({
      status: tab?.statuses || "",
      page: String(page),
      ...(search && { search }),
    });

    try {
      const res = await fetch(`/api/dealer/inquiries?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search]);

  // Fetch tab counts
  const fetchCounts = useCallback(async () => {
    const counts: Record<string, number> = {};
    await Promise.all(
      TABS.map(async (tab) => {
        const res = await fetch(`/api/dealer/inquiries?status=${tab.statuses}&limit=1`);
        if (res.ok) {
          const json = await res.json();
          counts[tab.key] = json.total;
        }
      })
    );
    setTabCounts(counts);
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  async function handleReply(id: string, reply: string) {
    const res = await fetch(`/api/dealer/inquiries/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    if (res.ok) {
      fetchInquiries();
      fetchCounts();
    }
  }

  async function handleStatusChange(id: string, status: string, viewingDate?: string) {
    const res = await fetch(`/api/dealer/inquiries/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, viewingDate }),
    });
    if (res.ok) {
      fetchInquiries();
      fetchCounts();
    }
  }

  async function handleNoteChange(id: string, note: string, priority?: string) {
    const res = await fetch(`/api/dealer/inquiries/${id}/note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, priority }),
    });
    if (res.ok) {
      fetchInquiries();
    }
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Hledat podle jména, emailu, telefonu..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tabCounts[tab.key] != null && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                tab.key === "new" && tabCounts[tab.key] > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Načítám poptávky...</div>
        ) : !data || data.inquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {search ? "Žádné poptávky pro tento filtr" : "Žádné poptávky v této kategorii"}
          </div>
        ) : (
          <>
            {data.inquiries.map((inq) => (
              <InquiryCard
                key={inq.id}
                inquiry={inq}
                onReply={setReplyTarget}
                onStatusChange={handleStatusChange}
                onNoteChange={handleNoteChange}
              />
            ))}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {data.total} poptávek celkem
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
                  >
                    &larr;
                  </button>
                  <span className="px-3 py-1 text-xs text-gray-600">
                    {data.page} / {data.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
                  >
                    &rarr;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reply modal */}
      {replyTarget && (
        <InquiryReplyModal
          inquiry={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSubmit={handleReply}
        />
      )}
    </div>
  );
}
