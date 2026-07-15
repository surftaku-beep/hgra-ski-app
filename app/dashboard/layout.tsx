import { BrandWatermark } from "@/components/brand-watermark";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <BrandWatermark className="-top-32 -right-32" />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
