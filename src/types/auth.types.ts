import { UserRoles } from './common.types';
import { Database } from './database.types';

export type AuthUser = {
  id: string;
  aud: string;
  role: UserRoles;
  email: string;
  email_confirmed_at: Date;
  phone: string;
  confirmed_at: Date;
  last_sign_in_at: Date;
  app_metadata: AppMetadata;
  user_metadata: Data;
  identities: Identity[];
  created_at: Date;
  updated_at: Date;
  is_anonymous: boolean;
};

export type AppMetadata = {
  provider: string;
  providers: string[];
};

export type Identity = {
  identity_id: string;
  id: string;
  user_id: string;
  identity_data: Data;
  provider: string;
  last_sign_in_at: Date;
  created_at: Date;
  updated_at: Date;
  email: string;
};

export type Data = {
  document_number: string;
  document_type: string;
  email: string;
  email_verified: boolean;
  first_name: string;
  last_name: string;
  phone_verified: boolean;
  role: string;
  sub: string;
};

export type UserProfile = Database['public']['Tables']['profiles']['Row'];

export type OtpTypes = 'email' | 'invite';
