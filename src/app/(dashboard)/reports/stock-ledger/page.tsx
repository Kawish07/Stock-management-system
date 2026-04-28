import { PageHeader } from '@/components/shared/PageHeader';
import { StockLedgerTable } from '@/components/reports/StockLedgerTable';

export default function StockLedgerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Ledger"
        description="Full history of stock movements and transactions"
      />
      <StockLedgerTable />
    </div>
  );
}
