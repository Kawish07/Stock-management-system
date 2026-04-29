'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUsers, useToggleUserAccess, useDeleteUser } from '@/hooks/useUsers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { Edit, Trash2, Search, Users, UserCheck, UserX, ShieldCheck, Plus } from 'lucide-react';
import type { User } from '@/types/user.types';
import { AVAILABLE_ROLES } from '@/types/user.types';
import type { ElementType } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { UserForm } from '@/components/users/UserForm';

// ── Avatar color by first letter ───────────────────────────────────────────
const AVATAR_COLORS: Record<string, string> = {
  A: 'bg-red-100 text-red-700',
  B: 'bg-orange-100 text-orange-700',
  C: 'bg-amber-100 text-amber-700',
  D: 'bg-yellow-100 text-yellow-700',
  E: 'bg-lime-100 text-lime-700',
  F: 'bg-green-100 text-green-700',
  G: 'bg-emerald-100 text-emerald-700',
  H: 'bg-teal-100 text-teal-700',
  I: 'bg-cyan-100 text-cyan-700',
  J: 'bg-sky-100 text-sky-700',
  K: 'bg-blue-100 text-blue-700',
  L: 'bg-indigo-100 text-indigo-700',
  M: 'bg-violet-100 text-violet-700',
  N: 'bg-purple-100 text-purple-700',
  O: 'bg-fuchsia-100 text-fuchsia-700',
  P: 'bg-pink-100 text-pink-700',
  Q: 'bg-rose-100 text-rose-700',
  R: 'bg-red-100 text-red-700',
  S: 'bg-orange-100 text-orange-700',
  T: 'bg-amber-100 text-amber-700',
  U: 'bg-lime-100 text-lime-700',
  V: 'bg-green-100 text-green-700',
  W: 'bg-emerald-100 text-emerald-700',
  X: 'bg-teal-100 text-teal-700',
  Y: 'bg-cyan-100 text-cyan-700',
  Z: 'bg-sky-100 text-sky-700',
};

function getAvatarColor(name: string): string {
  const letter = (name?.[0] ?? 'U').toUpperCase();
  return AVATAR_COLORS[letter] ?? 'bg-indigo-100 text-indigo-700';
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U';
}

function getPrimaryRole(user: User): string {
  if (!user.roles || user.roles.length === 0) return '—';
  // Prefer higher-privilege roles first
  const priority = [
    'System Manager',
    'Stock Manager',
    'Purchase Manager',
    'Report Manager',
    'Accounts User',
    'Stock User',
  ];
  const roleNames = user.roles.map((r) => r.role);
  return priority.find((p) => roleNames.includes(p)) ?? roleNames[0];
}

function formatLastLogin(lastLogin?: string): string {
  if (!lastLogin) return 'Never';
  try {
    return formatDistanceToNow(new Date(lastLogin), { addSuffix: true });
  } catch {
    return lastLogin;
  }
}

// ── Stats row ───────────────────────────────────────────────────────────────
function UserStats({ users }: { users: User[] }) {
  const total = users.length;
  const active = users.filter((u) => u.enabled === 1).length;
  const inactive = users.filter((u) => u.enabled === 0).length;
  const admins = users.filter((u) =>
    u.roles?.some((r) => r.role === 'System Manager')
  ).length;

  const stats = [
    { label: 'Total Users', value: total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Active Users', value: active, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/40' },
    { label: 'Inactive Users', value: inactive, icon: UserX, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40' },
    { label: 'Admins', value: admins, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="border shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
              </div>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main table ──────────────────────────────────────────────────────────────
interface UsersTableProps {
  onInviteUser?: () => void;
}

export function UsersTable({ onInviteUser }: UsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: users = [], isLoading, isError, error, refetch } = useUsers();
  const toggleAccess = useToggleUserAccess();
  const deleteUser = useDeleteUser();

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch =
        !q ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);

      const matchesRole =
        !roleFilter || u.roles?.some((r) => r.role === roleFilter);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'active' ? u.enabled === 1 : u.enabled === 0);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, debouncedSearch, roleFilter, statusFilter]);

  const handleToggle = (user: User) => {
    const next: 0 | 1 = user.enabled === 1 ? 0 : 1;
    toggleAccess.mutate({ email: user.name, enabled: next });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.name, {
      onSettled: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      {!isLoading && !isError && <UserStats users={users} />}

      {/* Filters + action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Roles</option>
          {AVAILABLE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <Button
          type="button"
          className="sm:ml-auto"
          onClick={() => {
            if (onInviteUser) onInviteUser();
            else router.push('/users/new');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton rows={5} columns={6} />
      ) : isError ? (
        <TableErrorState
          error={(error as Error)?.message || 'Failed to load users'}
          onRetry={refetch}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users as ElementType}
          title="No users found"
          description={
            debouncedSearch || roleFilter || statusFilter
              ? 'Try adjusting your filters.'
              : 'No system users exist yet.'
          }
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/80 dark:bg-zinc-800/50 hover:bg-zinc-50/80">
                <TableHead className="w-[260px]">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Primary Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const initials = getInitials(user.first_name, user.last_name);
                const avatarColor = getAvatarColor(user.first_name || user.full_name);
                const primaryRole = getPrimaryRole(user);
                const isActive = user.enabled === 1;

                return (
                  <TableRow key={user.name} className="hover:bg-muted/40 transition-colors">
                    {/* Avatar + Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor}`}
                        >
                          {initials}
                        </div>
                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {user.full_name || `${user.first_name} ${user.last_name}`.trim()}
                        </span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                      {user.email}
                    </TableCell>

                    {/* Primary role */}
                    <TableCell>
                      {primaryRole !== '—' ? (
                        <Badge
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {primaryRole}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {isActive ? (
                        <Badge className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-100 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border border-red-200 hover:bg-red-100 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    {/* Last login */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatLastLogin(user.last_login)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {/* Enable/disable toggle */}
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleToggle(user)}
                          disabled={toggleAccess.isPending}
                          aria-label={isActive ? 'Deactivate user' : 'Activate user'}
                        />

                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditTarget(user)}
                          className="h-8 w-8"
                          aria-label="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(user)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                          aria-label="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        description={`This will remove ${deleteTarget?.full_name ?? 'this user'}'s access permanently. This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteUser.isPending}
        variant="destructive"
      />

      <Sheet open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit User</SheetTitle>
            <SheetDescription>
              Update account details and permissions.
            </SheetDescription>
          </SheetHeader>
          {editTarget && (
            <div className="px-4 pb-6">
              <UserForm
                user={editTarget}
                onSuccess={() => setEditTarget(null)}
                onCancel={() => setEditTarget(null)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
