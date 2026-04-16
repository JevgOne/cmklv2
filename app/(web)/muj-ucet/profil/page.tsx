"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagInput, type TagInputValue } from "@/components/web/TagInput";
import Link from "next/link";
import { DAY_KEYS, DAY_LABELS } from "@/lib/role-labels";

interface ProfileEditData {
  firstName: string;
  lastName: string;
  bio: string | null;
  avatar: string | null;
  coverPhoto: string | null;
  city: string | null;
  slug: string | null;
  favoriteBrands: string | null;
  showPhone: boolean;
  showEmail: boolean;
  phone: string | null;
  email: string | null;
  role: string;
  yearsExperience: number | null;
  website: string | null;
  motto: string | null;
  socialLinks: { instagram?: string; facebook?: string; youtube?: string } | null;
  services: string[] | null;
  languageSkills: string[] | null;
  specializations: string | null;
  warehouseAddress: string | null;
  openingHours: Record<string, string> | null;
}

const BRAND_OPTIONS = [
  "Škoda", "Volkswagen", "BMW", "Audi", "Mercedes-Benz",
  "Hyundai", "Toyota", "Ford", "Opel", "Peugeot",
  "Citroën", "Renault", "Seat", "Kia", "Mazda",
  "Volvo", "Honda", "Nissan", "Suzuki", "Dacia",
];

const SPECIALIZATION_OPTIONS = [
  "SUV", "Veterány", "Elektro", "Užitkové", "Luxusní", "Sportovní",
];

const SERVICE_OPTIONS = [
  "Dovoz", "Prověrka", "Financování", "Pojištění", "STK",
];

const LANGUAGE_OPTIONS = [
  "Čeština", "Angličtina", "Němčina", "Slovenština", "Polština", "Ruština",
];

