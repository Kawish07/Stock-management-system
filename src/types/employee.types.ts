export interface Employee {
  name: string;
  employee_name: string;
  first_name: string;
  last_name?: string;
  company: string;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Left';
  designation?: string;
  department?: string;
  employment_type?: string;
  date_of_joining?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  cell_number?: string;
  personal_email?: string;
  company_email?: string;
  ctc?: number;
  creation?: string;
  modified?: string;
}

export type CreateEmployeeDto = {
  first_name: string;
  last_name?: string;
  company: string;
  status: Employee['status'];
  designation?: string;
  department?: string;
  employment_type?: string;
  date_of_joining?: string;
  date_of_birth?: string;
  gender?: Employee['gender'];
  cell_number?: string;
  personal_email?: string;
  company_email?: string;
  ctc?: number;
};

export type UpdateEmployeeDto = Partial<CreateEmployeeDto>;

export interface EmployeeSalary {
  employee: string;
  employee_name: string;
  company: string;
  designation?: string;
  department?: string;
  ctc: number;
  status: Employee['status'];
}

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Temporary',
  'Intern',
] as const;

export const EMPLOYEE_STATUSES = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Suspended', label: 'Suspended' },
  { value: 'Left', label: 'Left' },
] as const;
