import { PageHeader } from '@/components/shared/PageHeader';
import { CustomersTable } from '@/components/customers/CustomersTable';

export const metadata = {
  title: 'Customers | StockFlow',
};

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer master data, contact details, and status"
      />
      <CustomersTable />
    </div>
  );
}
