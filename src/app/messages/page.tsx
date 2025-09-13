import NavigationBar from '@/components/common/NavigationBar';
import MessagesContactsList from '@/components/messages/MessagesContactsList';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function MessagesPage() {
  // Check if the user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect('/login');
  }

  return (
    <section className="grid grid-rows-[auto_auto_1fr] h-full gap-4">
      <NavigationBar backRoute="/feed" pageTitle="Mensajes" />
      <MessagesContactsList />
    </section>
  );
}
