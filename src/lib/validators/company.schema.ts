import { z } from 'zod';

export const companySchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(140),
  abbr: z
    .string()
    .min(1, 'Abbreviation is required')
    .max(10, 'Abbreviation max 10 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Only letters and numbers allowed'),
  default_currency: z.string().min(1, 'Default currency is required'),
  country: z.string().optional(),
  phone_no: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().optional(),
  tax_id: z.string().optional(),
});

export type CompanySchema = z.infer<typeof companySchema>;
