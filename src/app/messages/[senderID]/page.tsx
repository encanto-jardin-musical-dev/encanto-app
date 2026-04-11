import NavigationBar from "@/components/common/NavigationBar";
import MessageInput from "@/components/messages/MessageInput";
import MessagesList from "@/components/messages/MessagesList";
import MessagesUserData from "@/components/messages/MessagesUserData";

type MessagePageProps = {
  params: Promise<{
    senderID: string;
  }>;
};

export default async function MessagePage({ params }: MessagePageProps) {
  const { senderID } = await params;

  return (
    <div className="grid grid-rows-[auto_auto_1fr_auto] h-full gap-4">
      <NavigationBar backRoute="/messages" />
      <MessagesUserData senderID={senderID} />
      <MessagesList senderID={senderID} />
      <MessageInput receiverId={senderID} />
    </div>
  );
}
