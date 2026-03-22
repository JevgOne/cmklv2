export default function NewPartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto pt-[calc(56px+env(safe-area-inset-top))] pb-20">
      {children}
    </div>
  );
}
