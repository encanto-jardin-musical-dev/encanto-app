import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@nextui-org/react";
import { signout } from "@/utils/auth/actions";

export default async function FeedPage() {
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
        {`Hello, ${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}`}
      </h1>
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
