import { permanentRedirect } from "next/navigation";

/**
 * 301 alias: `/tag/[slug]` → `/makleri/[slug]`
 * Zachycuje alt SEO URL tvar (`tag/` prefix).
 */
export default async function TagAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/makleri/${slug}`);
}
