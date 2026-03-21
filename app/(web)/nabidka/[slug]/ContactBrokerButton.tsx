"use client";

import { Button } from "@/components/ui/Button";

export function ContactBrokerButton() {
  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      onClick={() => {
        const form = document.querySelector("form");
        if (form) {
          form.scrollIntoView({ behavior: "smooth", block: "center" });
          const firstInput = form.querySelector("input");
          if (firstInput) setTimeout(() => firstInput.focus(), 500);
        }
      }}
    >
      <svg
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      Kontaktovat makléře
    </Button>
  );
}
