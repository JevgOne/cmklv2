import { SeoMetadataTable } from "@/components/admin/seo/SeoMetadataTable";

export default function SeoMetadataPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
            <span>Admin</span>
            <span>/</span>
            <span>SEO</span>
            <span>/</span>
            <span className="text-gray-900">Metadata</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-gray-900">Správa metadata</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prohlížejte a editujte SEO metadata všech stránek platformy
          </p>
        </div>
      </div>

      <SeoMetadataTable />
    </div>
  );
}
