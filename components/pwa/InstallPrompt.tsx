"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const COOLDOWN_KEY = "carmakler-install-dismissed";
const COOLDOWN_DAYS = 7;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check cooldown
    const dismissed = localStorage.getItem(COOLDOWN_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) {
        return;
      }
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  }

  function handleDismiss() {
    localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
    setShowPrompt(false);
    setDeferredPrompt(null);
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">CM</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">
              Nainstalovat CarMakléř Pro
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Přidejte si aplikaci na plochu pro rychlejší přístup a offline
              režim.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Teď ne
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
          >
            Nainstalovat
          </button>
        </div>
      </div>
    </div>
  );
}
