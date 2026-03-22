"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmailSendModal } from "./EmailSendModal";
import type { EmailTemplateType } from "@/lib/validators/email";

interface EmailButtonProps {
  vehicleId?: string;
  vehicleName?: string;
  defaultTemplate?: EmailTemplateType;
  defaultRecipientEmail?: string;
  defaultRecipientName?: string;
  label?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function EmailButton({
  vehicleId,
  vehicleName,
  defaultTemplate,
  defaultRecipientEmail,
  defaultRecipientName,
  label = "Poslat email",
  variant = "outline",
  size = "default",
  className,
}: EmailButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
          <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
        </svg>
        {label}
      </Button>
      <EmailSendModal
        open={open}
        onClose={() => setOpen(false)}
        vehicleId={vehicleId}
        vehicleName={vehicleName}
        defaultTemplate={defaultTemplate}
        defaultRecipientEmail={defaultRecipientEmail}
        defaultRecipientName={defaultRecipientName}
      />
    </>
  );
}
