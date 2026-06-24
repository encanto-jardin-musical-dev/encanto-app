export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-screen flex-1">
      <section className="flex flex-col w-full md:w-80 h-full">
        {children}
      </section>
    </main>
  );
}
