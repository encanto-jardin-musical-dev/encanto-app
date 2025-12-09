'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

/**
 * Client component that checks for authenticated user and redirects to feed if logged in
 * This allows parent components to use server-side hooks like useTranslations
 */
export default function AuthRedirect() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push('/feed');
      } else {
        setIsChecking(false);
      }
    };

    checkSession();
  }, [router]);

  // Return null - this component only handles redirect logic
  return null;
}
