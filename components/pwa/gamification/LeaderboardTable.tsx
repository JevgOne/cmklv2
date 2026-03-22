import { Card } from "@/components/ui/Card";
import { LevelBadge } from "./LevelBadge";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  brokerId: string;
  name: string;
  avatar: string | null;
  level: string;
  salesCount: number;
  totalCommission: number;
}

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  myPosition: number | null;
  mySalesCount: number;
  myCommission: number;
  totalBrokers: number;
  currentUserId: string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-extrabold text-sm">
        1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-extrabold text-sm">
        2
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-extrabold text-sm">
        3
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-sm">
      {rank}
    </div>
  );
}

export function LeaderboardTable({
  leaderboard,
  myPosition,
  mySalesCount,
  myCommission,
  totalBrokers,
  currentUserId,
}: LeaderboardTableProps) {
  return (
    <div className="space-y-3">
      {/* Moje pozice */}
      <Card className="p-4 bg-orange-50 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-orange-600 font-medium">Vase pozice</p>
            <p className="text-2xl font-extrabold text-orange-600">
              {myPosition ? `${myPosition}.` : "-"}{" "}
              <span className="text-sm font-normal text-orange-500">
                z {totalBrokers} makleru
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{mySalesCount} prodeju</p>
            <p className="text-xs text-gray-500">{formatPrice(myCommission)}</p>
          </div>
        </div>
      </Card>

      {/* Zebricek */}
      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <Card
            key={entry.brokerId}
            className={cn(
              "p-3",
              entry.brokerId === currentUserId && "ring-2 ring-orange-300"
            )}
          >
            <div className="flex items-center gap-3">
              <RankBadge rank={entry.rank} />
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0 overflow-hidden">
                {entry.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.avatar}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  entry.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">
                  {entry.name}
                </p>
                <LevelBadge level={entry.level} size="sm" />
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">
                  {entry.salesCount} prodeju
                </p>
                <p className="text-xs text-gray-500">
                  {formatPrice(entry.totalCommission)}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {leaderboard.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500 text-sm">
              Tento mesic zatim zadne prodeje
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
