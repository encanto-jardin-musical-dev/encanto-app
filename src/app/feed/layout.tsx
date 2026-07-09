export default function FeedLayout({
  children,
  user,
  group,
}: {
  children: React.ReactNode;
  user: React.ReactNode;
  group: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 p-4">
      <section className="flex flex-col w-full md:w-80 gap-8">
        {children}
        {user}
        {group}
      </section>
    </main>
  );
}
