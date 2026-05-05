import { z } from 'zod';

export const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  status: z.enum(['Active', 'Inactive', 'Suspended', 'Left']).default('Active'),
  designation: z.string().optional(),
  department: z.string().optional(),
  employment_type: z.string().optional(),
  date_of_joining: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  cell_number: z.string().optional(),
  personal_email: z.string().email('Invalid email').optional().or(z.literal('')),
  company_email: z.string().email('Invalid email').optional().or(z.literal('')),
  ctc: z.number().min(0, 'Salary cannot be negative').optional(),
});

export type EmployeeSchema = z.infer<typeof employeeSchema>;
