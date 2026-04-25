import { ContractSign } from "@/components/pwa/onboarding/ContractSign";

export default function OnboardingContractPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Smlouva o spolupraci</h2>
      <p className="text-sm text-gray-500 mb-6">
        Posledni krok! Podpis smlouvy a muzete zacit vydelavat.
      </p>
      <ContractSign />
    </div>
  );
}
