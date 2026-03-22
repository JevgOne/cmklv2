import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface UpsellBannerProps {
  /** Počet dnů online */
  daysOnline: number;
  /** ID inzerátu */
  listingId: string;
  /** Jen pro soukromé inzerenty */
  isPrivate: boolean;
}

export function UpsellBanner({ daysOnline, listingId, isPrivate }: UpsellBannerProps) {
  if (!isPrivate || daysOnline < 14) return null;

  let urgency: "low" | "medium" | "high" = "low";
  let message = "";

  if (daysOnline >= 45) {
    urgency = "high";
    message = `Váš inzerát je ${daysOnline} dní online bez prodeje. Makléř prodá rychleji — bez starostí.`;
  } else if (daysOnline >= 30) {
    urgency = "medium";
    message = `Váš inzerát je ${daysOnline} dní online. Svěřte prodej makléři a ušetřete čas.`;
  } else {
    urgency = "low";
    message = `Váš inzerát je ${daysOnline} dní online. Makléř může pomoct prodat rychleji.`;
  }

  const gradients = {
    low: "from-blue-50 to-blue-100/50",
    medium: "from-orange-50 to-orange-100/50",
    high: "from-red-50 to-red-100/50",
  };

  const borderColors = {
    low: "border-blue-200",
    medium: "border-orange-200",
    high: "border-red-200",
  };

  return (
    <Card className={`p-5 bg-gradient-to-br ${gradients[urgency]} border ${borderColors[urgency]}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm">
          {urgency === "high" ? "🔥" : urgency === "medium" ? "⏰" : "💡"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm">
            {urgency === "high" ? "Potřebujete pomoct s prodejem?" : "Prodejte rychleji s makléřem"}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
          <div className="flex gap-2 mt-3">
            <Link href="/chci-prodat" className="no-underline">
              <Button variant="primary" size="sm">
                Chci makléře
              </Button>
            </Link>
            <Link href={`/nabidka/${listingId}/promote`} className="no-underline">
              <Button variant="outline" size="sm">
                Zvýraznit TOP
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
