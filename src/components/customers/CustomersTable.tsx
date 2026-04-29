'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, Users, Building2, User, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import type { Customer } from '@/types/customer.types';

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CustomersTable() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useCustomers({
    search: debouncedSearch || undefined,
    customer_type: typeFilter ? (typeFilter as 'Company' | 'Individual') : undefined,
    customer_group: groupFilter || undefined,
    limit: 50,
    start: 0,
  });

  const removeCustomer = useDeleteCustomer();

  const rows = data?.data ?? [];

  const customerGroups = useMemo(() => {
    const all = rows.map((c) => c.customer_group).filter(Boolean);
    return Array.from(new Set(all)).sort();
  }, [rows]);

  const total = rows.length;
  const companies = rows.filter((c) => c.customer_type === 'Company').length;
  const individuals = rows.filter((c) => c.customer_type === 'Individual').length;
  const active = rows.filter((c) => c.disabled === 0).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, icon: Users, className: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
          { label: 'Companies', value: companies, icon: Building2, className: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
          { label: 'Individuals', value: individuals, icon: User, className: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
          { label: 'Active', value: active, icon: UserCheck, className: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
        ].map((s) => (
          <Card key={s.label} className="border shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-0.5">{s.value}</p>
              </div>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.className}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-3 justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Search</Label>
            <Input
              className="h-8 w-56 text-sm"
              placeholder="Name, mobile, email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <select
              className="h-8 min-w-32 rounded-md border border-input bg-background px-3 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Company">Company</option>
              <option value="Individual">Individual</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Group</Label>
            <select
              className="h-8 min-w-40 rounded-md border border-input bg-background px-3 text-sm"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">All Groups</option>
              {customerGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <Button className="gap-1.5" onClick={() => router.push('/customers/new')}>
          <Plus className="h-4 w-4" /> + Add Customer
        </Button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={6} columns={8} />
      ) : isError ? (
        <TableErrorState error={(error as Error)?.message || 'Failed to load customers'} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Add your first customer to start managing sales."
          action={{ label: 'Add Customer', onClick: () => router.push('/customers/new') }}
        />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Avatar</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.name} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-xs font-semibold">
                      {initials(c.customer_name || c.name)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{c.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{c.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {c.customer_type === 'Company' ? (
                      <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100">Company</Badge>
                    ) : (
                      <Badge className="bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-100">Individual</Badge>
                    )}
                  </TableCell>
                  <TableCell>{c.mobile_no || '—'}</TableCell>
                  <TableCell>{c.email_id || '—'}</TableCell>
                  <TableCell>{c.customer_group || '—'}</TableCell>
                  <TableCell>
                    {c.disabled === 0 ? (
                      <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100">Active</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View"
                        onClick={() => router.push(`/customers/${encodeURIComponent(c.name)}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                        onClick={() => router.push(`/customers/${encodeURIComponent(c.name)}?edit=1`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        title="Delete"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Customer"
        description={`Delete ${deleteTarget?.customer_name ?? 'this customer'}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={removeCustomer.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          removeCustomer.mutate(deleteTarget.name, {
            onSettled: () => setDeleteTarget(null),
          });
        }}
      />
    </div>
  );
}
