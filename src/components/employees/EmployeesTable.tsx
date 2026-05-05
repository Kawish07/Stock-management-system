'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { Edit, Trash2, Search, Users, UserCheck, UserX } from 'lucide-react';
import type { Employee } from '@/types/employee.types';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  Inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  Suspended: 'bg-amber-100 text-amber-700 border-amber-200',
  Left: 'bg-red-100 text-red-700 border-red-200',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`${STATUS_COLORS[status] ?? ''} hover:${STATUS_COLORS[status] ?? ''}`}>
      {status}
    </Badge>
  );
}

export function EmployeesTable() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const { data, isLoading, isError, error, refetch } = useEmployees({ search });
  const deleteEmployee = useDeleteEmployee();

  const employees = data?.data ?? [];

  const active = employees.filter((e) => e.status === 'Active').length;
  const inactive = employees.filter((e) => e.status !== 'Active').length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteEmployee.mutateAsync(deleteTarget.name);
    setDeleteTarget(null);
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <TableErrorState error={error?.message ?? 'Failed to load employees'} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total', value: data?.total ?? 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active', value: active, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inactive / Left', value: inactive, icon: UserX, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border shadow-none">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description={search ? 'Try a different search term.' : 'Add your first employee to get started.'}
          icon={Users}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.name}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{emp.employee_name || `${emp.first_name} ${emp.last_name ?? ''}`.trim()}</p>
                      {emp.cell_number && (
                        <p className="text-xs text-muted-foreground">{emp.cell_number}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{emp.company}</TableCell>
                  <TableCell>{emp.designation ?? '—'}</TableCell>
                  <TableCell>{emp.department ?? '—'}</TableCell>
                  <TableCell>
                    {emp.date_of_joining
                      ? format(new Date(emp.date_of_joining), 'dd MMM yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={emp.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/employees/${encodeURIComponent(emp.name)}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(emp)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deleteTarget?.employee_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteEmployee.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
