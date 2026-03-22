"use client";

export default function NewContractLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-hidden">
      <div className="h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
