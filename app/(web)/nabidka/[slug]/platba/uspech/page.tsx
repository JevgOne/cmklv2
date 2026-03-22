import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-lg mx-auto px-4">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Platba proběhla úspěšně!
          </h1>
          <p className="text-gray-500 mb-6">
            Děkujeme za vaši platbu. Na email obdržíte potvrzení. Makléř vás bude
            kontaktovat ohledně předání vozidla.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-orange-800 mb-1">Co se stane dál?</h3>
            <ol className="text-sm text-orange-700 space-y-1 list-decimal list-inside">
              <li>Makléř vás kontaktuje do 24 hodin</li>
              <li>Domluvíte termín předání vozidla</li>
              <li>Při předání podepíšete předávací protokol</li>
              <li>Prodejce obdrží výplatu do 5 pracovních dní</li>
            </ol>
          </div>

          <Link href="/nabidka">
            <Button variant="outline" size="lg" className="w-full">
              Zpět na nabídku
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
