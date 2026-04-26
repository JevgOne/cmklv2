"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

const CAR_BRANDS: Record<string, string[]> = {
  "Škoda": ["Octavia", "Fabia", "Superb", "Kodiaq", "Karoq", "Kamiq", "Scala", "Rapid", "Citigo", "Yeti", "Enyaq", "Roomster"],
  "Volkswagen": ["Golf", "Passat", "Tiguan", "Polo", "T-Roc", "Touran", "Touareg", "Arteon", "ID.3", "ID.4", "Caddy", "Up!"],
  "BMW": ["3 Series", "5 Series", "1 Series", "X1", "X3", "X5", "X6", "7 Series", "4 Series", "2 Series", "i3", "i4"],
  "Audi": ["A3", "A4", "A6", "A8", "Q3", "Q5", "Q7", "Q8", "TT", "e-tron", "A5", "A1"],
  "Mercedes-Benz": ["C-Class", "E-Class", "A-Class", "GLC", "GLE", "CLA", "S-Class", "GLA", "GLB", "B-Class", "EQC", "V-Class"],
  "Ford": ["Focus", "Fiesta", "Mondeo", "Kuga", "Puma", "EcoSport", "Ranger", "Transit", "Mustang", "Explorer", "Galaxy", "S-MAX"],
  "Toyota": ["Corolla", "Yaris", "RAV4", "C-HR", "Camry", "Hilux", "Land Cruiser", "Aygo", "Avensis", "Auris", "Prius", "Supra"],
  "Hyundai": ["Tucson", "i30", "i20", "Kona", "Santa Fe", "i10", "Ioniq", "Bayon", "Nexo", "i40", "ix20", "ix35"],
  "Kia": ["Sportage", "Ceed", "Stonic", "Niro", "Sorento", "Picanto", "XCeed", "ProCeed", "Rio", "Venga", "Soul", "EV6"],
  "Peugeot": ["308", "208", "3008", "5008", "2008", "508", "Partner", "Rifter", "108", "407", "607", "e-208"],
  "Renault": ["Clio", "Megane", "Captur", "Kadjar", "Scenic", "Talisman", "Twingo", "Kangoo", "Koleos", "Espace", "Arkana", "Zoe"],
  "Citroën": ["C3", "C4", "C5 Aircross", "Berlingo", "C3 Aircross", "C1", "C-Elysée", "SpaceTourer", "C4 Cactus", "DS3"],
  "Opel": ["Astra", "Corsa", "Mokka", "Crossland", "Grandland", "Insignia", "Zafira", "Adam", "Karl", "Meriva", "Combo"],
  "Mazda": ["CX-5", "3", "6", "CX-3", "CX-30", "MX-5", "2", "CX-60", "CX-9"],
  "Honda": ["Civic", "CR-V", "HR-V", "Jazz", "Accord", "e", "CR-Z"],
  "Nissan": ["Qashqai", "Juke", "Micra", "X-Trail", "Leaf", "Navara", "Note", "Pulsar"],
  "Volvo": ["XC60", "XC40", "XC90", "V60", "S60", "V40", "S90", "V90"],
  "Dacia": ["Duster", "Sandero", "Logan", "Spring", "Jogger"],
  "Seat": ["Leon", "Ibiza", "Ateca", "Arona", "Tarraco", "Alhambra", "Mii", "Toledo"],
  "Fiat": ["500", "Panda", "Tipo", "500X", "500L", "Punto", "Ducato", "Doblo"],
  "Suzuki": ["Vitara", "Swift", "SX4 S-Cross", "Jimny", "Ignis", "Baleno", "Across"],
  "Mitsubishi": ["Outlander", "ASX", "Eclipse Cross", "L200", "Space Star", "Pajero"],
  "Jeep": ["Compass", "Renegade", "Wrangler", "Grand Cherokee", "Cherokee"],
  "Land Rover": ["Range Rover Evoque", "Discovery Sport", "Range Rover Sport", "Defender", "Discovery"],
  "Porsche": ["Cayenne", "Macan", "911", "Panamera", "Taycan", "718"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X"],
  "Jiné": [],
};

const BRAND_NAMES = Object.keys(CAR_BRANDS);

const fuelTypes = [
  { value: "PETROL", label: "Benzín" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Elektro" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "PLUGIN_HYBRID", label: "Plug-in Hybrid" },
  { value: "LPG", label: "LPG" },
  { value: "CNG", label: "CNG" },
];

const transmissions = [
  { value: "MANUAL", label: "Manuální" },
  { value: "AUTOMATIC", label: "Automatická" },
  { value: "DSG", label: "DSG" },
  { value: "CVT", label: "CVT" },
];

const bodyTypes = [
  { value: "SEDAN", label: "Sedan" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "COMBI", label: "Kombi" },
  { value: "SUV", label: "SUV" },
  { value: "COUPE", label: "Coupé" },
  { value: "CABRIO", label: "Kabriolet" },
  { value: "VAN", label: "Van" },
  { value: "PICKUP", label: "Pickup" },
];

const conditions = [
  { value: "NEW", label: "Nové" },
  { value: "LIKE_NEW", label: "Jako nové" },
  { value: "EXCELLENT", label: "Výborný" },
  { value: "GOOD", label: "Dobrý" },
  { value: "FAIR", label: "Uspokojivý" },
  { value: "DAMAGED", label: "Poškozené" },
];

const ENGINE_POWERS = [55, 66, 75, 81, 85, 90, 96, 100, 103, 110, 115, 120, 125, 130, 135, 140, 147, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 270, 290, 300, 320, 350, 370, 400];
const ENGINE_CAPACITIES = [999, 1197, 1242, 1395, 1498, 1560, 1598, 1781, 1798, 1896, 1968, 1984, 1995, 2143, 2179, 2497, 2698, 2967, 2979, 2993, 3498, 3996, 4395, 4999];

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const selectClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none";

export default function AdminNewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [customBrand, setCustomBrand] = useState(false);
  const [customModel, setCustomModel] = useState(false);

  const [form, setForm] = useState({
    vin: "",
    brand: "",
    model: "",
    variant: "",
    year: new Date().getFullYear(),
    mileage: 0,
    fuelType: "PETROL",
    transmission: "MANUAL",
    bodyType: "SEDAN",
    condition: "GOOD",
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

  function setField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleVinDecode() {
    if (form.vin.length !== 17) return;
    setVinLoading(true);
    try {
      const res = await fetch(`/api/vin/decode?vin=${form.vin}`);
      if (res.ok) {
        const { data } = await res.json();
        if (data.brand) {
          // Check if brand exists in our list
          const matchedBrand = BRAND_NAMES.find(
            (b) => b.toLowerCase() === data.brand.toLowerCase()
          );
          if (matchedBrand) {
            setField("brand", matchedBrand);
            setCustomBrand(false);
          } else {
            setField("brand", data.brand);
            setCustomBrand(true);
          }
        }
        if (data.model) {
          setField("model", data.model);
          setCustomModel(true); // VIN decoded model might not match list exactly
        }
        if (data.year) setField("year", data.year);
        if (data.fuelType) setField("fuelType", data.fuelType);
        if (data.transmission) setField("transmission", data.transmission);
        if (data.bodyType) setField("bodyType", data.bodyType);
        if (data.enginePower) setField("enginePower", String(data.enginePower));
        if (data.engineCapacity) setField("engineCapacity", String(data.engineCapacity));
      }
    } catch {
      // VIN decode selhal — uživatel vyplní ručně
    } finally {
      setVinLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
  }

  const years = useMemo(() => {
    const arr = [];
    for (let y = new Date().getFullYear() + 1; y >= 1990; y--) arr.push(y);
    return arr;
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="text-sm text-gray-500 mb-1">Admin / Vozidla / Nové</p>
        <h1 className="text-2xl font-bold text-gray-900">Přidat vozidlo</h1>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VIN */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">VIN</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={form.vin}
                onChange={(e) => setField("vin", e.target.value.toUpperCase())}
                placeholder="Např. WVWZZZ3CZWE123456"
                maxLength={17}
                required
                className={inputClass + " font-mono tracking-wider"}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleVinDecode}
              disabled={form.vin.length !== 17 || vinLoading}
            >
              {vinLoading ? "Dekóduji..." : "Dekódovat VIN"}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            17 znaků. Po dekódování se automaticky vyplní údaje o vozidle.
          </p>
        </Card>

        {/* Základní údaje */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Základní údaje</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Značka *</label>
              {customBrand ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(e) => setField("brand", e.target.value)}
                    placeholder="Zadejte značku"
                    required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => { setCustomBrand(false); setField("brand", ""); setField("model", ""); setCustomModel(false); }}
                    className="px-2 text-xs text-gray-500 hover:text-gray-700 shrink-0"
                  >
                    Seznam
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={form.brand}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setCustomBrand(true);
                        setField("brand", "");
                        setField("model", "");
                        setCustomModel(false);
                      } else {
                        setField("brand", val);
                        setField("model", "");
                        setCustomModel(false);
                      }
                    }}
                    required
                    className={selectClass}
                  >
                    <option value="">Vyberte značku</option>
                    {BRAND_NAMES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="__custom__">--- Jiná značka ---</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Model *</label>
              {customModel || modelOptions.length === 0 ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setField("model", e.target.value)}
                    placeholder="Zadejte model"
                    required
                    className={inputClass}
                  />
                  {modelOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setCustomModel(false); setField("model", ""); }}
                      className="px-2 text-xs text-gray-500 hover:text-gray-700 shrink-0"
                    >
                      Seznam
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={form.model}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setCustomModel(true);
                        setField("model", "");
                      } else {
                        setField("model", val);
                      }
                    }}
                    required
                    className={selectClass}
                  >
                    <option value="">Vyberte model</option>
                    {modelOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="__custom__">--- Jiný model ---</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Varianta</label>
              <input
                type="text"
                value={form.variant}
                onChange={(e) => setField("variant", e.target.value)}
                placeholder="Např. RS, Style, Ambition"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Rok výroby *</label>
              <select
                value={form.year}
                onChange={(e) => setField("year", parseInt(e.target.value, 10))}
                required
                className={selectClass}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nájezd (km) *</label>
              <input
                type="number"
                value={form.mileage || ""}
                onChange={(e) => setField("mileage", parseInt(e.target.value, 10) || 0)}
                placeholder="Např. 85 000"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Barva</label>
              <select
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                className={selectClass}
              >
                <option value="">Vyberte barvu</option>
                <option value="Bílá">Bílá</option>
                <option value="Černá">Černá</option>
                <option value="Stříbrná">Stříbrná</option>
                <option value="Šedá">Šedá</option>
                <option value="Modrá">Modrá</option>
                <option value="Červená">Červená</option>
                <option value="Zelená">Zelená</option>
                <option value="Hnědá">Hnědá</option>
                <option value="Béžová">Béžová</option>
                <option value="Oranžová">Oranžová</option>
                <option value="Žlutá">Žlutá</option>
                <option value="Zlatá">Zlatá</option>
                <option value="Fialová">Fialová</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Motor a karoserie */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Motor a karoserie</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Palivo *</label>
              <select
                value={form.fuelType}
                onChange={(e) => setField("fuelType", e.target.value)}
                className={selectClass}
              >
                {fuelTypes.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Převodovka *</label>
              <select
                value={form.transmission}
                onChange={(e) => setField("transmission", e.target.value)}
                className={selectClass}
              >
                {transmissions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Karoserie</label>
              <select
                value={form.bodyType}
                onChange={(e) => setField("bodyType", e.target.value)}
                className={selectClass}
              >
                {bodyTypes.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Výkon (kW)</label>
              <select
                value={form.enginePower}
                onChange={(e) => setField("enginePower", e.target.value)}
                className={selectClass}
              >
                <option value="">Vyberte výkon</option>
                {ENGINE_POWERS.map((p) => (
                  <option key={p} value={String(p)}>{p} kW ({Math.round(p * 1.36)} koní)</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Objem (ccm)</label>
              <select
                value={form.engineCapacity}
                onChange={(e) => setField("engineCapacity", e.target.value)}
                className={selectClass}
              >
                <option value="">Vyberte objem</option>
                {ENGINE_CAPACITIES.map((c) => (
                  <option key={c} value={String(c)}>
                    {(c / 1000).toFixed(1)} l ({c.toLocaleString("cs-CZ")} ccm)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Stav *</label>
              <select
                value={form.condition}
                onChange={(e) => setField("condition", e.target.value)}
                className={selectClass}
              >
                {conditions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Cena */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Cena</h2>
          <div className="max-w-xs">
            <label className={labelClass}>Cena (Kč) *</label>
            <input
              type="number"
              value={form.price || ""}
              onChange={(e) => setField("price", parseInt(e.target.value, 10) || 0)}
              placeholder="Např. 350 000"
              required
              className={inputClass}
            />
          </div>
        </Card>

        {/* Kontakt */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Kontakt na prodejce</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Jméno</label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => setField("contactName", e.target.value)}
                placeholder="Jan Novák"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Telefon</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setField("contactPhone", e.target.value)}
                placeholder="+420 777 123 456"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setField("contactEmail", e.target.value)}
                placeholder="jan@email.cz"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Město *</label>
              <select
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                required
                className={selectClass}
              >
                <option value="Praha">Praha</option>
                <option value="Brno">Brno</option>
                <option value="Ostrava">Ostrava</option>
                <option value="Plzeň">Plzeň</option>
                <option value="Liberec">Liberec</option>
                <option value="Olomouc">Olomouc</option>
                <option value="Hradec Králové">Hradec Králové</option>
                <option value="České Budějovice">České Budějovice</option>
                <option value="Ústí nad Labem">Ústí nad Labem</option>
                <option value="Pardubice">Pardubice</option>
                <option value="Zlín">Zlín</option>
                <option value="Karlovy Vary">Karlovy Vary</option>
                <option value="Jihlava">Jihlava</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Popis */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Popis</h2>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={4}
            placeholder="Volitelný popis vozidla..."
            className={inputClass + " resize-y"}
          />
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Vytvářím..." : "Vytvořit vozidlo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/vehicles")}
          >
            Zrušit
          </Button>
        </div>
      </form>
    </div>
  );
}
