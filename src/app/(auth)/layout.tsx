export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-screen flex-1 items-center justify-center p-4">
      <section className="flex flex-col w-full md:w-80 gap-8 items-center justify-center">
        {children}
      </section>
    </main>
  );
}
