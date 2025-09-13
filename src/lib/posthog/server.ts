import { PostHog } from 'posthog-node';

let posthogServer: PostHog | null = null;

export function getPostHogServer(): PostHog {
  if (!posthogServer && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthogServer = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogServer!;
}

export async function trackServerEvent(
  event: string,
  properties?: Record<string, unknown>,
  distinctId?: string
) {
  if (typeof window !== 'undefined') return;
  
  try {
    const posthog = getPostHogServer();
    posthog.capture({
      distinctId: distinctId || 'anonymous',
      event,
      properties,
    });
    await posthog.flush();
  } catch (error) {
    console.error('PostHog server tracking error:', error);
  }
}