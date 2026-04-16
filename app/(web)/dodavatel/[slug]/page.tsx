import { permanentRedirect } from "next/navigation";

export default async function DodavatelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/dily/vrakoviste/${slug}`);
}
