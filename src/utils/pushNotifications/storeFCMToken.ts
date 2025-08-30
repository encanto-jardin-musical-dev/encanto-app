'use server';

import { createClient } from '@/utils/supabase/server';

// get user id
const getUserId = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id;
};

export const storeFCMToken = async (token: string) => {
  const userId = await getUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({
      fcm_token: token,
    })
    .eq('id', userId);
  if (error) throw error;
  return data;
};
