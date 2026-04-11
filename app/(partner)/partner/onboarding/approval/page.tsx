import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PartnerOnboardingApprovalPage() {
  return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <div className="flex items-center gap-3 mb-8 px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-500">Profil</span>
        </div>
        <div className="flex-1 h-0.5 bg-orange-500 rounded-full" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-500">Dokumenty</span>
        </div>
        <div className="flex-1 h-0.5 bg-orange-500 rounded-full" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">3</div>
          <span className="text-xs font-medium text-gray-900">Schválení</span>
        </div>
      </div>

      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50">
        <svg className="w-12 h-12 text-orange-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">Čekáme na schválení</h2>
      <p className="text-gray-500 mb-2 max-w-sm mx-auto">
        Vaše registrace byla odeslána ke schválení. Zkontrolujeme vaše dokumenty.
      </p>
      <p className="text-sm text-gray-400 mb-8">Obvykle do 24 hodin</p>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-left max-w-sm mx-auto">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Co se děje dál?</h3>
        <ul className="space-y-2.5">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0 mt-0.5">1</div>
            <span className="text-sm text-gray-600">Zkontrolujeme vaše dokumenty</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0 mt-0.5">2</div>
            <span className="text-sm text-gray-600">Ověříme údaje o firmě</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold shrink-0 mt-0.5">3</div>
            <span className="text-sm text-gray-600">Aktivujeme váš účet a budete moci spravovat nabídky</span>
          </li>
        </ul>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Máte dotaz? Kontaktujte nás na{" "}
        <a href="mailto:podpora@carmakler.cz" className="text-orange-600 font-medium">
          podpora@carmakler.cz
        </a>
      </p>

      <Link href="/">
        <Button variant="outline" size="default">Zpět na úvod</Button>
      </Link>
    </div>
  );
}
