import { PageHeader } from '@/components/shared/PageHeader';
import { EmployeeForm } from '@/components/employees/EmployeeForm';

export const metadata = { title: 'New Employee | StockFlow' };

export default function NewEmployeePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Add Employee"
        description="Add a new employee to the system"
      />
      <EmployeeForm />
    </div>
  );
}
