import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateWorkflowForm } from "@/components/pwa/workflow/CreateWorkflowForm";


export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Nový požadavek | Carmakler",
  description: "Vytvoření nového workflow požadavku.",
};

const ALLOWED_ROLES = ["BROKER", "MANAGER", "REGIONAL_DIRECTOR", "ADMIN"];

export default async function NovyPozadavekPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3 flex items-center gap-3">
          <a
            href="/makler/pozadavky"
            className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
          </a>
          <h1 className="text-lg font-bold text-gray-900">Nový požadavek</h1>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-4 py-6">
        <CreateWorkflowForm />
      </div>
    </div>
  );
}
