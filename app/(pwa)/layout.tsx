export default function PwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-16">{children}</main>
      {/* TODO: Bottom Navigation */}
    </div>
  );
}
