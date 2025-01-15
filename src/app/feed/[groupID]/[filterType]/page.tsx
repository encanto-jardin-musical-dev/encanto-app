import Link from "next/link";

export default async function GroupFeedFilterPage({
  params,
}: {
  params: Promise<{ filterType: string; groupID: string }>;
}) {
  const { groupID, filterType } = await params;
  return (
    <>
      <h1>{`This is the group feed: ${groupID} filtered by ${filterType}`}</h1>
      <Link href={`/feed/${groupID}/tasks`}>Tasks</Link>
    </>
  );
}
