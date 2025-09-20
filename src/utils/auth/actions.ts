'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { identifyUser } from '@/lib/posthog/ssr';
import { createClient } from '@/utils/supabase/server';

export async function signin(formData: FormData) {
  const supabase = await createClient();

  const credentials = {
    email: formData.get('email') as string,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm`,
    },
  };

  const { error, data } = await supabase.auth.signInWithOtp(credentials);

  if (error) {
    return { success: false, error: error.code };
  }

  revalidatePath('/', 'layout');
  return { success: true, data };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error, data: userData } = await supabase.auth.signUp(data);

  if (error) {
    redirect('/error');
  }

  if (userData.user) {
    await identifyUser(userData.user.id, {
      email: userData.user.email,
      created_at: userData.user.created_at,
      is_new_user: true,
    });
  }

  revalidatePath('/', 'layout');
  redirect('/feed');
}

export async function signout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Error signing out
  }
  redirect('/login');
}
