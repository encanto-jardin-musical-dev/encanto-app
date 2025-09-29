import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { OtpTypes } from '@/types/auth.types';
import { identifyUser } from '@/lib/posthog/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/feed';

  if (token_hash && type) {
    const supabase = await createClient();

    // Verify the OTP token
    const {
      data: { user },
      error,
    } = await supabase.auth.verifyOtp({
      type: type as OtpTypes,
      token_hash,
    });

    if (!error) {
      // Identify the user in PostHog
      await identifyUser(user?.id as string, {
        email: user?.email,
        is_new_user: true,
      });

      // Redirect to the next page or feed
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/error`);
}
