"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "BLOG", honeypot: "" }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Zkontrolujte svůj email pro potvrzení.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Nepodařilo se přihlásit.");
      }
    } catch {
      setStatus("error");
      setMessage("Chyba sítě. Zkuste to znovu.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-700 font-medium">Zkontrolujte svůj email</p>
        <p className="text-green-600 text-sm mt-1">{message}</p>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
      <h3 className="font-bold text-gray-900 mb-1">Nechte si posílat nové články</h3>
      <p className="text-sm text-gray-500 mb-4">
        Jednou týdně ty nejlepší rady o autech. Žádný spam.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Honeypot — hidden */}
        <input type="text" name="name" className="hidden" tabIndex={-1} autoComplete="off" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vas@email.cz"
          required
          className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300"
        />
        <Button type="submit" size="sm" disabled={status === "loading"}>
          {status === "loading" ? "..." : "Odebírat"}
        </Button>
      </form>
      {status === "error" && (
        <p className="text-red-500 text-xs mt-2">{message}</p>
      )}
      <p className="text-xs text-gray-400 mt-3">
        Odhlásíte se jedním klikem. Vaše data nesdílíme.
      </p>
    </div>
  );
}
