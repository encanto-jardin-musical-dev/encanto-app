'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/**
 * Client component that checks for authenticated user and redirects to feed if logged in
 * This allows parent components to use server-side hooks like useTranslations
 */
export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      let user;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) return;
        user = data.user;
      } catch {
        // No active session — user is not logged in, stay on login page
        return;
      }

      if (user) {
        router.push('/feed');
      }
    };

    void checkSession();
  }, [router]);

  // Return null - this component only handles redirect logic
  return null;
}
