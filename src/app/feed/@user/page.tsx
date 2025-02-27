import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FeedUser from "@/components/feed/FeedUser";

export default async function UserFeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/login");
  }
  const { data: userData } = await supabase
    .from("profiles")
    .select()
    .eq("id", user.id)
    .single();

  return <FeedUser user={userData} />;
}
