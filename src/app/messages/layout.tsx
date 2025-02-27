export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-screen flex-1 p-4">
      <section className="flex flex-col w-full md:w-80 gap-8">
        {children}
      </section>
    </main>
  );
}
