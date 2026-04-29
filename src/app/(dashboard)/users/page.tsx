import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { UsersTable } from '@/components/users/UsersTable';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Users | StockFlow',
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user access and permissions"
        actions={
          <Link href="/users/new" className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-2" />
            + Invite User
          </Link>
        }
      />
      <UsersTable />
    </div>
  );
}
