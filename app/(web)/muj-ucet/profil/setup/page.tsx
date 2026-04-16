"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  BROKER_SPECIALIZATIONS,
  SERVICE_GROUPS,
} from "@/lib/broker-specializations";
import {
  calculateProfileCompleteness,
  type ProfileCompletenessInput,
} from "@/lib/profile-completeness";

/**
 * Profil setup wizard — TASK-060.
 *
 * 5 kroku, incremental save pres PUT /api/profile/edit.
 * Na konci -> redirect na /profil/{slug}.
 */

interface WizardData {
  avatar: string;
  coverPhoto: string;
  specializations: string[];
  services: string[];
  languageSkills: string[];
  city: string;
  website: string;
  motto: string;
  yearsExperience: number | "";
  socialInstagram: string;
  socialFacebook: string;
  socialYoutube: string;
  slug: string | null;
}

const LANGUAGE_PRESETS = [
  "Čeština",
  "Angličtina",
  "Němčina",
  "Slovenština",
  "Polština",
  "Ruština",
];

const STEPS = [
  { id: 1, label: "Fotky" },
  { id: 2, label: "Specializace" },
  { id: 3, label: "Jazyky" },
  { id: 4, label: "Kontakty" },
  { id: 5, label: "Přehled" },
] as const;

const INITIAL: WizardData = {
  avatar: "",
  coverPhoto: "",
  specializations: [],
  services: [],
  languageSkills: [],
  city: "",
  website: "",
  motto: "",
  yearsExperience: "",
  socialInstagram: "",
  socialFacebook: "",
  socialYoutube: "",
  slug: null,
};

export default function ProfileSetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing profile
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/profile/edit");
        if (res.ok) {
          const { user } = await res.json();
          if (user) {
            const specs: string[] = (() => {
              try {
                return user.specializations ? JSON.parse(user.specializations) : [];
              } catch {
                return [];
              }
            })();
            setData({
              avatar: user.avatar || "",
              coverPhoto: user.coverPhoto || "",
              specializations: specs,
              services: user.services || [],
              languageSkills: user.languageSkills || [],
              city: user.city || "",
              website: user.website || "",
              motto: user.motto || "",
              yearsExperience: user.yearsExperience ?? "",
              socialInstagram: user.socialLinks?.instagram || "",
              socialFacebook: user.socialLinks?.facebook || "",
              socialYoutube: user.socialLinks?.youtube || "",
              slug: user.slug ?? null,
            });
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveStep = async (payload: Record<string, unknown>): Promise<boolean> => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/profile/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Chyba při ukládání");
      }
      const { user } = await res.json();
      if (user?.slug) {
        setData((prev) => ({ ...prev, slug: user.slug }));
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při ukládání");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const buildStepPayload = (s: number): Record<string, unknown> => {
    switch (s) {
      case 1:
        return {
          avatar: data.avatar || null,
          coverPhoto: data.coverPhoto || null,
        };
      case 2:
        return {
          specializations: data.specializations,
          services: data.services,
        };
      case 3:
        return { languageSkills: data.languageSkills };
      case 4:
        return {
          city: data.city || null,
          website: data.website || null,
          motto: data.motto || null,
          yearsExperience: data.yearsExperience !== "" ? data.yearsExperience : null,
          socialLinks:
            data.socialInstagram || data.socialFacebook || data.socialYoutube
              ? {
                  instagram: data.socialInstagram || undefined,
                  facebook: data.socialFacebook || undefined,
                  youtube: data.socialYoutube || undefined,
                }
              : null,
        };
      default:
        return {};
    }
  };

  const handleNext = async () => {
    if (step < 5) {
      const ok = await saveStep(buildStepPayload(step));
      if (!ok) return;
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleFinish = async () => {
    // Final save (all fields) — idempotent defensive save before redirect.
    const ok = await saveStep({
      ...buildStepPayload(1),
      ...buildStepPayload(2),
      ...buildStepPayload(3),
      ...buildStepPayload(4),
    });
    if (!ok) return;
    router.push(data.slug ? `/profil/${data.slug}` : "/muj-ucet/profil");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentStep = STEPS[step - 1];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Průvodce profilem
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Krok {step} z 5 — {currentStep.label}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s.id <= step ? "bg-orange-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 uppercase font-semibold">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={s.id === step ? "text-orange-600" : ""}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card className="p-6">
        {step === 1 && (
          <StepPhotos data={data} setData={setData} />
        )}
        {step === 2 && (
          <StepSpecializations data={data} setData={setData} />
        )}
        {step === 3 && (
          <StepLanguages data={data} setData={setData} />
        )}
        {step === 4 && (
          <StepContacts data={data} setData={setData} />
        )}
        {step === 5 && <StepReview data={data} />}
      </Card>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          {step > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={saving}
            >
              Zpět
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step < 5 && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSkip}
              disabled={saving}
            >
              Přeskočit
            </Button>
          )}
          {step < 5 ? (
            <Button type="button" onClick={handleNext} disabled={saving}>
              {saving ? "Ukládám…" : "Další"}
            </Button>
          ) : (
            <Button type="button" onClick={handleFinish} disabled={saving}>
              {saving ? "Ukládám…" : "Dokončit"}
            </Button>
          )}
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/muj-ucet/profil"
          className="text-xs text-gray-400 hover:text-gray-600 no-underline"
        >
          Přejít do klasického editoru
        </Link>
      </div>
    </div>
  );
}

