export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      {children}
    </main>
  );
}
