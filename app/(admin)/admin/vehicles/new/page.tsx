"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

// ============================================
// Data
// ============================================

const CAR_BRANDS: Record<string, string[]> = {
  "Škoda": ["Octavia", "Fabia", "Superb", "Kodiaq", "Karoq", "Kamiq", "Scala", "Rapid", "Citigo", "Yeti", "Enyaq", "Roomster"],
  "Volkswagen": ["Golf", "Passat", "Tiguan", "Polo", "T-Roc", "Touran", "Touareg", "Arteon", "ID.3", "ID.4", "Caddy", "Up!"],
  "BMW": ["3 Series", "5 Series", "1 Series", "X1", "X3", "X5", "X6", "7 Series", "4 Series", "2 Series", "i3", "i4"],
  "Audi": ["A3", "A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8", "TT", "e-tron", "A5", "A1"],
  "Mercedes-Benz": ["C-Class", "E-Class", "A-Class", "GLC", "GLE", "CLA", "S-Class", "GLA", "GLB", "B-Class", "V-Class"],
  "Ford": ["Focus", "Fiesta", "Mondeo", "Kuga", "Puma", "EcoSport", "Ranger", "Transit", "Mustang", "Galaxy", "S-MAX"],
  "Toyota": ["Corolla", "Yaris", "RAV4", "C-HR", "Camry", "Hilux", "Land Cruiser", "Aygo", "Avensis", "Auris", "Prius"],
  "Hyundai": ["Tucson", "i30", "i20", "Kona", "Santa Fe", "i10", "Ioniq", "Bayon", "i40", "ix35"],
  "Kia": ["Sportage", "Ceed", "Stonic", "Niro", "Sorento", "Picanto", "XCeed", "ProCeed", "Rio", "EV6"],
  "Peugeot": ["308", "208", "3008", "5008", "2008", "508", "Partner", "Rifter", "e-208"],
  "Renault": ["Clio", "Megane", "Captur", "Kadjar", "Scenic", "Talisman", "Kangoo", "Arkana", "Zoe"],
  "Citroën": ["C3", "C4", "C5 Aircross", "Berlingo", "C3 Aircross", "C1", "C-Elysée"],
  "Opel": ["Astra", "Corsa", "Mokka", "Crossland", "Grandland", "Insignia", "Zafira", "Combo"],
  "Mazda": ["CX-5", "3", "6", "CX-3", "CX-30", "MX-5", "2", "CX-60"],
  "Honda": ["Civic", "CR-V", "HR-V", "Jazz", "Accord"],
  "Nissan": ["Qashqai", "Juke", "Micra", "X-Trail", "Leaf", "Navara"],
  "Volvo": ["XC60", "XC40", "XC90", "V60", "S60", "V40", "S90", "V90"],
  "Dacia": ["Duster", "Sandero", "Logan", "Spring", "Jogger"],
  "Seat": ["Leon", "Ibiza", "Ateca", "Arona", "Tarraco", "Alhambra"],
  "Fiat": ["500", "Panda", "Tipo", "500X", "500L", "Punto", "Ducato"],
  "Suzuki": ["Vitara", "Swift", "SX4 S-Cross", "Jimny", "Ignis"],
  "Mitsubishi": ["Outlander", "ASX", "Eclipse Cross", "L200", "Space Star"],
  "Jeep": ["Compass", "Renegade", "Wrangler", "Grand Cherokee"],
  "Land Rover": ["Range Rover Evoque", "Discovery Sport", "Range Rover Sport", "Defender"],
  "Porsche": ["Cayenne", "Macan", "911", "Panamera", "Taycan"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X"],
};

const BRAND_NAMES = Object.keys(CAR_BRANDS);

const FUEL_TYPES = [
  { value: "PETROL", label: "Benzín" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Elektro" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "PLUGIN_HYBRID", label: "Plug-in Hybrid" },
  { value: "LPG", label: "LPG" },
  { value: "CNG", label: "CNG" },
];

const TRANSMISSIONS = [
  { value: "MANUAL", label: "Manuální" },
  { value: "AUTOMATIC", label: "Automatická" },
  { value: "DSG", label: "DSG" },
  { value: "CVT", label: "CVT" },
];

const BODY_TYPES = [
  { value: "SEDAN", label: "Sedan" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "COMBI", label: "Kombi" },
  { value: "SUV", label: "SUV" },
  { value: "COUPE", label: "Coupé" },
  { value: "CABRIO", label: "Kabriolet" },
  { value: "VAN", label: "Van" },
  { value: "PICKUP", label: "Pickup" },
];

const CONDITIONS = [
  { value: "NEW", label: "Nové" },
  { value: "LIKE_NEW", label: "Jako nové" },
  { value: "EXCELLENT", label: "Výborný stav" },
  { value: "GOOD", label: "Dobrý stav" },
  { value: "FAIR", label: "Uspokojivý" },
  { value: "DAMAGED", label: "Poškozené" },
];

const ENGINE_POWERS = [55, 66, 75, 81, 85, 90, 96, 100, 103, 110, 115, 120, 125, 130, 135, 140, 147, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 270, 290, 300, 320, 350, 370, 400];
const ENGINE_CAPACITIES = [999, 1197, 1242, 1395, 1498, 1560, 1598, 1781, 1798, 1896, 1968, 1984, 1995, 2143, 2179, 2497, 2698, 2967, 2979, 2993, 3498, 3996, 4395, 4999];

const COLORS = ["Bílá", "Černá", "Stříbrná", "Šedá", "Modrá", "Červená", "Zelená", "Hnědá", "Béžová", "Oranžová", "Žlutá", "Zlatá", "Fialová"];
const CITIES = ["Praha", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "Hradec Králové", "České Budějovice", "Ústí nad Labem", "Pardubice", "Zlín", "Karlovy Vary", "Jihlava"];

const STEPS = ["VIN kód", "Údaje vozidla", "Kontakt a cena", "Souhrn"];

const selectClass = "w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 focus:border-orange-500 focus:bg-white focus:outline-none transition-colors";
const inputClass = "w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:outline-none transition-colors";
const labelClass = "text-[13px] font-semibold text-gray-700 uppercase tracking-wide block mb-2";

// ============================================
// Main Component
// ============================================

export default function AdminNewVehiclePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinDecoded, setVinDecoded] = useState(false);
  const [customBrand, setCustomBrand] = useState(false);
  const [customModel, setCustomModel] = useState(false);

  const [form, setForm] = useState({
    vin: "",
    brand: "",
    model: "",
    variant: "",
    year: new Date().getFullYear(),
    mileage: 0,
    fuelType: "",
    transmission: "",
    bodyType: "",
    condition: "",
    price: 0,
    enginePower: "",
    engineCapacity: "",
    color: "",
    description: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    city: "Praha",
  });

  const modelOptions = useMemo(() => {
    if (!form.brand || customBrand) return [];
    return CAR_BRANDS[form.brand] || [];
  }, [form.brand, customBrand]);

  const years = useMemo(() => {
    const arr = [];
    for (let y = new Date().getFullYear() + 1; y >= 1990; y--) arr.push(y);
    return arr;
  }, []);

  const setField = useCallback((field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // VIN Decode
  const handleVinDecode = useCallback(async () => {
    if (form.vin.length !== 17) return;
    setVinLoading(true);
    setVinDecoded(false);
    try {
      const res = await fetch(`/api/vin/decode?vin=${form.vin}`);
      if (res.ok) {
        const { data, manual } = await res.json();
        if (data.brand) {
          const match = BRAND_NAMES.find((b) => b.toLowerCase() === data.brand.toLowerCase());
          if (match) {
            setField("brand", match);
            setCustomBrand(false);
          } else {
            setField("brand", data.brand);
            setCustomBrand(true);
          }
        }
        if (data.model) { setField("model", data.model); setCustomModel(true); }
        if (data.year) setField("year", data.year);
        if (data.fuelType) setField("fuelType", data.fuelType);
        if (data.transmission) setField("transmission", data.transmission);
        if (data.bodyType) setField("bodyType", data.bodyType);
        if (data.enginePower) setField("enginePower", String(data.enginePower));
        if (data.engineCapacity) setField("engineCapacity", String(data.engineCapacity));
        setVinDecoded(!manual);
      }
    } catch {
      // VIN decode selhal
    } finally {
      setVinLoading(false);
    }
  }, [form.vin, setField]);

  // Submit
  const handleSubmit = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          enginePower: form.enginePower ? parseInt(form.enginePower, 10) : null,
          engineCapacity: form.engineCapacity ? parseInt(form.engineCapacity, 10) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Nepodařilo se vytvořit vozidlo");
        setLoading(false);
        return;
      }
      const data = await res.json();
      router.push(`/admin/vehicles/${data.vehicle.id}`);
    } catch {
      setError("Chyba spojení se serverem");
      setLoading(false);
    }
  }, [form, router]);

  // Validace per step
  const canNext = useMemo(() => {
    switch (step) {
      case 0: return form.vin.length === 17;
      case 1: return !!form.brand && !!form.model && !!form.fuelType && !!form.transmission && !!form.condition;
      case 2: return form.price > 0 && !!form.city;
      case 3: return true;
      default: return false;
    }
  }, [step, form]);

  const fuelLabel = FUEL_TYPES.find((f) => f.value === form.fuelType)?.label;
  const transLabel = TRANSMISSIONS.find((t) => t.value === form.transmission)?.label;
  const bodyLabel = BODY_TYPES.find((b) => b.value === form.bodyType)?.label;
  const condLabel = CONDITIONS.find((c) => c.value === form.condition)?.label;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/vehicles")}
          className="text-sm text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer mb-2 block"
        >
          &larr; Zpět na vozidla
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Přidat vozidlo</h1>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all shrink-0 ${
                i === step
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                  : i < step
                  ? "bg-emerald-500 text-white cursor-pointer"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {i < step ? (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : i + 1}
            </button>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-gray-900" : "text-gray-400"}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-emerald-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 mb-6">
          {error}
        </div>
      )}

      {/* =========================================== */}
      {/* STEP 0: VIN */}
      {/* =========================================== */}
      {step === 0 && (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">VIN kód vozidla</h2>
            <p className="text-sm text-gray-500">
              Zadejte 17místný VIN kód. Systém automaticky vyplní údaje o vozidle.
            </p>
          </div>

          <div>
            <label className={labelClass}>VIN</label>
            <input
              type="text"
              value={form.vin}
              onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
                setField("vin", v);
                setVinDecoded(false);
              }}
              placeholder="Např. WAUZZZ8R9HA055618"
              maxLength={17}
              className={inputClass + " font-mono text-lg tracking-[3px]"}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400 font-mono">{form.vin.length} / 17</span>
              {form.vin.length === 17 && (
                <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Platný formát
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleVinDecode}
            disabled={form.vin.length !== 17 || vinLoading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {vinLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Dekóduji VIN...
              </>
            ) : vinDecoded ? (
              <>
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Dekódováno — upravit údaje v dalším kroku
              </>
            ) : (
              "Dekódovat VIN"
            )}
          </button>

          {vinDecoded && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-800 mb-2">Rozpoznáno z VIN:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {form.brand && <InfoChip label="Značka" value={form.brand} />}
                {form.model && <InfoChip label="Model" value={form.model} />}
                {form.year && <InfoChip label="Rok" value={String(form.year)} />}
                {fuelLabel && <InfoChip label="Palivo" value={fuelLabel} />}
                {transLabel && <InfoChip label="Převodovka" value={transLabel} />}
                {bodyLabel && <InfoChip label="Karoserie" value={bodyLabel} />}
                {form.enginePower && <InfoChip label="Výkon" value={`${form.enginePower} kW`} />}
                {form.engineCapacity && <InfoChip label="Objem" value={`${form.engineCapacity} ccm`} />}
              </div>
            </div>
          )}

          {/* Kde najít VIN */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-2">Kde najít VIN?</p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li><strong>1.</strong> Dveřní sloupek řidiče — štítek na rámu</li>
              <li><strong>2.</strong> Palubní deska — viditelné přes čelní sklo</li>
              <li><strong>3.</strong> Technický průkaz — pole E</li>
            </ul>
          </div>
        </Card>
      )}

      {/* =========================================== */}
      {/* STEP 1: Údaje vozidla */}
      {/* =========================================== */}
      {step === 1 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Základní údaje</h2>
            <div className="space-y-4">
              {/* Značka */}
              <div>
                <label className={labelClass}>Značka *</label>
                {customBrand ? (
                  <div className="flex gap-2">
                    <input type="text" value={form.brand} onChange={(e) => setField("brand", e.target.value)} placeholder="Zadejte značku" className={inputClass} />
                    <button type="button" onClick={() => { setCustomBrand(false); setField("brand", ""); setField("model", ""); setCustomModel(false); }} className="px-3 text-xs text-orange-600 hover:text-orange-700 shrink-0 font-medium">Seznam</button>
                  </div>
                ) : (
                  <select value={form.brand} onChange={(e) => { const v = e.target.value; if (v === "__custom__") { setCustomBrand(true); setField("brand", ""); } else { setField("brand", v); setField("model", ""); setCustomModel(false); }}} className={selectClass}>
                    <option value="">Vyberte značku</option>
                    {BRAND_NAMES.map((b) => <option key={b} value={b}>{b}</option>)}
                    <option value="__custom__">--- Jiná značka ---</option>
                  </select>
                )}
              </div>

              {/* Model */}
              <div>
                <label className={labelClass}>Model *</label>
                {customModel || modelOptions.length === 0 ? (
                  <div className="flex gap-2">
                    <input type="text" value={form.model} onChange={(e) => setField("model", e.target.value)} placeholder="Zadejte model" className={inputClass} />
                    {modelOptions.length > 0 && (
                      <button type="button" onClick={() => { setCustomModel(false); setField("model", ""); }} className="px-3 text-xs text-orange-600 hover:text-orange-700 shrink-0 font-medium">Seznam</button>
                    )}
                  </div>
                ) : (
                  <select value={form.model} onChange={(e) => { const v = e.target.value; if (v === "__custom__") { setCustomModel(true); setField("model", ""); } else { setField("model", v); }}} className={selectClass}>
                    <option value="">Vyberte model</option>
                    {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                    <option value="__custom__">--- Jiný model ---</option>
                  </select>
                )}
              </div>

              {/* Varianta + Rok */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Varianta</label>
                  <input type="text" value={form.variant} onChange={(e) => setField("variant", e.target.value)} placeholder="Např. RS, Style" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Rok výroby *</label>
                  <select value={form.year} onChange={(e) => setField("year", parseInt(e.target.value, 10))} className={selectClass}>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Technické údaje</h2>
            <div className="space-y-4">
              {/* Palivo */}
              <div>
                <label className={labelClass}>Palivo *</label>
                <div className="grid grid-cols-4 gap-2">
                  {FUEL_TYPES.map((f) => (
                    <button key={f.value} type="button" onClick={() => setField("fuelType", f.value)}
                      className={`py-2.5 px-2 rounded-lg text-sm font-medium border-2 transition-all ${form.fuelType === f.value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Převodovka */}
              <div>
                <label className={labelClass}>Převodovka *</label>
                <div className="grid grid-cols-4 gap-2">
                  {TRANSMISSIONS.map((t) => (
                    <button key={t.value} type="button" onClick={() => setField("transmission", t.value)}
                      className={`py-2.5 px-2 rounded-lg text-sm font-medium border-2 transition-all ${form.transmission === t.value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Karoserie */}
              <div>
                <label className={labelClass}>Karoserie</label>
                <div className="grid grid-cols-4 gap-2">
                  {BODY_TYPES.map((b) => (
                    <button key={b.value} type="button" onClick={() => setField("bodyType", b.value)}
                      className={`py-2.5 px-2 rounded-lg text-sm font-medium border-2 transition-all ${form.bodyType === b.value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Výkon + Objem */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Výkon</label>
                  <select value={form.enginePower} onChange={(e) => setField("enginePower", e.target.value)} className={selectClass}>
                    <option value="">Vyberte</option>
                    {ENGINE_POWERS.map((p) => <option key={p} value={String(p)}>{p} kW ({Math.round(p * 1.36)} koní)</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Objem motoru</label>
                  <select value={form.engineCapacity} onChange={(e) => setField("engineCapacity", e.target.value)} className={selectClass}>
                    <option value="">Vyberte</option>
                    {ENGINE_CAPACITIES.map((c) => <option key={c} value={String(c)}>{(c / 1000).toFixed(1)} l ({c.toLocaleString("cs-CZ")} ccm)</option>)}
                  </select>
                </div>
              </div>

              {/* Barva */}
              <div>
                <label className={labelClass}>Barva</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setField("color", c)}
                      className={`py-1.5 px-3 rounded-full text-xs font-medium border-2 transition-all ${form.color === c ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Stav vozidla</h2>
            <div className="space-y-4">
              {/* Nájezd */}
              <div>
                <label className={labelClass}>Nájezd (km) *</label>
                <input type="number" value={form.mileage || ""} onChange={(e) => setField("mileage", parseInt(e.target.value, 10) || 0)} placeholder="Např. 85 000" className={inputClass} />
              </div>

              {/* Stav */}
              <div>
                <label className={labelClass}>Stav *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CONDITIONS.map((c) => (
                    <button key={c.value} type="button" onClick={() => setField("condition", c.value)}
                      className={`py-2.5 px-2 rounded-lg text-sm font-medium border-2 transition-all ${form.condition === c.value ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================== */}
      {/* STEP 2: Kontakt a cena */}
      {/* =========================================== */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Cena</h2>
            <div>
              <label className={labelClass}>Prodejní cena (Kč) *</label>
              <input type="number" value={form.price || ""} onChange={(e) => setField("price", parseInt(e.target.value, 10) || 0)} placeholder="Např. 350 000" className={inputClass + " text-lg font-semibold"} />
              {form.price > 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  {new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(form.price)}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Kontakt na prodejce</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Jméno</label>
                <input type="text" value={form.contactName} onChange={(e) => setField("contactName", e.target.value)} placeholder="Jan Novák" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Telefon</label>
                  <input type="tel" value={form.contactPhone} onChange={(e) => setField("contactPhone", e.target.value)} placeholder="+420 777 123 456" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={form.contactEmail} onChange={(e) => setField("contactEmail", e.target.value)} placeholder="jan@email.cz" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Město *</label>
                <div className="grid grid-cols-4 gap-2">
                  {CITIES.map((c) => (
                    <button key={c} type="button" onClick={() => setField("city", c)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium border-2 transition-all ${form.city === c ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Popis</h2>
            <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={4} placeholder="Volitelný popis vozidla..." className={inputClass + " resize-y"} />
          </Card>
        </div>
      )}

      {/* =========================================== */}
      {/* STEP 3: Souhrn */}
      {/* =========================================== */}
      {step === 3 && (
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Souhrn vozidla</h2>

          <div className="space-y-4">
            <SummarySection title="Identifikace">
              <SummaryRow label="VIN" value={form.vin} mono />
              <SummaryRow label="Značka" value={form.brand} />
              <SummaryRow label="Model" value={form.model} />
              {form.variant && <SummaryRow label="Varianta" value={form.variant} />}
              <SummaryRow label="Rok výroby" value={String(form.year)} />
            </SummarySection>

            <SummarySection title="Technické údaje">
              <SummaryRow label="Palivo" value={fuelLabel} />
              <SummaryRow label="Převodovka" value={transLabel} />
              {bodyLabel && <SummaryRow label="Karoserie" value={bodyLabel} />}
              {form.enginePower && <SummaryRow label="Výkon" value={`${form.enginePower} kW (${Math.round(Number(form.enginePower) * 1.36)} koní)`} />}
              {form.engineCapacity && <SummaryRow label="Objem" value={`${Number(form.engineCapacity).toLocaleString("cs-CZ")} ccm`} />}
              {form.color && <SummaryRow label="Barva" value={form.color} />}
            </SummarySection>

            <SummarySection title="Stav">
              <SummaryRow label="Nájezd" value={`${form.mileage.toLocaleString("cs-CZ")} km`} />
              <SummaryRow label="Stav" value={condLabel} />
            </SummarySection>

            <SummarySection title="Cena a kontakt">
              <SummaryRow label="Cena" value={new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(form.price)} highlight />
              <SummaryRow label="Město" value={form.city} />
              {form.contactName && <SummaryRow label="Kontakt" value={form.contactName} />}
              {form.contactPhone && <SummaryRow label="Telefon" value={form.contactPhone} />}
            </SummarySection>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-8 py-4 rounded-lg text-base font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vytvářím vozidlo...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Vytvořit vozidlo
              </>
            )}
          </button>
        </Card>
      )}

      {/* =========================================== */}
      {/* Navigation */}
      {/* =========================================== */}
      <div className="flex items-center justify-between mt-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => step === 0 ? router.push("/admin/vehicles") : setStep(step - 1)}
        >
          {step === 0 ? "Zrušit" : "Zpět"}
        </Button>

        {step < 3 && (
          <Button
            type="button"
            variant="primary"
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
          >
            Pokračovat
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-emerald-600 text-xs">{label}:</span>
      <span className="font-semibold text-emerald-900 text-xs">{value}</span>
    </div>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2">
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, mono, highlight }: { label: string; value?: string; mono?: boolean; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-orange-600 text-base" : "text-gray-900"} ${mono ? "font-mono tracking-wider" : ""}`}>
        {value}
      </span>
    </div>
  );
}
