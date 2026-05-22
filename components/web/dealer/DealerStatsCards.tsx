interface StatsData {
  activeListings: number;
  totalInquiries: number;
  soldCount: number;
  responseRate: number;
}

export function DealerStatsCards({ stats }: { stats: StatsData }) {
  const cards = [
    { label: "Aktivní inzeráty", value: stats.activeListings, color: "text-blue-600" },
    { label: "Poptávky celkem", value: stats.totalInquiries, color: "text-orange-600" },
    { label: "Prodáno (měsíc)", value: stats.soldCount, color: "text-green-600" },
    { label: "Response rate", value: `${stats.responseRate}%`, color: "text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">{card.label}</div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
