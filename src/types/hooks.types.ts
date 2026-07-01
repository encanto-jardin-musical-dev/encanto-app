import { UserRoles } from './common.types';

export type QueryParams = {
  params?: {
    userID?: string;
    groupID?: string;
    userRole?: UserRoles;
    roleFilter?: UserRoles;
    userIds?: string[];
    childFilter?: string;
  };
  options?: {
    enabled?: boolean;
  };
};
