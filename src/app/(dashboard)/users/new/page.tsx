import { PageHeader } from '@/components/shared/PageHeader';
import { UserForm } from '@/components/users/UserForm';

export const metadata = {
  title: 'Invite User | StockFlow',
};

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invite User"
        description="Create a new system user account"
      />
      <UserForm />
    </div>
  );
}
