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
    <div className="flex flex-col w-full h-full gap-8 p-4">
      {children}
      {user}
      {group}
    </div>
  );
}