export default function ProfileEditPage() {
  const [data, setData] = useState<ProfileEditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [city, setCity] = useState("");
  const [favBrands, setFavBrands] = useState<string[]>([]);
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [brandInput, setBrandInput] = useState("");
  const [yearsExperience, setYearsExperience] = useState<number | "">("");
  const [website, setWebsite] = useState("");
  const [motto, setMotto] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [languageSkills, setLanguageSkills] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [openingHours, setOpeningHours] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<TagInputValue[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/edit");
        if (res.ok) {
          const { user } = await res.json();
          setData(user);
          setFirstName(user.firstName || "");
          setLastName(user.lastName || "");
          setBio(user.bio || "");
          setAvatar(user.avatar || "");
          setCoverPhoto(user.coverPhoto || "");
          setCity(user.city || "");
          setShowPhone(user.showPhone || false);
          setShowEmail(user.showEmail || false);
          const brands: string[] = user.favoriteBrands
            ? JSON.parse(user.favoriteBrands)
            : [];
          setFavBrands(brands);
          setYearsExperience(user.yearsExperience ?? "");
          setWebsite(user.website || "");
          setMotto(user.motto || "");
          setSocialInstagram(user.socialLinks?.instagram || "");
          setSocialFacebook(user.socialLinks?.facebook || "");
          setSocialYoutube(user.socialLinks?.youtube || "");
          setServices(user.services || []);
          setLanguageSkills(user.languageSkills || []);
          const specs: string[] = user.specializations
            ? (() => { try { return JSON.parse(user.specializations); } catch { return []; } })()
            : [];
          setSpecializations(specs);
          setWarehouseAddress(user.warehouseAddress || "");
          setOpeningHours(user.openingHours || {});
        }
        // Hashtags — separátní endpoint
        const tagsRes = await fetch("/api/profile/tags");
        if (tagsRes.ok) {
          const { tags: userTags } = await tagsRes.json();
          setTags(userTags ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const [profileRes, tagsRes] = await Promise.all([
        fetch("/api/profile/edit", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            bio: bio || null,
            avatar: avatar || null,
            coverPhoto: coverPhoto || null,
            city: city || null,
            favoriteBrands: favBrands,
            showPhone,
            showEmail,
            yearsExperience: yearsExperience !== "" ? yearsExperience : null,
            website: website || null,
            motto: motto || null,
            socialLinks:
              socialInstagram || socialFacebook || socialYoutube
                ? {
                    instagram: socialInstagram || undefined,
                    facebook: socialFacebook || undefined,
                    youtube: socialYoutube || undefined,
                  }
                : null,
            services,
            languageSkills,
            specializations,
            warehouseAddress: warehouseAddress || null,
            openingHours:
              Object.keys(openingHours).length > 0 ? openingHours : null,
          }),
        }),
        fetch("/api/profile/tags", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags }),
        }),
      ]);
      if (!profileRes.ok) {
        const d = await profileRes.json();
        throw new Error(d.error || "Chyba při ukládání profilu");
      }
      if (!tagsRes.ok) {
        const d = await tagsRes.json();
        throw new Error(d.error || "Chyba při ukládání hashtagů");
      }
      const { user } = await profileRes.json();
      setData(user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSaving(false);
    }
  };

  const addBrand = (brand: string) => {
    if (brand && !favBrands.includes(brand) && favBrands.length < 10) {
      setFavBrands([...favBrands, brand]);
      setBrandInput("");
    }
  };

  const removeBrand = (brand: string) => {
    setFavBrands(favBrands.filter((b) => b !== brand));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Můj profil</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upravte si veřejný profil viditelný ostatním uživatelům
          </p>
        </div>
        {data?.slug && (
          <Link
            href={`/profil/${data.slug}`}
            className="text-sm font-semibold text-orange-500 hover:text-orange-600 no-underline"
          >
            Zobrazit veřejný profil &rarr;
          </Link>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Cover + Avatar */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Fotografie</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cover photo URL"
              placeholder="https://res.cloudinary.com/..."
              value={coverPhoto}
              onChange={(e) => setCoverPhoto(e.target.value)}
            />
            <Input
              label="Avatar URL"
              placeholder="https://res.cloudinary.com/..."
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Nahrajte obrázky přes Cloudinary a vložte URL. Doporučený rozměr cover: 1200x400px, avatar: 400x400px.
          </p>
        </Card>

        {/* Personal info */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Osobní údaje</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Jméno"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Příjmení"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Bio (max 500 znaků)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-y"
              placeholder="Pár slov o sobě..."
            />
            <p className="text-xs text-gray-400 mt-1">{bio.length}/500</p>
          </div>
          <div className="mt-4">
            <Input
              label="Město"
              placeholder="Praha"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </Card>

        {/* Motto + Experience + Website */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Profil detaily</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Motto"
              placeholder="Vaše motto..."
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
            />
            <Input
              label="Roky zkušeností"
              type="number"
              placeholder="5"
              value={yearsExperience === "" ? "" : String(yearsExperience)}
              onChange={(e) => setYearsExperience(e.target.value ? parseInt(e.target.value) : "")}
            />
          </div>
          <div className="mt-4">
            <Input
              label="Web"
              placeholder="https://www.example.cz"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </Card>

        {/* Social links */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Sociální sítě</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Instagram"
              placeholder="https://instagram.com/..."
              value={socialInstagram}
              onChange={(e) => setSocialInstagram(e.target.value)}
            />
            <Input
              label="Facebook"
              placeholder="https://facebook.com/..."
              value={socialFacebook}
              onChange={(e) => setSocialFacebook(e.target.value)}
            />
            <Input
              label="YouTube"
              placeholder="https://youtube.com/..."
              value={socialYoutube}
              onChange={(e) => setSocialYoutube(e.target.value)}
            />
          </div>
        </Card>

        {/* Specializations (G8) */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Specializace</h3>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATION_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpecializations((prev) =>
                  prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                )}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                  specializations.includes(s)
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        {/* Hashtags (max 10) */}
        <div id="hashtags">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-1">
              Hashtagy (max 10)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Lokality, značky, specializace, služby. Ukáží se na vašem profilu a v landing stránkách.
            </p>
            <TagInput value={tags} onChange={setTags} />
          </Card>
        </div>

        {/* Services */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Služby</h3>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setServices((prev) =>
                  prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                )}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                  services.includes(s)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        {/* Languages */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Jazyky</h3>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguageSkills((prev) =>
                  prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
                )}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                  languageSkills.includes(l)
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Card>

        {/* Warehouse (PARTS_SUPPLIER only) */}
        {data?.role && ["PARTS_SUPPLIER", "WHOLESALE_SUPPLIER", "PARTNER_VRAKOVISTE"].includes(data.role) && (
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Sklad</h3>
            <Input
              label="Adresa skladu"
              placeholder="Průmyslová 123, Praha 5"
              value={warehouseAddress}
              onChange={(e) => setWarehouseAddress(e.target.value)}
            />
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Otevírací doba</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DAY_KEYS.map((day) => (
                  <div key={day}>
                    <label className="text-xs text-gray-500">{DAY_LABELS[day]}</label>
                    <input
                      type="text"
                      placeholder="8:00-17:00"
                      value={openingHours[day] || ""}
                      onChange={(e) => setOpeningHours((prev) => ({ ...prev, [day]: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Favorite brands */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Oblíbené značky</h3>
          {favBrands.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {favBrands.map((brand) => (
                <span
                  key={brand}
                  className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-sm font-medium px-3 py-1 rounded-full"
                >
                  {brand}
                  <button
                    type="button"
                    onClick={() => removeBrand(brand)}
                    className="text-orange-400 hover:text-orange-600 cursor-pointer bg-transparent border-none text-xs"
                  >
                    &#10005;
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <select
                value={brandInput}
                onChange={(e) => {
                  addBrand(e.target.value);
                  e.target.value = "";
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                <option value="">+ Přidat značku</option>
                {BRAND_OPTIONS.filter((b) => !favBrands.includes(b)).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Privacy */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Soukromí</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Zobrazit telefon na veřejném profilu
                {data?.phone && <span className="text-gray-400 ml-1">({data.phone})</span>}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Zobrazit email na veřejném profilu
                {data?.email && <span className="text-gray-400 ml-1">({data.email})</span>}
              </span>
            </label>
          </div>
        </Card>

        {/* Submit */}
        {error && (
          <p className="text-red-600 text-sm font-medium">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm font-medium">Profil úspěšně uložen!</p>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? "Ukládám..." : "Uložit změny"}
        </Button>
      </form>
    </div>
  );
}
