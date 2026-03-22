"use client";

import { useSearchParams } from "next/navigation";
import { SuccessView } from "@/components/pwa/vehicles/new/SuccessView";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const offline = searchParams.get("offline") === "1";

  return <SuccessView offline={offline} />;
}
