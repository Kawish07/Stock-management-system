'use client';

import { use } from 'react';
import { useEmployee } from '@/hooks/useEmployees';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { TableErrorState } from '@/components/shared/TableErrorState';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditEmployeePage({ params }: Props) {
  const { id } = use(params);
  const { data: employee, isLoading, isError, error, refetch } = useEmployee(decodeURIComponent(id));

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError) return <TableErrorState error={error?.message ?? 'Failed to load employee'} onRetry={() => refetch()} />;
  if (!employee) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Edit Employee"
        description={`Editing: ${employee.employee_name || employee.first_name}`}
      />
      <EmployeeForm employee={employee} />
    </div>
  );
}
