'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeSchema, type EmployeeSchema } from '@/lib/validators/employee.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import { useCreateEmployee, useUpdateEmployee, useDesignations, useDepartments } from '@/hooks/useEmployees';
import { useCompanies } from '@/hooks/useCompanies';
import type { Employee } from '@/types/employee.types';
import { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from '@/types/employee.types';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmployeeFormProps {
  employee?: Employee;
}

export function EmployeeForm({ employee }: EmployeeFormProps) {
  const router = useRouter();
  const isEdit = !!employee;
  const [apiError, setApiError] = useState<string | null>(null);

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const isLoading = createEmployee.isPending || updateEmployee.isPending;

  const { data: companiesData } = useCompanies({ limit: 100 });
  const companies = companiesData?.data ?? [];

  const { data: designations = [] } = useDesignations();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EmployeeSchema>({
    resolver: zodResolver(employeeSchema) as never,
    defaultValues: {
      first_name: employee?.first_name ?? '',
      last_name: employee?.last_name ?? '',
      company: employee?.company ?? '',
      status: employee?.status ?? 'Active',
      designation: employee?.designation ?? '',
      department: employee?.department ?? '',
      employment_type: employee?.employment_type ?? '',
      date_of_joining: employee?.date_of_joining ?? '',
      date_of_birth: employee?.date_of_birth ?? '',
      gender: employee?.gender ?? undefined,
      cell_number: employee?.cell_number ?? '',
      personal_email: employee?.personal_email ?? '',
      company_email: employee?.company_email ?? '',
      ctc: employee?.ctc ?? undefined,
    },
  });

  const selectedCompany = watch('company');
  const { data: departments = [] } = useDepartments(selectedCompany || undefined);

  const onSubmit = async (values: EmployeeSchema) => {
    setApiError(null);
    try {
      const payload = {
        ...values,
        personal_email: values.personal_email || undefined,
        company_email: values.company_email || undefined,
        date_of_joining: values.date_of_joining || undefined,
        date_of_birth: values.date_of_birth || undefined,
        designation: values.designation || undefined,
        department: values.department || undefined,
        employment_type: values.employment_type || undefined,
        cell_number: values.cell_number || undefined,
      };

      if (isEdit) {
        await updateEmployee.mutateAsync({ name: employee.name, data: payload });
        toast.success('Employee saved successfully!');
      } else {
        await createEmployee.mutateAsync(payload);
        toast.success('Employee created successfully!');
      }
      router.push('/employees');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {apiError && <ApiErrorAlert error={apiError} onDismiss={() => setApiError(null)} />}

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First Name *</Label>
            <Input id="first_name" {...register('first_name')} placeholder="John" />
            {errors.first_name && (
              <p className="text-xs text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" {...register('last_name')} placeholder="Doe" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              {...register('gender')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select gender...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cell_number">Phone / Cell</Label>
            <Input id="cell_number" {...register('cell_number')} placeholder="+92 300 0000000" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="personal_email">Personal Email</Label>
            <Input
              id="personal_email"
              type="email"
              {...register('personal_email')}
              placeholder="john@personal.com"
            />
            {errors.personal_email && (
              <p className="text-xs text-destructive">{errors.personal_email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employment Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="company">Company *</Label>
            <select
              id="company"
              {...register('company')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.company_name}
                </option>
              ))}
            </select>
            {errors.company && (
              <p className="text-xs text-destructive">{errors.company.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status *</Label>
            <select
              id="status"
              {...register('status')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {EMPLOYEE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="designation">Designation</Label>
            <select
              id="designation"
              {...register('designation')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select designation...</option>
              {designations.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <select
              id="department"
              {...register('department')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {selectedCompany && departments.length === 0 && (
              <p className="text-xs text-muted-foreground">No departments found for selected company.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employment_type">Employment Type</Label>
            <select
              id="employment_type"
              {...register('employment_type')}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select type...</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date_of_joining">Date of Joining</Label>
            <Input id="date_of_joining" type="date" {...register('date_of_joining')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company_email">Work Email</Label>
            <Input
              id="company_email"
              type="email"
              {...register('company_email')}
              placeholder="john@company.com"
            />
            {errors.company_email && (
              <p className="text-xs text-destructive">{errors.company_email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Salary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Salary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="ctc">Monthly Salary (CTC)</Label>
            <Input
              id="ctc"
              type="number"
              step="0.01"
              min="0"
              {...register('ctc', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.ctc && (
              <p className="text-xs text-destructive">{errors.ctc.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Cost to Company — monthly gross salary
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push('/employees')}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
}
