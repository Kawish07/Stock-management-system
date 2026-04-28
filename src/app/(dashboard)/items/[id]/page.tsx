'use client';

import { use } from 'react';
import { useItem } from '@/hooks/useItems';
import { PageHeader } from '@/components/shared/PageHeader';
import { ItemForm } from '@/components/items/ItemForm';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ItemEditPage({ params }: Props) {
  const { id } = use(params);
  const itemCode = decodeURIComponent(id);
  const { data: item, isLoading, isError } = useItem(itemCode);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={1} columns={3} />
        <LoadingSkeleton rows={5} columns={2} />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="space-y-6">
        <PageHeader title="Item Not Found" />
        <p className="text-muted-foreground">
          The item you are looking for does not exist or has been deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.item_name}
        description={`Edit Item · ${item.item_code}`}
      />
      <ItemForm item={item} />
    </div>
  );
}
