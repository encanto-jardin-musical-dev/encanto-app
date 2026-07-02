import NavigationBar from "@/components/common/NavigationBar";
import MessageInput from "@/components/messages/MessageInput";
import MessagesList from "@/components/messages/MessagesList";
import MessagesUserData from "@/components/messages/MessagesUserData";
import { getProfileById } from "@/queries/users/get-profile-by-id";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

type MessagePageProps = {
  params: Promise<{
    senderID: string;
  }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MessagePage({ params }: MessagePageProps) {
  const { senderID } = await params;

  if (!UUID_PATTERN.test(senderID)) notFound();

  const supabase = await createClient();
  const profile = await getProfileById(supabase, senderID);
  if (!profile) notFound();

  return (
    <div className="grid grid-rows-[auto_auto_1fr_auto] h-full gap-4">
      <NavigationBar backRoute="/messages" />
      <MessagesUserData senderID={senderID} />
      <MessagesList senderID={senderID} />
      <MessageInput receiverId={senderID} />
    </div>
  );
}
