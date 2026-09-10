'use client';

import { JotaiProvider } from '@/lib/providers/JotaiProvider';
import { initPostHogClient } from '@/lib/posthog/client';
import { UserHydrator } from '@/components/providers/UserHydrator';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useRouter } from 'next/navigation';
import { PostHogProvider } from 'posthog-js/react';

const posthog = initPostHogClient();

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>['push']>[1]
    >;
  }
}

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>
        <JotaiProvider>
          <UserHydrator />
          <HeroUIProvider navigate={router.push}>
            <ToastProvider placement="top-center" />
            {children}
          </HeroUIProvider>
        </JotaiProvider>
      </PostHogProvider>
      {/* Hidden during e2e runs — its floating toggle button overlaps and
          intercepts clicks on real UI (e.g. the message composer's submit
          button) since it renders in `next dev`, which e2e always runs against. */}
      {!process.env.NEXT_PUBLIC_E2E_FEATURE_FLAGS && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
