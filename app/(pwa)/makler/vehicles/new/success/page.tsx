import { SuccessView } from "@/components/pwa/vehicles/new/SuccessView";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const offline = params.offline === "1";
  const vehicleId = params.vehicleId ?? null;

  return <SuccessView offline={offline} vehicleId={vehicleId} />;
}
