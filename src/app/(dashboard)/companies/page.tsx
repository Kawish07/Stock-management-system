import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { CompaniesTable } from '@/components/companies/CompaniesTable';
import { Plus } from 'lucide-react';

export const metadata = { title: 'Companies | StockFlow' };

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage your business companies and organizations"
        actions={
          <Link href="/companies/new" className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Link>
        }
      />
      <CompaniesTable />
    </div>
  );
}
