"use client";

import { JotaiProvider } from "@/lib/providers/JotaiProvider";
import { HeroUIProvider } from "@heroui/react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useRouter } from "next/navigation";

if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
  });
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <PostHogProvider client={posthog}>
      <JotaiProvider>
        <HeroUIProvider navigate={router.push}>{children}</HeroUIProvider>
      </JotaiProvider>
    </PostHogProvider>
  );
}
