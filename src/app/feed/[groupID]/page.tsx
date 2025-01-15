import Link from "next/link";

export default async function GroupFeedPage({
  params,
}: {
  params: Promise<{ groupID: string }>;
}) {
  const groupID = (await params).groupID;
  return (
    <>
      <h1>{`This is the group feed: ${groupID}`}</h1>
      <Link href={`/feed/${groupID}/messages`}>Messages</Link>
    </>
  );
}
