import { z } from 'zod';

export const createUserSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(140),
  last_name: z.string().min(1, 'Last name is required').max(140),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  mobile_no: z.string().optional(),
  username: z.string().optional(),
  new_password: z.string().optional().or(z.literal('')),
  send_welcome_email: z.boolean().default(true),
  enabled: z.boolean().default(true),
  roles: z.array(z.string()).min(1, 'Select at least one role'),
}).superRefine((data, ctx) => {
  if (!data.send_welcome_email && !data.new_password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['new_password'],
      message: 'Enter a password when welcome email is disabled',
    });
  }

  const password = data.new_password?.trim() ?? '';
  if (!password) return;

  if (password.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['new_password'],
      message: 'Password must be at least 8 characters',
    });
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['new_password'],
      message: 'Use upper/lowercase letters, a number, and a special character',
    });
  }

  const weakTerms = [
    data.first_name,
    data.last_name,
    data.email.split('@')[0],
  ]
    .map((v) => v?.toLowerCase().trim())
    .filter((v): v is string => !!v && v.length >= 3);

  const passwordLower = password.toLowerCase();
  if (weakTerms.some((term) => passwordLower.includes(term))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['new_password'],
      message: 'Password should not include first name, last name, or email name',
    });
  }
});

export const updateUserSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(140),
  last_name: z.string().min(1, 'Last name is required').max(140),
  mobile_no: z.string().optional(),
  username: z.string().optional(),
  enabled: z.boolean().default(true),
  roles: z.array(z.string()).min(1, 'Select at least one role'),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
