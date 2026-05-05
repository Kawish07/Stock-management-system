'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companySchema, type CompanySchema } from '@/lib/validators/company.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApiErrorAlert } from '@/components/shared/ApiErrorAlert';
import { useCreateCompany, useUpdateCompany } from '@/hooks/useCompanies';
import type { Company } from '@/types/company.types';
import { Loader2 } from 'lucide-react';

const CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR'] as const;

interface CompanyFormProps {
  company?: Company;
}

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const isEdit = !!company;
  const [apiError, setApiError] = useState<string | null>(null);

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const isLoading = createCompany.isPending || updateCompany.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanySchema>({
    resolver: zodResolver(companySchema) as never,
    defaultValues: {
      company_name: company?.company_name ?? '',
      abbr: company?.abbr ?? '',
      default_currency: company?.default_currency ?? 'PKR',
      country: company?.country ?? '',
      phone_no: company?.phone_no ?? '',
      email: company?.email ?? '',
      website: company?.website ?? '',
      tax_id: company?.tax_id ?? '',
    },
  });

  const onSubmit = async (values: CompanySchema) => {
    setApiError(null);
    try {
      if (isEdit) {
        await updateCompany.mutateAsync({ name: company.name, data: values });
      } else {
        await createCompany.mutateAsync(values);
      }
      router.push('/companies');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {apiError && <ApiErrorAlert error={apiError} onDismiss={() => setApiError(null)} />}

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Company Name */}
          <div className="space-y-1.5">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              {...register('company_name')}
              placeholder="e.g. Acme Corporation"
              disabled={isEdit}
            />
            {errors.company_name && (
              <p className="text-xs text-destructive">{errors.company_name.message}</p>
            )}
          </div>

          {/* Abbreviation */}
          <div className="space-y-1.5">
            <Label htmlFor="abbr">Abbreviation *</Label>
            <Input
              id="abbr"
              {...register('abbr')}
              placeholder="e.g. ACME"
              disabled={isEdit}
              className="uppercase"
            />
            {errors.abbr && (
              <p className="text-xs text-destructive">{errors.abbr.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Short code for the company. Cannot be changed after creation.</p>
          </div>

          {/* Default Currency */}
          <div className="space-y-1.5">
            <Label htmlFor="default_currency">Default Currency *</Label>
            <select
              id="default_currency"
              {...register('default_currency')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.default_currency && (
              <p className="text-xs text-destructive">{errors.default_currency.message}</p>
            )}
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register('country')}
              placeholder="e.g. Pakistan"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="phone_no">Phone</Label>
            <Input id="phone_no" {...register('phone_no')} placeholder="+92 300 0000000" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="contact@company.com" />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...register('website')} placeholder="https://company.com" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tax_id">Tax ID / NTN</Label>
            <Input id="tax_id" {...register('tax_id')} placeholder="Tax identification number" />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push('/companies')}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? 'Save Changes' : 'Create Company'}
        </Button>
      </div>
    </form>
  );
}
