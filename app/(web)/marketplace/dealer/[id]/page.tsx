import { redirect } from "next/navigation";

export default async function DealerDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/marketplace/deals/${id}`);
}
