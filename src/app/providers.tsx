"use client";

import { JotaiProvider } from "@/lib/providers/JotaiProvider";
import { NextUIProvider } from "@nextui-org/react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
  posthog.init(posthogKey, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <JotaiProvider>
        <NextUIProvider>{children}</NextUIProvider>;
      </JotaiProvider>
    </PostHogProvider>
  );
}
