import { DocumentUpload } from "@/components/pwa/onboarding/DocumentUpload";

export default function OnboardingDocumentsPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Dokumenty</h2>
      <p className="text-sm text-gray-500 mb-6">
        Nahrajte potřebné dokumenty pro ověření vaší identity a oprávnění k podnikání.
      </p>
      <DocumentUpload />
    </div>
  );
}
