"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const profileSchema = z.object({
  firstName: z.string().min(1, "Jméno je povinné").max(50),
  lastName: z.string().min(1, "Příjmení je povinné").max(50),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  defaultValues: {
    firstName: string;
    lastName: string;
    phone: string | null;
    bio: string | null;
  };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: defaultValues.firstName,
      lastName: defaultValues.lastName,
      phone: defaultValues.phone ?? "",
      bio: defaultValues.bio ?? "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/broker/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profil byl uložen." });
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Nepodařilo se uložit profil." });
      }
    } catch {
      setMessage({ type: "error", text: "Chyba připojení. Zkuste to znovu." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {message && (
        <Alert variant={message.type === "success" ? "success" : "error"}>
          {message.text}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Jméno"
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <Input
          label="Příjmení"
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>

      <Input
        label="Telefon"
        type="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />

      <Textarea
        label="O mne"
        placeholder="Krátký popis vaší specializace..."
        error={errors.bio?.message}
        {...register("bio")}
      />

      <Button
        type="submit"
        variant="primary"
        disabled={saving || !isDirty}
        className="w-full"
      >
        {saving ? "Ukládám..." : "Uložit změny"}
      </Button>
    </form>
  );
}
