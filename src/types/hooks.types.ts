import { UserRoles } from './common.types';

export type QueryParams = {
  params?: {
    userID?: string;
    groupID?: string;
    userRole?: UserRoles;
  };
  options?: {
    enabled?: boolean;
  };
};
