"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCart, getCartTotal, clearCart, onCartChange, type CartItem } from "@/lib/cart";
import { OrderForm, type DeliveryFormData } from "@/components/web/OrderForm";
import { getShippingPrice } from "@/lib/shipping/prices";
import type { DeliveryMethod } from "@/lib/shipping/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const STEP_LABELS = ["Doručení", "Platba", "Potvrzení"];

const paymentMethods = [
  { value: "BANK_TRANSFER", label: "Bankovní převod", desc: "Platba předem na účet" },
  { value: "COD", label: "Dobírka", desc: "Platba při převzetí (+39 Kč)" },
  { value: "CARD", label: "Platba kartou", desc: "Okamžitá platba přes Stripe" },
];

export default function ObjednavkaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [delivery, setDelivery] = useState<DeliveryFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    zip: "",
    note: "",
    deliveryMethod: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [errors, setErrors] = useState<Partial<Record<keyof DeliveryFormData, string>>>({});

  useEffect(() => {
    const refresh = () => {
      setItems(getCart());
      setTotal(getCartTotal());
    };
    refresh();
    return onCartChange(refresh);
  }, []);

  const deliveryPrice = delivery.deliveryMethod
    ? getShippingPrice(delivery.deliveryMethod as DeliveryMethod)
    : 0;
  const codFee = paymentMethod === "COD" ? 39 : 0;
  const grandTotal = total + deliveryPrice + codFee;

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof DeliveryFormData, string>> = {};
    if (!delivery.firstName.trim()) newErrors.firstName = "Vyplňte jméno";
    if (!delivery.lastName.trim()) newErrors.lastName = "Vyplňte příjmení";
    if (!delivery.email.trim() || !delivery.email.includes("@")) newErrors.email = "Vyplňte platný email";
    if (!delivery.phone.trim()) newErrors.phone = "Vyplňte telefon";
    if (!delivery.street.trim()) newErrors.street = "Vyplňte ulici";
    if (!delivery.city.trim()) newErrors.city = "Vyplňte město";
    if (!delivery.zip.trim()) newErrors.zip = "Vyplňte PSČ";
    if (!delivery.deliveryMethod) newErrors.deliveryMethod = "Vyberte způsob doručení";
    if (delivery.deliveryMethod === "ZASILKOVNA" && !delivery.zasilkovnaPoint?.id) {
      newErrors.deliveryMethod = "Vyberte výdejní místo Zásilkovny";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step < 3) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ partId: i.id, quantity: i.quantity })),
          deliveryName: `${delivery.firstName} ${delivery.lastName}`,
          deliveryPhone: delivery.phone,
          deliveryEmail: delivery.email,
          deliveryAddress: delivery.street,
          deliveryCity: delivery.city,
          deliveryZip: delivery.zip,
          deliveryMethod: delivery.deliveryMethod,
          zasilkovnaPointId: delivery.zasilkovnaPoint?.id ?? undefined,
          zasilkovnaPointName: delivery.zasilkovnaPoint?.name ?? undefined,
          paymentMethod,
          note: delivery.note || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        clearCart();
        // Kartová platba — redirect na Stripe Checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        const trackingParam = data.trackingUrl ? `&tracking=${encodeURIComponent(data.trackingUrl)}` : "";
        router.push(`/shop/objednavka/potvrzeni?id=${data.order?.orderNumber ?? data.order?.id}${trackingParam}`);
      } else {
        const errData = await res.json().catch(() => null);
        setSubmitError(
          errData?.error || "Objednávku se nepodařilo odeslat. Zkuste to prosím znovu."
        );
      }
    } catch {
      setSubmitError("Chyba spojení. Zkontrolujte připojení k internetu a zkuste to znovu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Košík je prázdný</h2>
          <p className="text-gray-500 mb-6">Nejdříve přidejte díly do košíku</p>
          <Button variant="primary" onClick={() => router.push("/shop/katalog")}>
            Procházet katalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Objednávka</h1>

          {/* Stepper */}
          <div className="flex items-center gap-3 mt-6">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      i + 1 <= step
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium hidden sm:inline",
                      i + 1 <= step ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 rounded-full",
                      i + 1 < step ? "bg-orange-500" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Step 1: Delivery */}
              {step === 1 && (
                <OrderForm
                  data={delivery}
                  onChange={setDelivery}
                  errors={errors}
                />
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Způsob platby</h3>
                  {paymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        paymentMethod === method.value
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 accent-orange-500"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">{method.label}</div>
                        <div className="text-sm text-gray-500">{method.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900">Shrnutí objednávky</h3>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="font-semibold text-gray-900 mb-2">Doručení</div>
                    <p className="text-gray-600">
                      {delivery.firstName} {delivery.lastName}
                    </p>
                    <p className="text-gray-600">{delivery.street}</p>
                    <p className="text-gray-600">{delivery.zip} {delivery.city}</p>
                    <p className="text-gray-600">{delivery.email} | {delivery.phone}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <div className="font-semibold text-gray-900 mb-2">Platba</div>
                    <p className="text-gray-600">
                      {paymentMethods.find((m) => m.value === paymentMethod)?.label}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="font-semibold text-gray-900">Položky</div>
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error message */}
              {submitError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-700">{submitError}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                {step > 1 ? (
                  <Button variant="outline" onClick={handleBack}>
                    Zpět
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button variant="primary" onClick={handleNext}>
                    Pokračovat
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Odesílám..." : "Odeslat objednávku"}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar summary */}
          <div>
            <Card className="p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Vaše objednávka</h3>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-gray-600 truncate mr-2">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-medium shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="my-3 border-gray-200" />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mezisoučet</span>
                  <span className="font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Doprava</span>
                  <span className="font-medium">
                    {delivery.deliveryMethod ? formatPrice(deliveryPrice) : "—"}
                  </span>
                </div>
                {codFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dobírka</span>
                    <span className="font-medium">{formatPrice(codFee)}</span>
                  </div>
                )}
              </div>

              <hr className="my-3 border-gray-200" />

              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Celkem</span>
                <span className="text-xl font-extrabold text-gray-900">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
