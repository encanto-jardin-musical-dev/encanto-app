import { Link } from "@heroui/react";

export default async function MessagePage({
  params,
}: {
  params: Promise<{
    filterType: string | "all" | "team" | "group";
    messageID: string;
  }>;
}) {
  const { filterType, messageID } = await params;
  return (
    <>
      <h1>{`Message ${messageID} filtered by ${filterType}`}</h1>
      <Link href={`/messages/${filterType}`}>Back to filtered page</Link>
    </>
  );
}
