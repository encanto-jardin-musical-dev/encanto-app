'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { identifyUser, trackServerAction } from '@/lib/posthog/ssr';
import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error, data: userData } =
    await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect('/error');
  }

  if (userData.user) {
    const { id, email, user_metadata } = userData?.user;
    await identifyUser(id, {
      email: email,
      name: `${user_metadata?.first_name} ${user_metadata?.last_name}`,
      role: user_metadata?.role,
    });
  }
  trackServerAction('user_logged');

  revalidatePath('/', 'layout');
  redirect('/feed');
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
