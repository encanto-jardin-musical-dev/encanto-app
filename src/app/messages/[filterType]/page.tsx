import { Link } from "@heroui/react";

export default async function FilteredMessagePage({
  params,
}: {
  params: Promise<{ filterType: string | "all" | "team" | "group" }>;
}) {
  const { filterType } = await params;
  return (
    <>
      <h1>{`Here is the messages filtered by ${filterType}`}</h1>
      <Link href={`/messages/all/01`}>Message Example</Link>
      <Link href={`/messages/team/02`}>Back</Link>
    </>
  );
}
