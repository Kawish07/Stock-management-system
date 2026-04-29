export interface UserRole {
  role: string;
}

export interface User {
  name: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  user_type: 'System User' | 'Website User';
  enabled: 1 | 0;
  roles: UserRole[];
  mobile_no?: string;
  username?: string;
  creation?: string;
  last_login?: string;
}

export type CreateUserDto = {
  email: string;
  first_name: string;
  last_name: string;
  mobile_no?: string;
  username?: string;
  new_password?: string;
  user_type: 'System User';
  send_welcome_email: 1 | 0;
  roles: UserRole[];
};

export type UpdateUserDto = {
  first_name?: string;
  last_name?: string;
  mobile_no?: string;
  username?: string;
  enabled?: 1 | 0;
  roles?: UserRole[];
};

export const AVAILABLE_ROLES = [
  { value: 'System Manager', label: 'System Manager' },
  { value: 'Stock Manager', label: 'Stock Manager' },
  { value: 'Stock User', label: 'Stock User' },
  { value: 'Purchase Manager', label: 'Purchase Manager' },
  { value: 'Report Manager', label: 'Report Manager' },
  { value: 'Accounts User', label: 'Accounts User' },
] as const;

export type RoleValue = (typeof AVAILABLE_ROLES)[number]['value'];
