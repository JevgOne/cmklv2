"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCart, getCartTotal, clearCart, onCartChange, type CartItem } from "@/lib/cart";
import { OrderForm, type DeliveryFormData } from "@/components/web/OrderForm";
import { getShippingMethods, getShippingPrice } from "@/lib/shipping/prices";
import { ZasilkovnaWidget } from "@/components/web/ZasilkovnaWidget";
import type { ZasilkovnaPoint } from "@/components/web/OrderForm";
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

interface SupplierDelivery {
  deliveryMethod: DeliveryMethod | "";
  zasilkovnaPoint?: ZasilkovnaPoint | null;
}

interface SupplierGroup {
  supplierId: string;
  supplierName: string;
  items: CartItem[];
  subtotal: number;
}

function groupBySupplier(items: CartItem[]): SupplierGroup[] {
  const map = new Map<string, SupplierGroup>();
  for (const item of items) {
    const sid = item.supplierId ?? "unknown";
    let group = map.get(sid);
    if (!group) {
      group = {
        supplierId: sid,
        supplierName: item.supplierName ?? "Dodavatel",
        items: [],
        subtotal: 0,
      };
      map.set(sid, group);
    }
    group.items.push(item);
    group.subtotal += item.price * item.quantity;
  }
  return Array.from(map.values());
}

const RESERVATION_DURATION_MS = 30 * 60 * 1000; // 30 min

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("checkout_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("checkout_session", id);
  }
  return id;
}

