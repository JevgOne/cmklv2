import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function InzerceKatalogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Nabídka vozidel</h1>
      <p className="text-gray-500 mb-8">Všechny inzeráty najdete v hlavní nabídce vozidel.</p>
      <Link href="/nabidka">
        <Button variant="primary" size="lg">Zobrazit nabídku</Button>
      </Link>
    </div>
  );
}