// ---------- Steps ----------

interface StepProps {
  data: WizardData;
  setData: React.Dispatch<React.SetStateAction<WizardData>>;
}

function StepPhotos({ data, setData }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Fotky</h3>
        <p className="text-sm text-gray-500">
          Přidejte profilovou fotku a cover. Zákazníci je uvidí jako první.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-4">
        <ImageUpload
          label="Cover fotka"
          preset="cover"
          value={data.coverPhoto || null}
          onChange={(url) => setData((p) => ({ ...p, coverPhoto: url ?? "" }))}
          shape="rect"
          aspectRatio="16 / 5"
          hint="Doporučený rozměr 1200×400 px."
        />
        <ImageUpload
          label="Profilová fotka"
          preset="avatar"
          value={data.avatar || null}
          onChange={(url) => setData((p) => ({ ...p, avatar: url ?? "" }))}
          shape="circle"
          aspectRatio="1 / 1"
          hint="Doporučený rozměr 400×400 px."
        />
      </div>
    </div>
  );
}

function StepSpecializations({ data, setData }: StepProps) {
  const toggleType = (t: string) => {
    setData((p) => ({
      ...p,
      specializations: p.specializations.includes(t)
        ? p.specializations.filter((x) => x !== t)
        : [...p.specializations, t],
    }));
  };
  const toggleService = (s: string) => {
    setData((p) => ({
      ...p,
      services: p.services.includes(s)
        ? p.services.filter((x) => x !== s)
        : [...p.services, s],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Specializace</h3>
        <p className="text-sm text-gray-500">
          Vyberte typy vozidel a služby, které nabízíte.
        </p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Typy vozidel
        </h4>
        <div className="flex flex-wrap gap-2">
          {BROKER_SPECIALIZATIONS.vehicleTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                data.specializations.includes(t)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Služby
        </h4>
        {Object.entries(SERVICE_GROUPS).map(([group, items]) => (
          <div key={group}>
            <h5 className="text-xs font-semibold text-gray-600 mb-2">
              {group}
            </h5>
            <div className="flex flex-wrap gap-2">
              {items.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                    data.services.includes(s)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepLanguages({ data, setData }: StepProps) {
  const [custom, setCustom] = useState("");

  const addLang = (lang: string) => {
    const clean = lang.trim();
    if (!clean) return;
    setData((p) =>
      p.languageSkills.includes(clean)
        ? p
        : { ...p, languageSkills: [...p.languageSkills, clean] },
    );
  };
  const removeLang = (lang: string) => {
    setData((p) => ({
      ...p,
      languageSkills: p.languageSkills.filter((x) => x !== lang),
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Jazyky</h3>
        <p className="text-sm text-gray-500">
          Jazyky, kterými můžete komunikovat s klienty.
        </p>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Rychlý výběr
        </h4>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_PRESETS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() =>
                data.languageSkills.includes(l) ? removeLang(l) : addLang(l)
              }
              className={`px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                data.languageSkills.includes(l)
                  ? "bg-green-500 text-white border-green-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Přidat vlastní
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Např. Francouzština"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLang(custom);
                setCustom("");
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              addLang(custom);
              setCustom("");
            }}
          >
            Přidat
          </Button>
        </div>
      </div>

      {data.languageSkills.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Vybrané jazyky
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.languageSkills.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full"
              >
                {l}
                <button
                  type="button"
                  onClick={() => removeLang(l)}
                  className="text-green-400 hover:text-green-600 cursor-pointer bg-transparent border-none text-xs"
                  aria-label={`Odstranit ${l}`}
                >
                  &#10005;
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepContacts({ data, setData }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Kontakty a bio</h3>
        <p className="text-sm text-gray-500">
          Město, motto, zkušenosti, web a sociální sítě.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Město"
          placeholder="Praha"
          value={data.city}
          onChange={(e) => setData((p) => ({ ...p, city: e.target.value }))}
        />
        <Input
          label="Roky zkušeností"
          type="number"
          placeholder="5"
          value={data.yearsExperience === "" ? "" : String(data.yearsExperience)}
          onChange={(e) =>
            setData((p) => ({
              ...p,
              yearsExperience: e.target.value ? parseInt(e.target.value) : "",
            }))
          }
        />
      </div>

      <Input
        label="Motto"
        placeholder="Vaše motto…"
        value={data.motto}
        onChange={(e) => setData((p) => ({ ...p, motto: e.target.value }))}
      />

      <Input
        label="Web"
        placeholder="https://www.example.cz"
        value={data.website}
        onChange={(e) => setData((p) => ({ ...p, website: e.target.value }))}
      />

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Sociální sítě
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Instagram"
            placeholder="https://instagram.com/…"
            value={data.socialInstagram}
            onChange={(e) =>
              setData((p) => ({ ...p, socialInstagram: e.target.value }))
            }
          />
          <Input
            label="Facebook"
            placeholder="https://facebook.com/…"
            value={data.socialFacebook}
            onChange={(e) =>
              setData((p) => ({ ...p, socialFacebook: e.target.value }))
            }
          />
          <Input
            label="YouTube"
            placeholder="https://youtube.com/…"
            value={data.socialYoutube}
            onChange={(e) =>
              setData((p) => ({ ...p, socialYoutube: e.target.value }))
            }
          />
        </div>
      </div>
    </div>
  );
}

function StepReview({ data }: { data: WizardData }) {
  const completeness = calculateProfileCompleteness({
    avatar: data.avatar || null,
    coverPhoto: data.coverPhoto || null,
    bio: null,
    city: data.city || null,
    motto: data.motto || null,
    yearsExperience: data.yearsExperience === "" ? null : data.yearsExperience,
    website: data.website || null,
    specializations:
      data.specializations.length > 0
        ? JSON.stringify(data.specializations)
        : null,
    services: data.services.length > 0 ? data.services : null,
    languageSkills: data.languageSkills.length > 0 ? data.languageSkills : null,
    socialLinks:
      data.socialInstagram || data.socialFacebook || data.socialYoutube
        ? {
            instagram: data.socialInstagram || undefined,
            facebook: data.socialFacebook || undefined,
            youtube: data.socialYoutube || undefined,
          }
        : null,
  });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Přehled</h3>
        <p className="text-sm text-gray-500">
          Zkontrolujte údaje. Klikněte na &bdquo;Dokončit&ldquo; pro uložení a
          zobrazení veřejného profilu.
        </p>
      </div>

      <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-900">
            Profil vyplněn z {completeness.percent} %
          </span>
        </div>
        <div className="w-full bg-white rounded-full h-2 overflow-hidden">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReviewField label="Profilová fotka" value={data.avatar ? "Nahráno" : "—"} />
        <ReviewField label="Cover fotka" value={data.coverPhoto ? "Nahráno" : "—"} />
        <ReviewField
          label="Typy vozidel"
          value={data.specializations.join(", ") || "—"}
        />
        <ReviewField
          label="Služby"
          value={data.services.join(", ") || "—"}
        />
        <ReviewField
          label="Jazyky"
          value={data.languageSkills.join(", ") || "—"}
        />
        <ReviewField label="Město" value={data.city || "—"} />
        <ReviewField label="Motto" value={data.motto || "—"} />
        <ReviewField
          label="Zkušenosti"
          value={
            data.yearsExperience !== ""
              ? `${data.yearsExperience} let`
              : "—"
          }
        />
        <ReviewField label="Web" value={data.website || "—"} />
        <ReviewField
          label="Sociální sítě"
          value={
            [
              data.socialInstagram && "Instagram",
              data.socialFacebook && "Facebook",
              data.socialYoutube && "YouTube",
            ]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />
      </div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-0.5">
        {label}
      </div>
      <div className="text-sm text-gray-900 truncate">{value}</div>
    </div>
  );
}
