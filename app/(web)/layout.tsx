import { Navbar } from "@/components/web/Navbar";
import { Footer } from "@/components/web/Footer";
import { CompareProvider } from "@/components/web/CompareContext";
import { CompareBar } from "@/components/web/CompareBar";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompareProvider>
      <Navbar />
      <main className="min-h-[calc(100vh-72px)]">{children}</main>
      <Footer />
      <CompareBar />
    </CompareProvider>
  );
}
