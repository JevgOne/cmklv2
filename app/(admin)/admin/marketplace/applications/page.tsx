import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { value: "", label: "Vše" },
  { value: "NEW", label: "Nové" },
  { value: "CONTACTED", label: "Kontaktované" },
  { value: "APPROVED", label: "Schválené" },
  { value: "REJECTED", label: "Zamítnuté" },
  { value: "SPAM", label: "Spam" },
] as const;

const STATUS_BADGE: Record<string, "new" | "pending" | "success" | "rejected" | "default" | "warning"> = {
  NEW: "new",
  CONTACTED: "pending",
  APPROVED: "success",
  REJECTED: "rejected",
  SPAM: "default",
};

const ROLE_LABEL: Record<string, string> = {
  VERIFIED_DEALER: "Realizátor",
  INVESTOR: "Investor",
};

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || "";
  const search = params.search || "";
  const page = Math.max(1, Number(params.page) || 1);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [applications, total, newCount] = await Promise.all([
    prisma.marketplaceApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.marketplaceApplication.count({ where }),
    prisma.marketplaceApplication.count({ where: { status: "NEW" } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <Link href="/admin/marketplace" className="hover:text-orange-500 transition-colors no-underline text-gray-500">
            Admin / Marketplace
          </Link>
          <span>/</span>
          <span className="text-gray-900">Žádosti o přístup</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-extrabold text-gray-900">
            Žádosti o přístup
          </h1>
          {newCount > 0 && <Badge variant="rejected">{newCount} nových</Badge>}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/marketplace/applications${tab.value ? `?status=${tab.value}` : ""}${search ? `${tab.value ? "&" : "?"}search=${search}` : ""}`}
            className={`no-underline px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="mb-6">
        <input type="hidden" name="status" value={statusFilter} />
        <input
          name="search"
          type="text"
          defaultValue={search}
          placeholder="Hledat podle jména, emailu, firmy..."
          className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
      </form>

      {/* Table */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
          Žádné žádosti k zobrazení.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Jméno</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Email</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Telefon</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Role</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Datum</th>
                  <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Status</th>
                  <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Akce</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {app.firstName} {app.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{app.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={app.role === "INVESTOR" ? "new" : "pending"}>
                        {ROLE_LABEL[app.role] || app.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {app.createdAt.toISOString().split("T")[0]}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_BADGE[app.status] || "default"}>
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/marketplace/applications/${app.id}`}
                        className="text-orange-500 hover:text-orange-600 text-sm font-medium no-underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {total} žádostí celkem
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/marketplace/applications?${statusFilter ? `status=${statusFilter}&` : ""}${search ? `search=${search}&` : ""}page=${page - 1}`}
                    className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 no-underline hover:bg-gray-200"
                  >
                    Předchozí
                  </Link>
                )}
                <span className="px-3 py-1.5 text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/admin/marketplace/applications?${statusFilter ? `status=${statusFilter}&` : ""}${search ? `search=${search}&` : ""}page=${page + 1}`}
                    className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 no-underline hover:bg-gray-200"
                  >
                    Další
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
