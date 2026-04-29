'use client';

import { use } from 'react';
import { useUser } from '@/hooks/useUsers';
import { PageHeader } from '@/components/shared/PageHeader';
import { UserForm } from '@/components/users/UserForm';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

interface Props {
  params: Promise<{ id: string }>;
}

export default function UserEditPage({ params }: Props) {
  const { id } = use(params);
  const email = decodeURIComponent(id);
  const { data: user, isLoading, isError } = useUser(email);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={1} columns={3} />
        <LoadingSkeleton rows={5} columns={2} />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Not Found" description="The requested user could not be loaded." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit User"
        description={`Update account details for ${user.full_name}`}
      />
      <UserForm user={user} />
    </div>
  );
}
