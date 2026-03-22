import { NotificationPreferences } from "@/components/pwa/settings/NotificationPreferences";

export const metadata = {
  title: "Nastaveni notifikaci | Carmakler",
};

export default function NotificationSettingsPage() {
  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Nastaveni notifikaci
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Zvolte, ktere notifikace chcete dostavat
        </p>
      </div>

      <NotificationPreferences />
    </div>
  );
}
