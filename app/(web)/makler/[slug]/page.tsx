import { permanentRedirect } from "next/navigation";

export default async function MaklerRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/profil/${slug}`);
}
