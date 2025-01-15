import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@nextui-org/react";
import { signout } from "../(auth)/login/actions";
import Link from "next/link";
export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/login");
  }
  return (
    <>
      <h1>
        {`Hello, ${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name} here are your messages`}
      </h1>
      <ul>
        <li>
          <Link href="/messages/all">All</Link>
        </li>
        <li>
          <Link href="/messages/team">Team</Link>
        </li>
        <li>
          <Link href="/messages/group">Group</Link>
        </li>
      </ul>
      <Button
        onPress={signout}
        type="button"
        variant="bordered"
        color="secondary"
      >
        Sign Out
      </Button>
    </>
  );
}
