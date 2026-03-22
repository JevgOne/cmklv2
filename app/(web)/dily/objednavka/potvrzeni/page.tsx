"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DilyPotvrzeniPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id") ?? "---";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-green-600">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Objednavka prijata!
          </h1>
          <p className="text-gray-500 mb-6">
            Dekujeme za vasi objednavku. Potvrzeni jsme odeslali na vas email.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 inline-block">
            <span className="text-sm text-gray-500">Cislo objednavky</span>
            <div className="text-lg font-bold text-gray-900 font-mono mt-1">
              #{orderId.slice(0, 12).toUpperCase()}
            </div>
          </div>
          <div className="space-y-3 text-sm text-gray-500 mb-8">
            <p>Stav vasi objednavky muzete sledovat v sekci Moje objednavky.</p>
            <p>V pripade platby prevodem obdrzite platebni udaje emailem.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dily/moje-objednavky" className="no-underline">
              <Button variant="primary">Moje objednavky</Button>
            </Link>
            <Link href="/dily" className="no-underline">
              <Button variant="outline">Zpet do shopu</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
