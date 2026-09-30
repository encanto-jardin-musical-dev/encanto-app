import { USER_ROLES } from '@/lib/const';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  if (!user.email_confirmed_at) {
    redirect('/feed');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || profile?.role !== USER_ROLES.ADMIN) {
    redirect('/feed');
  }

  return (
    <div className="flex flex-col w-full h-full min-h-0">{children}</div>
  );
}