export default function DilyObjednavkaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reservation
  const [sessionId] = useState(getSessionId);
  const [reservationExpiry, setReservationExpiry] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [reservationErrors, setReservationErrors] = useState<Record<string, string>>({});
  const itemsRef = useRef(items);
  itemsRef.current = items;

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

  // Per-supplier delivery selection
  const [supplierDeliveries, setSupplierDeliveries] = useState<Record<string, SupplierDelivery>>({});
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Shipping availability (weight/dimension limits)
  const [shippingAvailability, setShippingAvailability] = useState<
    Record<string, { available: boolean; reason?: string }>
  >({});

  useEffect(() => {
    const refresh = () => {
      setItems(getCart());
      setTotal(getCartTotal());
    };
    refresh();
    return onCartChange(refresh);
  }, []);

  // Fetch dostupné dopravní metody (weight/dimension limits)
  useEffect(() => {
    if (items.length === 0) return;
    const fetchAvailability = async () => {
      try {
        const res = await fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ partId: i.id, quantity: i.quantity })),
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const avail: Record<string, { available: boolean; reason?: string }> = {};
        for (const m of data.methods) {
          avail[m.method] = { available: m.available, reason: m.unavailableReason };
        }
        setShippingAvailability(avail);
      } catch {
        // fallback: all available
      }
    };
    fetchAvailability();
  }, [items]);

  // Rezervace dílů při vstupu do checkoutu
  const reserveItems = useCallback(async (cartItems: CartItem[]) => {
    if (!sessionId || cartItems.length === 0) return;
    const errs: Record<string, string> = {};
    let latestExpiry: Date | null = null;

    for (const item of cartItems) {
      try {
        const res = await fetch("/api/parts/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partId: item.id,
            quantity: item.quantity,
            sessionId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const exp = new Date(data.reservation.expiresAt);
          if (!latestExpiry || exp > latestExpiry) latestExpiry = exp;
        } else if (res.status === 409) {
          errs[item.id] = `"${item.name}" je dočasně rezervován jiným zákazníkem.`;
        }
      } catch {
        // network error — cron cleanup je primární mechanismus
      }
    }
    setReservationErrors(errs);
    if (latestExpiry) setReservationExpiry(latestExpiry);
  }, [sessionId]);

  useEffect(() => {
    reserveItems(items);
  }, [items, reserveItems]);

  // Uvolnění rezervací při odchodu z checkoutu (best-effort, cron je primární fallback)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const current = itemsRef.current;
      if (!sessionId || current.length === 0) return;
      for (const item of current) {
        // keepalive fetch s DELETE — funguje i při zavření stránky
        fetch("/api/parts/reserve", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partId: item.id, sessionId }),
          keepalive: true,
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    if (!reservationExpiry) return;
    const tick = () => {
      const remaining = reservationExpiry.getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        router.push("/dily/kosik?expired=1");
        return;
      }
      setTimeLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [reservationExpiry, router]);

  const supplierGroups = useMemo(() => groupBySupplier(items), [items]);
  const isSingleSupplier = supplierGroups.length <= 1;

  // Total shipping = sum of per-supplier shipping
  const totalShippingPrice = useMemo(() => {
    if (isSingleSupplier) {
      return delivery.deliveryMethod ? getShippingPrice(delivery.deliveryMethod as DeliveryMethod) : 0;
    }
    return supplierGroups.reduce((sum, g) => {
      const del = supplierDeliveries[g.supplierId];
      return sum + (del?.deliveryMethod ? getShippingPrice(del.deliveryMethod as DeliveryMethod) : 0);
    }, 0);
  }, [delivery.deliveryMethod, supplierDeliveries, supplierGroups, isSingleSupplier]);

  const codFee = paymentMethod === "COD" ? 39 : 0;
  const grandTotal = total + totalShippingPrice + codFee;

  const shippingMethods = getShippingMethods();

  const updateSupplierDelivery = (supplierId: string, update: Partial<SupplierDelivery>) => {
    setSupplierDeliveries((prev) => ({
      ...prev,
      [supplierId]: { ...prev[supplierId], ...update } as SupplierDelivery,
    }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!delivery.firstName.trim()) newErrors.firstName = "Vyplňte jméno";
    if (!delivery.lastName.trim()) newErrors.lastName = "Vyplňte příjmení";
    if (!delivery.email.trim() || !delivery.email.includes("@")) newErrors.email = "Vyplňte platný email";
    if (!delivery.phone.trim()) newErrors.phone = "Vyplňte telefon";
    if (!delivery.street.trim()) newErrors.street = "Vyplňte ulici";
    if (!delivery.city.trim()) newErrors.city = "Vyplňte město";
    if (!delivery.zip.trim()) newErrors.zip = "Vyplňte PSČ";

    if (isSingleSupplier) {
      if (!delivery.deliveryMethod) newErrors.deliveryMethod = "Vyberte způsob doručení";
      if (delivery.deliveryMethod === "ZASILKOVNA" && !delivery.zasilkovnaPoint?.id) {
        newErrors.deliveryMethod = "Vyberte výdejní místo Zásilkovny";
      }
    } else {
      for (const group of supplierGroups) {
        const del = supplierDeliveries[group.supplierId];
        if (!del?.deliveryMethod) {
          newErrors[`delivery_${group.supplierId}`] = "Vyberte způsob doručení";
        }
        if (del?.deliveryMethod === "ZASILKOVNA" && !del.zasilkovnaPoint?.id) {
          newErrors[`delivery_${group.supplierId}`] = "Vyberte výdejní místo Zásilkovny";
        }
      }
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
    try {
      // Build deliveries array for multi-supplier
      const deliveries = isSingleSupplier
        ? undefined
        : supplierGroups.map((g) => {
            const del = supplierDeliveries[g.supplierId];
            return {
              supplierId: g.supplierId,
              deliveryMethod: del?.deliveryMethod || "ZASILKOVNA",
              zasilkovnaPointId: del?.zasilkovnaPoint?.id,
              zasilkovnaPointName: del?.zasilkovnaPoint?.name,
            };
          });

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
          // Single supplier: backward compat
          ...(isSingleSupplier && {
            deliveryMethod: delivery.deliveryMethod,
            zasilkovnaPointId: delivery.zasilkovnaPoint?.id ?? undefined,
            zasilkovnaPointName: delivery.zasilkovnaPoint?.name ?? undefined,
          }),
          // Multi supplier: new format
          ...(deliveries && { deliveries }),
          paymentMethod,
          sessionId: sessionId || undefined,
          note: delivery.note || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        clearCart();
        setSubmitError(null);
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
        const trackingParam = data.trackingUrl ? `&tracking=${encodeURIComponent(data.trackingUrl)}` : "";
        router.push(`/dily/objednavka/potvrzeni?id=${data.order?.orderNumber ?? data.order?.id ?? "demo"}${trackingParam}`);
      } else {
        const errData = await res.json().catch(() => null);
        setSubmitError(errData?.error ?? "Objednávku se nepodařilo odeslat. Zkuste to prosím znovu.");
      }
    } catch {
      setSubmitError("Chyba připojení. Zkontrolujte internet a zkuste to znovu.");
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
          <Button variant="primary" onClick={() => router.push("/dily/katalog")}>
            Procházet katalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Objednávka</h1>
          <div className="flex items-center gap-3 mt-6">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    i + 1 <= step ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                  )}>
                    {i + 1}
                  </div>
                  <span className={cn(
                    "text-sm font-medium hidden sm:inline",
                    i + 1 <= step ? "text-gray-900" : "text-gray-400"
                  )}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 rounded-full",
                    i + 1 < step ? "bg-orange-500" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reservation timer + errors */}
        {timeLeft !== null && timeLeft > 0 && (
          <div className={cn(
            "mb-4 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2",
            timeLeft <= 5 * 60 * 1000 ? "bg-yellow-50 text-yellow-800 border border-yellow-200" : "bg-blue-50 text-blue-800 border border-blue-200",
          )}>
            <span>Rezervace vyprší za:</span>
            <span className="font-bold tabular-nums">
              {Math.floor(timeLeft / 60000)}:{String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, "0")}
            </span>
          </div>
        )}
        {Object.keys(reservationErrors).length > 0 && (
          <div className="mb-4 rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-800 space-y-1">
            {Object.values(reservationErrors).map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              {step === 1 && (
                <>
                  <OrderForm data={delivery} onChange={setDelivery} errors={errors} hideDeliveryMethod={!isSingleSupplier} shippingAvailability={shippingAvailability} />

                  {/* Per-supplier delivery selection (multi-supplier only) */}
                  {!isSingleSupplier && (
                    <div className="mt-8 space-y-6">
                      <h3 className="text-lg font-bold text-gray-900">Doručení per dodavatel</h3>
                      {supplierGroups.map((group) => {
                        const del = supplierDeliveries[group.supplierId] ?? { deliveryMethod: "" };
                        const errKey = `delivery_${group.supplierId}`;
                        return (
                          <div key={group.supplierId} className="border border-gray-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">{group.supplierName}</span>
                              <span className="text-sm text-gray-500">{formatPrice(group.subtotal)}</span>
                            </div>
                            <div className="text-sm text-gray-500 space-y-0.5">
                              {group.items.map((item) => (
                                <div key={item.id}>{item.name} x{item.quantity}</div>
                              ))}
                            </div>
                            <div className="space-y-2">
                              {shippingMethods.map((m) => {
                                const isSelected = del.deliveryMethod === m.method;
                                const avail = shippingAvailability[m.method];
                                const isDisabled = avail?.available === false;
                                return (
                                  <label key={m.method} className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border transition-all text-sm",
                                    isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                                    isSelected && !isDisabled ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                                  )}>
                                    <input
                                      type="radio"
                                      name={`delivery_${group.supplierId}`}
                                      value={m.method}
                                      checked={isSelected}
                                      disabled={isDisabled}
                                      onChange={() => updateSupplierDelivery(group.supplierId, { deliveryMethod: m.method })}
                                      className="w-4 h-4 accent-orange-500 shrink-0"
                                    />
                                    <div className="flex-1">
                                      <span className="font-medium text-gray-900">{m.label}</span>
                                      {isDisabled && avail?.reason && (
                                        <p className="text-xs text-red-500 mt-0.5">{avail.reason}</p>
                                      )}
                                    </div>
                                    <span className="font-bold text-gray-900">
                                      {m.price === 0 ? "Zdarma" : formatPrice(m.price)}
                                    </span>
                                  </label>
                                );
                              })}
                              {del.deliveryMethod === "ZASILKOVNA" && (
                                <div className="mt-2">
                                  <ZasilkovnaWidget
                                    onSelect={(point) => updateSupplierDelivery(group.supplierId, { zasilkovnaPoint: point })}
                                    selectedPoint={del.zasilkovnaPoint}
                                  />
                                </div>
                              )}
                            </div>
                            {errors[errKey] && (
                              <p className="text-sm text-red-500">{errors[errKey]}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Způsob platby</h3>
                  {paymentMethods.map((method) => (
                    <label
                      key={method.value}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        paymentMethod === method.value ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <input type="radio" name="payment" value={method.value} checked={paymentMethod === method.value} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 accent-orange-500" />
                      <div>
                        <div className="font-semibold text-gray-900">{method.label}</div>
                        <div className="text-sm text-gray-500">{method.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900">Shrnutí objednávky</h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    <div className="font-semibold text-gray-900 mb-2">Doručení</div>
                    <p className="text-gray-600">{delivery.firstName} {delivery.lastName}</p>
                    <p className="text-gray-600">{delivery.street}</p>
                    <p className="text-gray-600">{delivery.zip} {delivery.city}</p>
                    <p className="text-gray-600">{delivery.email} | {delivery.phone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm">
                    <div className="font-semibold text-gray-900 mb-2">Platba</div>
                    <p className="text-gray-600">{paymentMethods.find((m) => m.value === paymentMethod)?.label}</p>
                  </div>
                  {/* Per-supplier summary */}
                  {supplierGroups.map((group) => {
                    const del = isSingleSupplier
                      ? { deliveryMethod: delivery.deliveryMethod }
                      : supplierDeliveries[group.supplierId] ?? { deliveryMethod: "" };
                    const shipPrice = del.deliveryMethod ? getShippingPrice(del.deliveryMethod as DeliveryMethod) : 0;
                    const methodLabel = shippingMethods.find((m) => m.method === del.deliveryMethod)?.label ?? "";
                    return (
                      <div key={group.supplierId} className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                        <div className="font-semibold text-gray-900">{group.supplierName}</div>
                        {group.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span className="text-gray-600">{item.name} x {item.quantity}</span>
                            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-gray-500">
                          <span>Doprava: {methodLabel}</span>
                          <span className="font-medium">{shipPrice === 0 ? "Zdarma" : formatPrice(shipPrice)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {submitError && (
                <div className="mt-4 rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-800">
                  {submitError}
                </div>
              )}

              <div className="flex justify-between mt-8">
                {step > 1 ? <Button variant="outline" onClick={handleBack}>Zpět</Button> : <div />}
                {step < 3 ? (
                  <Button variant="primary" onClick={handleNext}>Pokračovat</Button>
                ) : (
                  <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Odesílám..." : "Odeslat objednávku"}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Vaše objednávka</h3>
              {/* Per-supplier breakdown */}
              {supplierGroups.map((group) => {
                const del = isSingleSupplier
                  ? { deliveryMethod: delivery.deliveryMethod }
                  : supplierDeliveries[group.supplierId] ?? { deliveryMethod: "" };
                const shipPrice = del.deliveryMethod ? getShippingPrice(del.deliveryMethod as DeliveryMethod) : 0;
                const methodLabel = shippingMethods.find((m) => m.method === del.deliveryMethod)?.label;
                return (
                  <div key={group.supplierId} className="mb-3">
                    {!isSingleSupplier && (
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {group.supplierName} {methodLabel ? `(${methodLabel})` : ""}
                      </div>
                    )}
                    <div className="space-y-1 text-sm">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span className="text-gray-600 truncate mr-2">{item.name} x{item.quantity}</span>
                          <span className="font-medium shrink-0">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {!isSingleSupplier && del.deliveryMethod && (
                        <div className="flex justify-between text-gray-400">
                          <span>Doprava</span>
                          <span>{shipPrice === 0 ? "Zdarma" : formatPrice(shipPrice)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <hr className="my-3 border-gray-200" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mezisoučet</span>
                  <span className="font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Doprava</span>
                  <span className="font-medium">{totalShippingPrice > 0 ? formatPrice(totalShippingPrice) : "—"}</span>
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
                <span className="text-xl font-extrabold text-gray-900">{formatPrice(grandTotal)}</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
