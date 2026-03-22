"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export interface DeliveryFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  note: string;
  deliveryMethod: string;
}

const deliveryOptions = [
  { value: "ZASILKOVNA", label: "Zásilkovna — 79 Kč" },
  { value: "PPL", label: "PPL — 129 Kč" },
  { value: "CESKA_POSTA", label: "Česká pošta — 99 Kč" },
  { value: "PICKUP", label: "Osobní odběr — Zdarma" },
];

export function OrderForm({
  data,
  onChange,
  errors,
}: {
  data: DeliveryFormData;
  onChange: (data: DeliveryFormData) => void;
  errors?: Partial<Record<keyof DeliveryFormData, string>>;
}) {
  const update = (field: keyof DeliveryFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Doručovací údaje</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Jméno *"
          value={data.firstName}
          onChange={(e) => update("firstName", e.target.value)}
          error={errors?.firstName}
          placeholder="Jan"
        />
        <Input
          label="Příjmení *"
          value={data.lastName}
          onChange={(e) => update("lastName", e.target.value)}
          error={errors?.lastName}
          placeholder="Novák"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email *"
          type="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors?.email}
          placeholder="jan@email.cz"
        />
        <Input
          label="Telefon *"
          type="tel"
          value={data.phone}
          onChange={(e) => update("phone", e.target.value)}
          error={errors?.phone}
          placeholder="+420 777 123 456"
        />
      </div>

      <Input
        label="Ulice a číslo *"
        value={data.street}
        onChange={(e) => update("street", e.target.value)}
        error={errors?.street}
        placeholder="Hlavní 123"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Město *"
          value={data.city}
          onChange={(e) => update("city", e.target.value)}
          error={errors?.city}
          placeholder="Praha"
        />
        <Input
          label="PSČ *"
          value={data.zip}
          onChange={(e) => update("zip", e.target.value)}
          error={errors?.zip}
          placeholder="110 00"
        />
      </div>

      <Select
        label="Způsob doručení *"
        value={data.deliveryMethod}
        onChange={(e) => update("deliveryMethod", e.target.value)}
        options={deliveryOptions}
        placeholder="Vyberte způsob doručení"
        error={errors?.deliveryMethod}
      />

      <Textarea
        label="Poznámka k objednávce"
        value={data.note}
        onChange={(e) => update("note", e.target.value)}
        placeholder="Volitelná poznámka..."
        className="min-h-[80px]"
      />
    </div>
  );
}
