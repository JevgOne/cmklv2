"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  part: { name: string };
}

interface ReturnFormProps {
  order: {
    id: string;
    orderNumber: string;
    deliveryName: string;
    deliveryEmail: string;
    deliveredAt: string | null;
    items: OrderItem[];
  };
}

export function ReturnForm({ order }: ReturnFormProps) {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [contactName, setContactName] = useState(order.deliveryName || "");
  const [contactEmail, setContactEmail] = useState(order.deliveryEmail || "");
  const [bankAccount, setBankAccount] = useState("");

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: maxQty };
    });
  };

  const totalRefund = order.items
    .filter((i) => selectedItems[i.id])
    .reduce((sum, i) => sum + i.unitPrice * (selectedItems[i.id] || 0), 0);

  const daysLeft = order.deliveredAt
    ? Math.max(0, 14 - Math.floor((Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleSubmit = async () => {
    if (Object.keys(selectedItems).length === 0 || reason.length < 10) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WITHDRAWAL",
          items: Object.entries(selectedItems).map(([orderItemId, quantity]) => ({
            orderItemId,
            quantity,
          })),
          reason,
          contactName,
          contactEmail,
          bankAccount: bankAccount || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Chyba při odesílání");
      }
    } catch {
      setError("Nepodařilo se odeslat žádost");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">&#10003;</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Žádost odeslána</h2>
          <p className="text-gray-500 mb-6">Vaši žádost o vrácení zpracujeme do 30 dní. O průběhu vás budeme informovat emailem.</p>
          <Button variant="primary" onClick={() => router.push("/shop/moje-objednavky")}>Zpět na objednávky</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Vrácení zboží</h1>
          <p className="text-gray-500 mt-1">Objednávka #{order.orderNumber}</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {daysLeft !== null && (
          <Alert variant={daysLeft > 3 ? "info" : "warning"}>
            <span className="text-sm">
              Zbývá {daysLeft} {daysLeft === 1 ? "den" : daysLeft < 5 ? "dny" : "dní"} pro odstoupení od smlouvy (14denní lhůta dle §1829 OZ).
            </span>
          </Alert>
        )}

        {error && <Alert variant="error"><span className="text-sm">{error}</span></Alert>}

        <Card className="p-6">
          <h3 className="font-bold text-gray-900 mb-4">Vyberte položky k vrácení</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <label key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={!!selectedItems[item.id]}
                  onChange={() => toggleItem(item.id, item.quantity)}
                  className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.part.name}</p>
                  <p className="text-xs text-gray-500">{item.quantity}x {formatPrice(item.unitPrice)}</p>
                </div>
                <span className="font-semibold text-gray-900">{formatPrice(item.totalPrice)}</span>
              </label>
            ))}
          </div>
          {totalRefund > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
              <span className="font-medium text-gray-700">K vrácení:</span>
              <span className="text-lg font-extrabold text-orange-500">{formatPrice(totalRefund)}</span>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <Textarea
            label="Důvod vrácení *"
            placeholder="Popište proč chcete zboží vrátit (min. 10 znaků)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </Card>

        <Card className="p-6 space-y-4">
          <Input label="Jméno *" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
          <Input label="Email *" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
          <Input label="IBAN pro vrácení peněz" placeholder="CZ..." value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
        </Card>

        <p className="text-sm text-gray-500 text-center">
          Podrobnosti naleznete v{" "}
          <Link href="/reklamacni-rad" className="text-orange-500 hover:underline">reklamačním řádu</Link>.
        </p>

        <Button
          variant="primary"
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting || Object.keys(selectedItems).length === 0 || reason.length < 10 || !contactName || !contactEmail}
        >
          {submitting ? "Odesílám..." : "Odeslat žádost o vrácení"}
        </Button>
      </div>
    </div>
  );
}
