"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareData = { title, url };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-500">Sdílet:</span>
      <Button variant="outline" size="sm" onClick={copyLink}>
        {copied ? "✓ Zkopírováno" : "Kopírovat odkaz"}
      </Button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <Button variant="outline" size="sm" onClick={nativeShare}>
          Sdílet
        </Button>
      )}
    </div>
  );
}
