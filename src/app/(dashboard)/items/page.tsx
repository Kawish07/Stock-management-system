import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { ItemsTable } from '@/components/items/ItemsTable';
import { Plus } from 'lucide-react';

export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Items"
        description="Manage your inventory items and stock levels"
        actions={
          <Link href="/items/new" className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Link>
        }
      />
      <ItemsTable />
    </div>
  );
}
