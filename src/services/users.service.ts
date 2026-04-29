import axiosInstance from '@/lib/axios';
import { handleApiError } from '@/lib/errorHandler';
import type { User, CreateUserDto, UpdateUserDto } from '@/types/user.types';

const USER_FIELDS = [
  'name',
  'email',
  'first_name',
  'last_name',
  'full_name',
  'enabled',
  'user_type',
  'last_login',
  'creation',
  'mobile_no',
  'username',
];

const BASE_FILTERS = [
  ['User', 'user_type', '=', 'System User'],
  ['User', 'name', '!=', 'Administrator'],
  ['User', 'name', '!=', 'Guest'],
];

const STOCK_SYSTEM_ROLES = [
  'System Manager',
  'Stock Manager',
  'Stock User',
  'Purchase Manager',
  'Report Manager',
  'Accounts User',
];

export const usersService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const res = await axiosInstance.get('/resource/User', {
        params: {
          fields: JSON.stringify(USER_FIELDS),
          filters: JSON.stringify(BASE_FILTERS),
          limit: 100,
        },
      });

      const users = res.data.data as User[];

      // Fetch roles for each user in parallel (batched to avoid hammering the API)
      const withRoles = await Promise.all(
        users.map(async (user) => {
          try {
            const roleRes = await axiosInstance.get(`/resource/User/${encodeURIComponent(user.name)}`, {
              params: { fields: JSON.stringify(['roles']) },
            });
            return { ...user, roles: roleRes.data.data?.roles ?? [] };
          } catch {
            return { ...user, roles: [] };
          }
        })
      );

      return withRoles;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getUser(email: string): Promise<User> {
    try {
      const res = await axiosInstance.get(`/resource/User/${encodeURIComponent(email)}`);
      return res.data.data as User;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async createUser(data: CreateUserDto): Promise<User> {
    try {
      const payload = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        mobile_no: data.mobile_no,
        username: data.username,
        new_password: data.new_password,
        user_type: 'System User' as const,
        send_welcome_email: data.send_welcome_email ?? 1,
        roles: data.roles?.length ? data.roles : [{ role: 'Stock User' }],
      };
      const res = await axiosInstance.post('/resource/User', payload);
      return res.data.data as User;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async updateUser(email: string, data: UpdateUserDto): Promise<User> {
    try {
      const res = await axiosInstance.put(`/resource/User/${encodeURIComponent(email)}`, data);
      return res.data.data as User;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async toggleUserAccess(email: string, enabled: 0 | 1): Promise<User> {
    try {
      const res = await axiosInstance.put(`/resource/User/${encodeURIComponent(email)}`, {
        enabled,
      });
      return res.data.data as User;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async updateUserRoles(email: string, roles: string[]): Promise<User> {
    try {
      const res = await axiosInstance.put(`/resource/User/${encodeURIComponent(email)}`, {
        roles: roles.map((r) => ({ role: r })),
      });
      return res.data.data as User;
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async deleteUser(email: string): Promise<void> {
    try {
      await axiosInstance.delete(`/resource/User/${encodeURIComponent(email)}`);
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getRoles(): Promise<string[]> {
    try {
      const res = await axiosInstance.get('/resource/Role', {
        params: {
          fields: JSON.stringify(['name']),
          filters: JSON.stringify([
            ['Role', 'name', 'in', STOCK_SYSTEM_ROLES],
          ]),
          limit: 100,
        },
      });
      return (res.data.data as Array<{ name: string }>).map((r) => r.name);
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },

  async getUserRoles(email: string): Promise<string[]> {
    try {
      const res = await axiosInstance.post('/method/frappe.core.doctype.user.user.get_roles', {
        uid: email,
      });
      const message = res.data?.message;
      if (!Array.isArray(message)) return [];
      return message as string[];
    } catch (err) {
      const { message } = handleApiError(err);
      throw new Error(message);
    }
  },
};
