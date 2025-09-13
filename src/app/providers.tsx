'use client';

import { JotaiProvider } from '@/lib/providers/JotaiProvider';
import { initPostHogClient } from '@/lib/posthog/client';
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
          <HeroUIProvider navigate={router.push}>
            <ToastProvider placement="top-center" />
            {children}
          </HeroUIProvider>
        </JotaiProvider>
      </PostHogProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
