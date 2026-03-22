import { ContractSign } from "@/components/pwa/onboarding/ContractSign";

export default function OnboardingContractPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Smlouva o spolupraci</h2>
      <p className="text-sm text-gray-500 mb-6">
        Prectete si smlouvu, podepiste ji a odeslete ke schvaleni.
      </p>
      <ContractSign />
    </div>
  );
}
