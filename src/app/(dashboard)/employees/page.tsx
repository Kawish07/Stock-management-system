'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmployeesTable } from '@/components/employees/EmployeesTable';
import { SalariesTable } from '@/components/employees/SalariesTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, DollarSign } from 'lucide-react';

export default function EmployeesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') === 'salaries' ? 'salaries' : 'list';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employees and their salary information"
        actions={
          <Link href="/employees/new" className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Link>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => router.push(v === 'salaries' ? '/employees?tab=salaries' : '/employees')}>
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="salaries" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Salaries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <EmployeesTable />
        </TabsContent>

        <TabsContent value="salaries">
          <SalariesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
