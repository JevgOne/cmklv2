import { ProfileForm } from "@/components/pwa/onboarding/ProfileForm";

export default function OnboardingProfilePage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Vas profil</h2>
      <p className="text-sm text-gray-500 mb-6">
        Vyplnte zakladni informace o sobe. Tyto udaje uvidí vasi klienti.
      </p>
      <ProfileForm />
    </div>
  );
}
