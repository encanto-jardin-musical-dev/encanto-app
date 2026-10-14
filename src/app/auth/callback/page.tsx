'use client';

import { useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

function parseHashError(hash: string): string | null {
  if (!hash.startsWith('#')) return null;
  const params = new URLSearchParams(hash.slice(1));
  const code = params.get('error_code');
  const description = params.get('error_description');
  const error = params.get('error');
  if (!error) return null;
  if (code === 'otp_expired') {
    return 'El enlace de invitación ha expirado. Pídele al administrador que te envíe uno nuevo.';
  }
  return description ?? error;
}

const subscribeToNothing = () => () => {};
const readHashError = () => parseHashError(window.location.hash);
const readHashErrorOnServer = () => null;

export default function AuthCallbackPage() {
  const router = useRouter();
  // Error in the URL hash (e.g. expired token). The hash only exists in the
  // browser, so read it as external state rather than copying it into state.
  const hashError = useSyncExternalStore(
    subscribeToNothing,
    readHashError,
    readHashErrorOnServer,
  );

  useEffect(() => {
    if (hashError) return;

    // Use @supabase/supabase-js directly — it supports implicit flow (hash fragments)
    // natively via detectSessionInUrl. @supabase/ssr browser client uses PKCE only
    // and ignores hash fragments entirely, which is why this page needs its own client.
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth/callback] onAuthStateChange:', event, { session: !!session });
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        subscription.unsubscribe();
        router.replace('/feed');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, hashError]);

  if (hashError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <p className="text-danger text-lg font-medium">Enlace inválido</p>
        <p className="text-default-500 text-sm max-w-sm">{hashError}</p>
        <Link href="/" className="text-primary text-sm underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
