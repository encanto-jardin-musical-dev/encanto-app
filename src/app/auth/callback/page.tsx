'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type PageState = 'loading' | 'error';

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

export default function AuthCallbackPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const hash = window.location.hash;

    // Handle error in hash first (e.g. expired token).
    const hashError = parseHashError(hash);
    if (hashError) {
      setState('error');
      setErrorMessage(hashError);
      return;
    }

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
  }, [router]);

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <p className="text-danger text-lg font-medium">Enlace inválido</p>
        <p className="text-default-500 text-sm max-w-sm">{errorMessage}</p>
        <a href="/" className="text-primary text-sm underline">Volver al inicio</a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
