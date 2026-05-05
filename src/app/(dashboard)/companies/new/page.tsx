import { PageHeader } from '@/components/shared/PageHeader';
import { CompanyForm } from '@/components/companies/CompanyForm';

export const metadata = { title: 'New Company | StockFlow' };

export default function NewCompanyPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Add Company"
        description="Register a new company in the system"
      />
      <CompanyForm />
    </div>
  );
}
