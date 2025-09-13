import { headers } from 'next/headers';
import { trackServerEvent } from './server';

export async function trackPageView(pathname: string, userId?: string) {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const referer = headersList.get('referer') || '';

  await trackServerEvent(
    '$pageview',
    {
      $current_url: pathname,
      $referrer: referer,
      $user_agent: userAgent,
    },
    userId
  );
}

export async function trackServerAction(
  action: string,
  properties?: Record<string, unknown>,
  userId?: string
) {
  console.log('trackServerAction');
  await trackServerEvent(action, properties, userId);
}

export async function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
) {
  await trackServerEvent(
    '$identify',
    {
      distinct_id: userId,
      $set: properties,
    },
    userId
  );
}

