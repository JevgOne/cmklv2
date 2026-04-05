"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import QRCode from "qrcode";

interface BankDetails {
  accountNumber: string;
  iban: string;
  bic: string;
  bankName: string;
  accountHolder: string;
  amount: number;
  variableSymbol: string;
  message: string;
}

export function BankTransferDetails({
  bankDetails,
  vehicleName,
}: {
  bankDetails: BankDetails;
  vehicleName: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const formattedAmount = new Intl.NumberFormat("cs-CZ").format(
    bankDetails.amount
  );

  useEffect(() => {
    // Generování QR kódu pro platbu (SPD formát — Short Payment Descriptor)
    const spdString = [
      "SPD*1.0",
      `ACC:${bankDetails.iban}+${bankDetails.bic}`,
      `AM:${bankDetails.amount}.00`,
      "CC:CZK",
      `X-VS:${bankDetails.variableSymbol}`,
      `MSG:${bankDetails.message}`,
      `RN:${bankDetails.accountHolder}`,
    ].join("*");

    QRCode.toDataURL(spdString, {
      width: 250,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [bankDetails]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-green-600 text-xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Platba vytvořena
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Proveďte bankovní převod podle údajů níže
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <DetailRow label="Vozidlo" value={vehicleName} />
          <DetailRow label="Částka" value={`${formattedAmount} Kč`} bold />
          <DetailRow label="Číslo účtu" value={bankDetails.accountNumber} />
          <DetailRow label="IBAN" value={bankDetails.iban} />
          <DetailRow label="BIC/SWIFT" value={bankDetails.bic} />
          <DetailRow label="Banka" value={bankDetails.bankName} />
          <DetailRow label="Příjemce" value={bankDetails.accountHolder} />
          <DetailRow
            label="Variabilní symbol"
            value={bankDetails.variableSymbol}
            bold
          />
          <DetailRow label="Zpráva" value={bankDetails.message} />
        </div>
      </Card>

      {/* QR kód */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
          QR kód pro platbu
        </h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          Naskenujte QR kód v mobilní bankovní aplikaci
        </p>
        <div className="flex justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR kód pro platbu"
              className="w-[250px] h-[250px]"
            />
          ) : (
            <div className="w-[250px] h-[250px] bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-gray-500">Generování QR...</span>
            </div>
          )}
        </div>
      </Card>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <h4 className="font-semibold text-orange-800 mb-1">
          Co se stane dál?
        </h4>
        <p className="text-sm text-orange-700">
          Po přijetí platby na náš účet (obvykle 1-2 pracovní dny) vás bude
          kontaktovat makléř ohledně předání vozidla. Na email obdržíte
          potvrzení o přijetí platby.
        </p>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => window.print()}
      >
        Vytisknout platební údaje
      </Button>
    </div>
  );
}

function DetailRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-700"} font-mono`}
      >
        {value}
      </span>
    </div>
  );
}
