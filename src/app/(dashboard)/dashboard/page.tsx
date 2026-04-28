import { KPICards } from '@/components/dashboard/KPICards';
import { StockChart } from '@/components/dashboard/StockChart';
import { RecentEntries } from '@/components/dashboard/RecentEntries';
import { PageHeader } from '@/components/shared/PageHeader';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your stock operations" />
      <KPICards />
      <StockChart />
      <RecentEntries />
    </div>
  );
}
