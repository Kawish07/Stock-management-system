'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axiosInstance from '@/lib/axios';
import { CheckCircle2, XCircle, Loader2, Building2, Users, CalendarX2, Package } from 'lucide-react';

type Status = 'idle' | 'running' | 'success' | 'error';

interface TaskResult {
  name: string;
  status: Status;
  message: string;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_COMPANIES = [
  {
    company_name: 'Veclar Technologies',
    abbr: 'VT',
    default_currency: 'PKR',
    country: 'Pakistan',
    phone_no: '+92-300-1234567',
    email: 'info@veclar.pk',
    website: 'https://veclar.pk',
    tax_id: 'NTN-1234567',
  },
  {
    company_name: 'Alpha Trading Co',
    abbr: 'ATC',
    default_currency: 'PKR',
    country: 'Pakistan',
    phone_no: '+92-21-9876543',
    email: 'contact@alphatrading.pk',
  },
  {
    company_name: 'Gulf Exports LLC',
    abbr: 'GE',
    default_currency: 'AED',
    country: 'United Arab Emirates',
    phone_no: '+971-4-5551234',
    email: 'info@gulfexports.ae',
  },
];

const DEMO_EMPLOYEES = [
  {
    first_name: 'Ahmed',
    last_name: 'Khan',
    status: 'Active',
    designation: 'Software Engineer',
    department: 'IT',
    employment_type: 'Full-time',
    date_of_joining: '2023-01-15',
    gender: 'Male',
    cell_number: '+92-300-1111111',
    personal_email: 'ahmed.khan@gmail.com',
    ctc: 120000,
  },
  {
    first_name: 'Sara',
    last_name: 'Ali',
    status: 'Active',
    designation: 'Accountant',
    department: 'Finance',
    employment_type: 'Full-time',
    date_of_joining: '2022-06-01',
    gender: 'Female',
    cell_number: '+92-321-2222222',
    personal_email: 'sara.ali@gmail.com',
    ctc: 90000,
  },
  {
    first_name: 'Usman',
    last_name: 'Raza',
    status: 'Active',
    designation: 'Warehouse Manager',
    department: 'Operations',
    employment_type: 'Full-time',
    date_of_joining: '2021-03-20',
    gender: 'Male',
    cell_number: '+92-333-3333333',
    personal_email: 'usman.raza@gmail.com',
    ctc: 75000,
  },
  {
    first_name: 'Fatima',
    last_name: 'Sheikh',
    status: 'Inactive',
    designation: 'HR Manager',
    department: 'Human Resources',
    employment_type: 'Part-time',
    date_of_joining: '2020-09-10',
    gender: 'Female',
    cell_number: '+92-345-4444444',
    personal_email: 'fatima.sheikh@gmail.com',
    ctc: 55000,
  },
];

// Batches require existing items — we fetch first items from ERPNext and attach to them
const DEMO_BATCHES_TEMPLATE = [
  {
    batch_id: 'BATCH-DEMO-001',
    expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days (critical)
    manufacturing_date: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Demo near-expiry batch (critical)',
  },
  {
    batch_id: 'BATCH-DEMO-002',
    expiry_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days (near)
    manufacturing_date: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Demo near-expiry batch (warning)',
  },
  {
    batch_id: 'BATCH-DEMO-003',
    expiry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago (expired)
    manufacturing_date: new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Demo expired batch',
  },
  {
    batch_id: 'BATCH-DEMO-004',
    expiry_date: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 200 days (ok)
    manufacturing_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: 'Demo fresh batch',
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

async function tryCreate(endpoint: string, data: Record<string, unknown>) {
  try {
    const res = await axiosInstance.post(`/resource/${endpoint}`, data);
    return { ok: true, name: res.data?.data?.name as string };
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { exception?: string; message?: string } } })?.response?.data
        ?.exception ??
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
      (err instanceof Error ? err.message : 'Unknown error');
    // Ignore duplicate key errors gracefully
    if (msg.includes('DuplicateEntryError') || msg.includes('already exists')) {
      return { ok: true, name: data.company_name as string ?? data.batch_id as string ?? 'duplicate' };
    }
    throw new Error(msg);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DemoDataPage() {
  const [tasks, setTasks] = useState<TaskResult[]>([
    { name: 'Companies', status: 'idle', message: '3 demo companies' },
    { name: 'Employees', status: 'idle', message: '4 demo employees' },
    { name: 'Expiry Batches', status: 'idle', message: '4 batches with varied expiry dates' },
  ]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const updateTask = (name: string, update: Partial<TaskResult>) => {
    setTasks((prev) => prev.map((t) => (t.name === name ? { ...t, ...update } : t)));
  };

  const runDemo = async () => {
    setRunning(true);
    setDone(false);

    // Reset all to running
    setTasks((prev) => prev.map((t) => ({ ...t, status: 'running' as Status, message: 'Working...' })));

    // ── 1. Companies ─────────────────────────────────────────────────────
    let createdCount = 0;
    try {
      for (const co of DEMO_COMPANIES) {
        await tryCreate('Company', co as unknown as Record<string, unknown>);
        createdCount++;
      }
      updateTask('Companies', { status: 'success', message: `${createdCount} companies created/verified` });
    } catch (err) {
      updateTask('Companies', {
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed',
      });
    }

    // ── 2. Employees ─────────────────────────────────────────────────────
    // Fetch first available company to link employees
    let employeeCompany = 'Veclar Technologies';
    try {
      const compRes = await axiosInstance.get('/resource/Company', {
        params: { fields: JSON.stringify(['name']), limit: 1 },
      });
      if (compRes.data?.data?.[0]?.name) {
        employeeCompany = compRes.data.data[0].name as string;
      }
    } catch { /* use default */ }

    let empCount = 0;
    try {
      for (const emp of DEMO_EMPLOYEES) {
        await tryCreate('Employee', { ...emp, company: employeeCompany } as Record<string, unknown>);
        empCount++;
      }
      updateTask('Employees', { status: 'success', message: `${empCount} employees created/verified` });
    } catch (err) {
      updateTask('Employees', {
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed',
      });
    }

    // ── 3. Expiry Batches ─────────────────────────────────────────────────
    // Fetch first available item to attach batches
    let batchItem = '';
    try {
      const itemRes = await axiosInstance.get('/resource/Item', {
        params: {
          fields: JSON.stringify(['name']),
          filters: JSON.stringify([['Item', 'has_batch_no', '=', 1]]),
          limit: 1,
        },
      });
      if (itemRes.data?.data?.[0]?.name) {
        batchItem = itemRes.data.data[0].name as string;
      } else {
        // Fall back: any item, then enable batch tracking
        const anyItemRes = await axiosInstance.get('/resource/Item', {
          params: { fields: JSON.stringify(['name']), limit: 1 },
        });
        batchItem = anyItemRes.data?.data?.[0]?.name ?? '';
      }
    } catch { /* no item found */ }

    if (!batchItem) {
      updateTask('Expiry Batches', {
        status: 'error',
        message: 'No items found. Create at least one item first.',
      });
    } else {
      let batchCount = 0;
      try {
        for (const b of DEMO_BATCHES_TEMPLATE) {
          await tryCreate('Batch', { ...b, item: batchItem } as Record<string, unknown>);
          batchCount++;
        }
        updateTask('Expiry Batches', {
          status: 'success',
          message: `${batchCount} batches created for item "${batchItem}"`,
        });
      } catch (err) {
        updateTask('Expiry Batches', {
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed',
        });
      }
    }

    setRunning(false);
    setDone(true);
  };

  const statusIcon = (status: Status) => {
    if (status === 'idle') return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />;
    if (status === 'running') return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const moduleIcon = (name: string) => {
    if (name === 'Companies') return <Building2 className="h-4 w-4 text-blue-600" />;
    if (name === 'Employees') return <Users className="h-4 w-4 text-purple-600" />;
    if (name === 'Expiry Batches') return <CalendarX2 className="h-4 w-4 text-orange-600" />;
    return <Package className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Demo Data"
        description="Seed test data into ERPNext to verify all new modules are working"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What will be created</CardTitle>
          <CardDescription>
            Demo records will be created in your connected ERPNext instance. Duplicate entries
            are silently skipped.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.name}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                {moduleIcon(task.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{task.name}</p>
                <p className="text-xs text-muted-foreground truncate">{task.message}</p>
              </div>
              <div>{statusIcon(task.status)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={runDemo} disabled={running} className="gap-2">
          {running && <Loader2 className="h-4 w-4 animate-spin" />}
          {running ? 'Seeding data...' : 'Seed Demo Data'}
        </Button>

        {done && (
          <Badge
            variant="outline"
            className={
              tasks.every((t) => t.status === 'success')
                ? 'border-green-300 text-green-700 bg-green-50'
                : 'border-yellow-300 text-yellow-700 bg-yellow-50'
            }
          >
            {tasks.every((t) => t.status === 'success')
              ? 'All done! Check each module.'
              : 'Completed with some errors — see above.'}
          </Badge>
        )}
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-4">
          <p className="text-sm font-medium mb-2">Module links to verify:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><a href="/companies" className="underline hover:text-foreground">/companies</a> — List, create, edit, delete companies</li>
            <li><a href="/employees" className="underline hover:text-foreground">/employees</a> — List tab &amp; Salaries tab</li>
            <li><a href="/expiry" className="underline hover:text-foreground">/expiry</a> — Near Expiry tab &amp; All Batches tab</li>
            <li><a href="/items/new" className="underline hover:text-foreground">/items/new</a> — Company selector on item form</li>
            <li><a href="/invoices/new" className="underline hover:text-foreground">/invoices/new</a> — Company selector on invoice form</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
