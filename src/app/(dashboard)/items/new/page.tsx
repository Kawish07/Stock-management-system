import { PageHeader } from '@/components/shared/PageHeader';
import { ItemForm } from '@/components/items/ItemForm';

export default function NewItemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add New Item"
        description="Fill in the details to create a new inventory item"
      />
      <ItemForm />
    </div>
  );
}
