import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function PartnerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <PartnerLayout>{children}</PartnerLayout>
    </AuthProvider>
  );
}
