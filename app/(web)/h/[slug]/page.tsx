import { permanentRedirect } from "next/navigation";

/**
 * 301 alias: `/h/[slug]` → `/makleri/[slug]`
 * Zachycuje alt SEO URL tvar (krátká `h/` zkratka).
 */
export default async function HashtagAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/makleri/${slug}`);
}
