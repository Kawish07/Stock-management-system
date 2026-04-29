'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserSchema,
  type UpdateUserSchema,
} from '@/lib/validators/user.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { AVAILABLE_ROLES } from '@/types/user.types';
import type { User } from '@/types/user.types';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
  user?: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type CreateForm = CreateUserSchema;
type UpdateForm = UpdateUserSchema;

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const router = useRouter();
  const isEdit = !!user;
  const [apiError, setApiError] = useState<string | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isLoading = createUser.isPending || updateUser.isPending;

  // ── Create form ────────────────────────────────────────────────────────────
  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createUserSchema) as never,
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      mobile_no: '',
      username: '',
      new_password: '',
      send_welcome_email: true,
      enabled: true,
      roles: ['Stock User'],
    },
  });

  // ── Edit form ──────────────────────────────────────────────────────────────
  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateUserSchema) as never,
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      mobile_no: user?.mobile_no ?? '',
      username: user?.username ?? '',
      enabled: user?.enabled === 1,
      roles: user?.roles?.map((r) => r.role) ?? ['Stock User'],
    },
  });

  const form = isEdit ? updateForm : createForm;
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form as ReturnType<typeof useForm<CreateForm & UpdateForm>>;

  // Auto-generate username from email (create only)
  const emailValue = isEdit ? '' : (watch as (n: string) => string)('email') ?? '';
  useEffect(() => {
    if (!isEdit && emailValue) {
      const generated = emailValue.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
      setValue('username', generated, { shouldValidate: false });
    }
  }, [emailValue, isEdit, setValue]);

  const onSubmit = async (values: CreateForm | UpdateForm) => {
    setApiError(null);
    try {
      if (isEdit && user) {
        const v = values as UpdateForm;
        await updateUser.mutateAsync({
          email: user.name,
          data: {
            first_name: v.first_name,
            last_name: v.last_name,
            mobile_no: v.mobile_no || undefined,
            username: v.username || undefined,
            enabled: v.enabled ? 1 : 0,
            roles: v.roles.map((r) => ({ role: r })),
          },
        });
        if (onSuccess) onSuccess();
        else router.push('/users');
      } else {
        const v = values as CreateForm;
        await createUser.mutateAsync({
          email: v.email,
          first_name: v.first_name,
          last_name: v.last_name,
          mobile_no: v.mobile_no || undefined,
          username: v.username || undefined,
          new_password: v.new_password || undefined,
          user_type: 'System User',
          send_welcome_email: v.send_welcome_email ? 1 : 0,
          roles: v.roles.map((r) => ({ role: r })),
        });
        if (onSuccess) onSuccess();
        else router.push('/users');
      }
    } catch (err) {
      setApiError((err as Error).message || 'An unexpected error occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-6 max-w-2xl">
      <ApiErrorAlert error={apiError} onDismiss={() => setApiError(null)} />

      {/* ── Personal Info ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                placeholder="John"
                {...register('first_name')}
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name && (
                <p className="text-xs text-red-500">{errors.first_name.message as string}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="last_name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                placeholder="Doe"
                {...register('last_name')}
                aria-invalid={!!errors.last_name}
              />
              {errors.last_name && (
                <p className="text-xs text-red-500">{errors.last_name.message as string}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              disabled={isEdit}
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message as string}</p>
            )}
            {isEdit && (
              <p className="text-xs text-muted-foreground">Email cannot be changed after creation.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mobile_no">Mobile Number</Label>
              <Input
                id="mobile_no"
                type="tel"
                placeholder="+1 234 567 8900"
                {...register('mobile_no')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="john.doe"
                {...register('username')}
              />
              {!isEdit && (
                <p className="text-xs text-muted-foreground">Auto-generated from email.</p>
              )}
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="new_password">Create Password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Set temporary password"
                autoComplete="new-password"
                {...register('new_password')}
                aria-invalid={!!errors.new_password}
              />
              {errors.new_password && (
                <p className="text-xs text-red-500">{errors.new_password.message as string}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use at least 8 chars with uppercase, lowercase, number, and symbol. Avoid names.
                Leave empty if you want ERPNext to send credentials by email.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Access ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enabled toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Account Status</p>
              <p className="text-xs text-muted-foreground">
                Inactive users cannot log in.
              </p>
            </div>
            <Controller
              control={control as never}
              name="enabled"
              render={({ field }) => (
                <Switch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Account enabled"
                />
              )}
            />
          </div>

          {/* Send welcome email (create only) */}
          {!isEdit && (
            <Controller
              control={control as never}
              name="send_welcome_email"
              render={({ field }) => (
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    id="send_welcome_email"
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="send_welcome_email" className="cursor-pointer">
                      Send Welcome Email
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      User will receive login credentials via email.
                    </p>
                  </div>
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Roles ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Controller
            control={control as never}
            name="roles"
            render={({ field }) => {
              const selected: string[] = field.value ?? [];
              const toggle = (role: string) => {
                const next = selected.includes(role)
                  ? selected.filter((r) => r !== role)
                  : [...selected, role];
                field.onChange(next);
              };
              return (
                <div className="space-y-2">
                  {AVAILABLE_ROLES.map(({ value, label }) => (
                    <div key={value} className="flex items-center gap-3">
                      <Checkbox
                        id={`role-${value}`}
                        checked={selected.includes(value)}
                        onCheckedChange={() => toggle(value)}
                      />
                      <Label htmlFor={`role-${value}`} className="cursor-pointer font-normal">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          {errors.roles && (
            <p className="text-xs text-red-500">{errors.roles.message as string}</p>
          )}

          <Separator />
          <p className="text-xs text-muted-foreground">
            User will receive an email with login instructions if &quot;Send Welcome Email&quot; is
            checked.
          </p>
        </CardContent>
      </Card>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading} className="min-w-[130px]">
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (onCancel) onCancel();
            else router.push('/users');
          }}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
