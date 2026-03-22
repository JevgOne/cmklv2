"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { WizardData } from "../ContractWizard";

interface DetailsStepProps {
  data: WizardData;
  brokerName: string;
  onUpdate: (updates: Partial<WizardData>) => void;
  onNext: () => void;
}

interface FormValues {
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerAddress: string;
  sellerIdNumber: string;
  sellerIdCard: string;
  sellerBankAccount: string;
  price: number;
  commission: number;
}

export function DetailsStep({
  data,
  brokerName,
  onUpdate,
  onNext,
}: DetailsStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      sellerName: data.sellerName,
      sellerPhone: data.sellerPhone,
      sellerEmail: data.sellerEmail,
      sellerAddress: data.sellerAddress,
      sellerIdNumber: data.sellerIdNumber,
      sellerIdCard: data.sellerIdCard,
      sellerBankAccount: data.sellerBankAccount,
      price: data.price,
      commission: data.commission,
    },
  });

  const onSubmit = (values: FormValues) => {
    onUpdate(values);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
      {/* Vozidlo info */}
      {data.vehicle && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Vozidlo
          </h3>
          <p className="font-bold text-gray-900">
            {data.vehicle.brand} {data.vehicle.model}{" "}
            {data.vehicle.variant || ""} ({data.vehicle.year})
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            VIN: {data.vehicle.vin}
          </p>
        </div>
      )}

      {/* Makléř */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Makléř
        </h3>
        <p className="font-bold text-gray-900">{brokerName}</p>
      </div>

      {/* Prodejce */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Údaje prodejce
        </h3>

        <Input
          label="Jméno a příjmení *"
          {...register("sellerName", {
            required: "Jméno prodejce je povinné",
          })}
          error={errors.sellerName?.message}
          placeholder="Jan Novák"
        />

        <Input
          label="Telefon *"
          {...register("sellerPhone", {
            required: "Telefon je povinný",
          })}
          error={errors.sellerPhone?.message}
          placeholder="+420 xxx xxx xxx"
          type="tel"
        />

        <Input
          label="Email"
          {...register("sellerEmail")}
          placeholder="jan@example.cz"
          type="email"
        />

        <Input
          label="Adresa"
          {...register("sellerAddress")}
          placeholder="Ulice 123, Praha"
        />

        <Input
          label="Rodné číslo"
          {...register("sellerIdNumber")}
          placeholder="xxxxxx/xxxx"
        />

        <Input
          label="Číslo občanského průkazu"
          {...register("sellerIdCard")}
          placeholder="Číslo OP"
        />

        <Input
          label="Číslo bankovního účtu"
          {...register("sellerBankAccount")}
          placeholder="xxxx-xxxxxxxxxx/xxxx"
        />
      </div>

      {/* Cena a provize */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Cena a provize
        </h3>

        <Input
          label="Prodejní cena (Kč) *"
          {...register("price", {
            required: "Cena je povinná",
            valueAsNumber: true,
            min: { value: 1, message: "Cena musí být kladná" },
          })}
          error={errors.price?.message}
          type="number"
          placeholder="0"
        />

        <Input
          label="Provize makléře (Kč)"
          {...register("commission", { valueAsNumber: true })}
          type="number"
          placeholder="0"
        />
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 -mx-6 px-6 py-4 mt-6">
        <Button type="submit" variant="primary" className="w-full">
          Pokračovat na náhled
        </Button>
      </div>
    </form>
  );
}
