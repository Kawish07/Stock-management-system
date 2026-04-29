import { KPICards } from '@/components/dashboard/KPICards';
import { StockChart } from '@/components/dashboard/StockChart';
import { RecentEntries } from '@/components/dashboard/RecentEntries';
import { PageHeader } from '@/components/shared/PageHeader';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your stock operations"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/invoices/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
              <Plus className="h-4 w-4" /> New Invoice
            </Link>
            <Link href="/customers/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
              <Plus className="h-4 w-4" /> New Customer
            </Link>
            <Link href="/stock-entries/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}>
              <Plus className="h-4 w-4" /> Stock Entry
            </Link>
            <Link href="/items/new" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}>
              <Plus className="h-4 w-4" /> Add Item
            </Link>
          </div>
        }
      />
      <KPICards />
      <StockChart />
      <RecentEntries />
    </div>
  );
}
