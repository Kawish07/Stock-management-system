import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import type { CreateUserDto, UpdateUserDto, User } from '@/types/user.types';
import toast from 'react-hot-toast';

export const USERS_KEY = 'users';
export const USER_ROLES_KEY = 'user-roles';

function updateUsersCache(current: User[] | undefined, nextUser: User, mode: 'create' | 'update') {
  if (!current) {
    return current;
  }

  const existingIndex = current.findIndex((user) => user.name === nextUser.name);
  if (existingIndex >= 0) {
    const data = [...current];
    data[existingIndex] = { ...data[existingIndex], ...nextUser };
    return data;
  }

  if (mode === 'create') {
    return [nextUser, ...current];
  }

  return current;
}

export function useUsers() {
  return useQuery({
    queryKey: [USERS_KEY],
    queryFn: () => usersService.getAllUsers(),
    retry: 2,
    retryDelay: 1000,
  });
}

export function useUser(email: string) {
  return useQuery({
    queryKey: [USERS_KEY, email],
    queryFn: () => usersService.getUser(email),
    enabled: !!email,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: [USER_ROLES_KEY],
    queryFn: () => usersService.getRoles(),
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserDto) => usersService.createUser(data),
    onSuccess: (user) => {
      queryClient.setQueryData([USERS_KEY], (current: User[] | undefined) =>
        updateUsersCache(current, user, 'create')
      );
      queryClient.setQueryData([USERS_KEY, user.email], user);
      queryClient.invalidateQueries({ queryKey: [USERS_KEY], refetchType: 'inactive' });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, data }: { email: string; data: UpdateUserDto }) =>
      usersService.updateUser(email, data),
    onSuccess: (user, variables) => {
      queryClient.setQueryData([USERS_KEY], (current: User[] | undefined) =>
        updateUsersCache(current, user, 'update')
      );
      queryClient.setQueryData([USERS_KEY, variables.email], user);
      queryClient.setQueryData([USERS_KEY, user.email], user);
      if (variables.email !== user.email) {
        queryClient.removeQueries({ queryKey: [USERS_KEY, variables.email], exact: true });
      }
      queryClient.invalidateQueries({ queryKey: [USERS_KEY], refetchType: 'inactive' });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
}

export function useToggleUserAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, enabled }: { email: string; enabled: 0 | 1 }) =>
      usersService.toggleUserAccess(email, enabled),
    onSuccess: (user, variables) => {
      queryClient.setQueryData([USERS_KEY], (current: User[] | undefined) =>
        updateUsersCache(current, user, 'update')
      );
      queryClient.setQueryData([USERS_KEY, variables.email], user);
      queryClient.setQueryData([USERS_KEY, user.email], user);
      queryClient.invalidateQueries({ queryKey: [USERS_KEY], refetchType: 'inactive' });
      toast.success(
        variables.enabled === 1 ? 'User activated' : 'User deactivated'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user access');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => usersService.deleteUser(email),
    onSuccess: (_, email) => {
      queryClient.setQueryData([USERS_KEY], (current: User[] | undefined) =>
        current?.filter((user) => user.email !== email && user.name !== email)
      );
      queryClient.removeQueries({ queryKey: [USERS_KEY, email], exact: true });
      queryClient.invalidateQueries({ queryKey: [USERS_KEY], refetchType: 'inactive' });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
}
