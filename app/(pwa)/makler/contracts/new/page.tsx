import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ContractWizard } from "@/components/pwa/contracts/ContractWizard";

export default async function NewContractPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <ContractWizard
      brokerId={session.user.id}
      brokerName={`${session.user.firstName} ${session.user.lastName}`}
    />
  );
}
