import { PageHeader } from '@/components/shared/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';

export const metadata = {
  title: 'New Customer | StockFlow',
};

export default function NewCustomerPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Add Customer"
        description="Create a new customer profile"
      />
      <CustomerForm />
    </div>
  );
}
