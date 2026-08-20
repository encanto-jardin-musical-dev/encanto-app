import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/login");
  }

  const t = await getTranslations("MessagesEmptyState");

  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full gap-2 text-default-400 px-6 text-center">
      <p className="text-lg font-semibold text-default-500">{t("title")}</p>
      <p className="text-sm">{t("description")}</p>
    </div>
  );
}
