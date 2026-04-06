"use client";

import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ZasilkovnaWidget } from "@/components/web/ZasilkovnaWidget";
import { getShippingMethods } from "@/lib/shipping/prices";
import { formatPrice, cn } from "@/lib/utils";
import type { DeliveryMethod } from "@/lib/shipping/types";

export interface ZasilkovnaPoint {
  id: string;
  name: string;
  address: string;
}

export interface DeliveryFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  note: string;
  deliveryMethod: DeliveryMethod | ""; // Prázdný string = ještě nevybráno
  zasilkovnaPoint?: ZasilkovnaPoint | null;
}

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

  const shippingMethods = getShippingMethods();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900">Doručovací údaje</h3>

      {/* Jméno + Příjmení */}
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

      {/* Email + Telefon */}
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

      {/* Adresa */}
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

      {/* Způsob doručení — radio karty */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Způsob doručení *
        </label>

        {shippingMethods.map((m) => {
          const isSelected = data.deliveryMethod === m.method;
          return (
            <label
              key={m.method}
              className={cn(
                "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                isSelected
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <input
                type="radio"
                name="deliveryMethod"
                value={m.method}
                checked={isSelected}
                onChange={(e) => update("deliveryMethod", e.target.value)}
                className="mt-1 w-5 h-5 accent-orange-500 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden>
                      {m.icon}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{m.label}</div>
                      <div className="text-sm text-gray-500">{m.description}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-gray-900">
                      {m.price === 0 ? "Zdarma" : formatPrice(m.price)}
                    </div>
                    <div className="text-xs text-gray-400">{m.eta}</div>
                  </div>
                </div>

                {/* Zásilkovna widget — jen když je vybraná */}
                {isSelected && m.method === "ZASILKOVNA" && (
                  <div className="mt-3">
                    <ZasilkovnaWidget
                      onSelect={(point) => {
                        onChange({ ...data, zasilkovnaPoint: point });
                      }}
                      selectedPoint={data.zasilkovnaPoint}
                    />
                  </div>
                )}

                {/* PICKUP info box */}
                {isSelected && m.method === "PICKUP" && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                    Objednávku si vyzvednete v sídle CarMakler v Praze.
                    Přesnou adresu a otevírací dobu najdete v potvrzovacím emailu.
                  </div>
                )}
              </div>
            </label>
          );
        })}

        {errors?.deliveryMethod && (
          <p className="text-sm text-red-500 mt-1">{errors.deliveryMethod}</p>
        )}
      </div>

      {/* Poznámka */}
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
