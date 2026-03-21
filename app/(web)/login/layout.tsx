import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Přihlášení",
  description: "Přihlaste se do svého účtu CarMakléř.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
