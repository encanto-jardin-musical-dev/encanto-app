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
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Error checking session:', error);
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
