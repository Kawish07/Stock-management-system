'use client';

import { useState } from 'react';
import { useEmployees, useUpdateEmployee } from '@/hooks/useEmployees';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import { Search, DollarSign, Edit, Loader2 } from 'lucide-react';
import type { Employee } from '@/types/employee.types';

function formatCurrency(amount?: number) {
  if (!amount) return '—';
  return 'PKR ' + amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function EditSalaryDialog({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const [salary, setSalary] = useState<string>(employee.ctc?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const updateEmployee = useUpdateEmployee();

  const handleSave = async () => {
    setError(null);
    const val = parseFloat(salary);
    if (isNaN(val) || val < 0) {
      setError('Please enter a valid salary amount.');
      return;
    }
    try {
      await updateEmployee.mutateAsync({ name: employee.name, data: { ctc: val } });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update salary.');
    }
  };

  return (
    <div className="space-y-4">
      {error && <ApiErrorAlert error={error} onDismiss={() => setError(null)} />}
      <div className="space-y-1.5">
        <Label>Employee</Label>
        <p className="text-sm font-medium">{employee.employee_name}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="salary">Monthly Salary (CTC) *</Label>
        <Input
          id="salary"
          type="number"
          min="0"
          step="0.01"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={updateEmployee.isPending}>
          {updateEmployee.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Salary
        </Button>
      </div>
    </div>
  );
}

export function SalariesTable() {
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<Employee | null>(null);

  const { data, isLoading, isError, error, refetch } = useEmployees({ search, limit: 200 });
  const employees = data?.data ?? [];

  const totalSalary = employees.reduce((s, e) => s + (e.ctc ?? 0), 0);
  const withSalary = employees.filter((e) => e.ctc && e.ctc > 0).length;

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <TableErrorState error={error?.message ?? 'Failed to load employees'} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Monthly Payroll</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalSalary)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employees with Salary</p>
              <p className="text-xl font-bold text-blue-600">{withSalary} / {employees.length}</p>
            </div>
          </CardContent>
        </Card>
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

      {employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description="Add employees first to manage their salaries."
          icon={DollarSign}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Monthly Salary</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.name}>
                  <TableCell className="font-medium">
                    {emp.employee_name || `${emp.first_name} ${emp.last_name ?? ''}`.trim()}
                  </TableCell>
                  <TableCell>{emp.company}</TableCell>
                  <TableCell>{emp.designation ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        emp.status === 'Active'
                          ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }
                    >
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={!emp.ctc ? 'text-muted-foreground' : 'font-medium text-emerald-700'}>
                      {formatCurrency(emp.ctc)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditTarget(emp)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit Salary Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Salary</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <EditSalaryDialog
              employee={editTarget}
              onClose={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
