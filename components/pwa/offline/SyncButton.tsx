"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface SyncButtonProps {
  isOnline: boolean;
  pendingCount: number;
  onSync: () => Promise<void>;
}

export function SyncButton({ isOnline, pendingCount, onSync }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSync = async () => {
    if (!isOnline || syncing || pendingCount === 0) return;

    setSyncing(true);
    setProgress(0);

    // Simulace progressu behem syncu
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 15, 90));
    }, 300);

    try {
      await onSync();
      setProgress(100);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setSyncing(false);
        setProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="primary"
        disabled={!isOnline || syncing || pendingCount === 0}
        onClick={handleSync}
        className="w-full"
      >
        {syncing
          ? "Synchronizuji..."
          : !isOnline
            ? "Jste offline"
            : pendingCount === 0
              ? "Vse synchronizovano"
              : `Synchronizovat (${pendingCount})`}
      </Button>
      {syncing && <ProgressBar value={progress} />}
    </div>
  );
}
