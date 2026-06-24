import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FeedUser from "@/components/feed/FeedUser";

const AVATAR_SIGNED_URL_TTL = 60 * 60; // 1 hour

/** Maps a profile role to its storage bucket. */
function avatarBucket(role: string | null): string | null {
  if (role === "teacher") return "teacher-avatars";
  if (role === "parent") return "parent-avatars";
  if (role === "admin") return "admin-avatars";
  return null;
}

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

  // Resolve a signed URL for the user's avatar if they have one.
  let avatarSignedUrl: string | null = null;
  const bucket = avatarBucket(userData?.role ?? null);
  if (bucket && userData?.avatar_url) {
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(userData.avatar_url, AVATAR_SIGNED_URL_TTL);
    avatarSignedUrl = signedData?.signedUrl ?? null;
  }

  return <FeedUser user={userData} avatarSignedUrl={avatarSignedUrl} />;
}
