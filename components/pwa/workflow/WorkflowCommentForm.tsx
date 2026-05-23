"use client";

import { useState } from "react";

interface WorkflowCommentFormProps {
  onSubmit: (content: string, isInternal: boolean) => Promise<void>;
  showInternalToggle?: boolean;
  placeholder?: string;
}

export function WorkflowCommentForm({
  onSubmit,
  showInternalToggle = false,
  placeholder = "Napsat komentář...",
}: WorkflowCommentFormProps) {
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), isInternal);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-100 pt-3">
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-300 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="self-end px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
        >
          {submitting ? (
            <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            "Odeslat"
          )}
        </button>
      </div>
      {showInternalToggle && (
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-xs text-gray-500">Interní poznámka (nevidí makléř)</span>
        </label>
      )}
    </div>
  );
}
