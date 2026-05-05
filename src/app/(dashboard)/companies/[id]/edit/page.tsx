'use client';

import { use } from 'react';
import { useCompany } from '@/hooks/useCompanies';
import { PageHeader } from '@/components/shared/PageHeader';
import { CompanyForm } from '@/components/companies/CompanyForm';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { TableErrorState } from '@/components/shared/TableErrorState';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditCompanyPage({ params }: Props) {
  const { id } = use(params);
  const { data: company, isLoading, isError, error, refetch } = useCompany(decodeURIComponent(id));

  if (isLoading) return <LoadingSkeleton rows={8} />;
  if (isError) return <TableErrorState error={error?.message ?? 'Failed to load company'} onRetry={() => refetch()} />;
  if (!company) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Edit Company"
        description={`Editing: ${company.company_name}`}
      />
      <CompanyForm company={company} />
    </div>
  );
}
