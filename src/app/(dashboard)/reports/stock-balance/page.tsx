import { PageHeader } from '@/components/shared/PageHeader';
import { StockBalanceTable } from '@/components/reports/StockBalanceTable';

export default function StockBalancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Balance"
        description="Current stock levels across all warehouses"
      />
      <StockBalanceTable />
    </div>
  );
}
