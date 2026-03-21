import { Navbar } from "@/components/web/Navbar";
import { Footer } from "@/components/web/Footer";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-72px)]">{children}</main>
      <Footer />
    </>
  );
}
