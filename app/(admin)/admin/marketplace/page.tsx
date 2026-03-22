import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { FlipManagement } from "@/components/admin/marketplace/FlipManagement";
import { PaymentConfirmation } from "@/components/admin/marketplace/PaymentConfirmation";

// Dummy data
const stats = {
  totalFlips: 45,
  activeFlips: 12,
  pendingApprovals: 3,
  totalVolume: 8450000,
  pendingPayments: 5,
};

const pendingFlips = [
  {
    id: "10",
    brand: "Skoda",
    model: "Superb III 2.0 TDI",
    year: 2018,
    status: "PENDING_APPROVAL",
    purchasePrice: 320000,
    repairCost: 55000,
    estimatedSalePrice: 489000,
    dealerName: "Jan Novak",
    createdAt: "2026-03-20",
  },
  {
    id: "11",
    brand: "Hyundai",
    model: "i30 1.4 T-GDI",
    year: 2019,
    status: "PENDING_APPROVAL",
    purchasePrice: 195000,
    repairCost: 25000,
    estimatedSalePrice: 289000,
    dealerName: "Petra Mala",
    createdAt: "2026-03-19",
  },
  {
    id: "12",
    brand: "Peugeot",
    model: "308 SW 1.5 BlueHDi",
    year: 2020,
    status: "PENDING_APPROVAL",
    purchasePrice: 225000,
    repairCost: 20000,
    estimatedSalePrice: 319000,
    dealerName: "Karel Dvorak",
    createdAt: "2026-03-18",
  },
];

const allFlips = [
  ...pendingFlips,
  {
    id: "1",
    brand: "Skoda",
    model: "Octavia III 1.6 TDI",
    year: 2016,
    status: "IN_REPAIR",
    purchasePrice: 180000,
    repairCost: 45000,
    estimatedSalePrice: 299000,
    dealerName: "Jan Novak",
    createdAt: "2026-02-15",
  },
  {
    id: "2",
    brand: "VW",
    model: "Golf VII 1.4 TSI",
    year: 2017,
    status: "FOR_SALE",
    purchasePrice: 165000,
    repairCost: 30000,
    estimatedSalePrice: 259000,
    dealerName: "Jan Novak",
    createdAt: "2026-01-20",
  },
  {
    id: "3",
    brand: "BMW",
    model: "320d F30",
    year: 2015,
    status: "FUNDING",
    purchasePrice: 220000,
    repairCost: 65000,
    estimatedSalePrice: 389000,
    dealerName: "Tomas Horak",
    createdAt: "2026-03-10",
  },
];

const pendingPayments = [
  {
    id: "p1",
    investorName: "Investor A",
    amount: 100000,
    opportunityLabel: "Skoda Octavia III",
    variableSymbol: "MP1A2B3C4D",
    createdAt: "2026-03-21",
  },
  {
    id: "p2",
    investorName: "Investor B",
    amount: 75000,
    opportunityLabel: "Skoda Octavia III",
    variableSymbol: "MP1A2B3C4E",
    createdAt: "2026-03-20",
  },
  {
    id: "p3",
    investorName: "Investor C",
    amount: 50000,
    opportunityLabel: "BMW 320d F30",
    variableSymbol: "MP3D4E5F6G",
    createdAt: "2026-03-19",
  },
];

export default function AdminMarketplacePage() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <span>Admin</span>
          <span>/</span>
          <span className="text-gray-900">Marketplace</span>
        </div>
        <h1 className="text-[28px] font-extrabold text-gray-900">
          Marketplace
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon="🔄"
          iconColor="orange"
          value={stats.totalFlips.toString()}
          label="Celkem flipu"
        />
        <StatCard
          icon="⚡"
          iconColor="blue"
          value={stats.activeFlips.toString()}
          label="Aktivnich"
        />
        <StatCard
          icon="⏳"
          iconColor="red"
          value={stats.pendingApprovals.toString()}
          label="Ke schvaleni"
        />
        <StatCard
          icon="💰"
          iconColor="green"
          value={`${(stats.totalVolume / 1000000).toFixed(1)}M`}
          label="Celkovy objem"
        />
      </div>

      {/* Pending Payments */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Cekajici platby
          </h2>
          <Badge variant="rejected">{pendingPayments.length}</Badge>
        </div>
        <PaymentConfirmation payments={pendingPayments} />
      </div>

      {/* Pending Approvals */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Ke schvaleni
          </h2>
          <Badge variant="pending">{pendingFlips.length}</Badge>
        </div>
        <FlipManagement flips={pendingFlips} />
      </div>

      {/* All Flips */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Vsechny flipy
        </h2>
        <FlipManagement flips={allFlips} />
      </div>
    </div>
  );
}
