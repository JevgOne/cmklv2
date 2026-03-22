import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function OnboardingApprovalPage() {
  return (
    <div className="text-center py-12">
      {/* Waiting animation */}
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50">
        <svg className="w-12 h-12 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Cekame na schvaleni
      </h2>

      <p className="text-gray-500 mb-2 max-w-sm mx-auto">
        Vas profil byl odeslan ke schvaleni. Manazer vas bude kontaktovat.
      </p>

      <p className="text-sm text-gray-400 mb-8">
        Obvykle do 24 hodin
      </p>

      {/* Info cards */}
      <div className="bg-white rounded-2xl shadow-card p-6 mb-6 text-left max-w-sm mx-auto">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Co se deje dal?</h3>
        <ul className="space-y-2.5">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0 mt-0.5">1</div>
            <span className="text-sm text-gray-600">Manazer zkontroluje vase dokumenty</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0 mt-0.5">2</div>
            <span className="text-sm text-gray-600">Overí vasi smlouvu a podpis</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xs font-bold shrink-0 mt-0.5">3</div>
            <span className="text-sm text-gray-600">Aktivuje vas ucet a budete moci zacit pracovat</span>
          </li>
        </ul>
      </div>

      <Link href="/">
        <Button variant="outline" size="default">
          Zpet na uvod
        </Button>
      </Link>
    </div>
  );
}
