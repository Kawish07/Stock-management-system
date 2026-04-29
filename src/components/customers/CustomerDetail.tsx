'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Pencil, PlusCircle, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useCustomer, useCustomerBalance, useCustomerInvoices } from '@/hooks/useCustomers';

function money(value: number) {
  return `PKR ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CustomerDetail({ customerId }: { customerId: string }) {
  const searchParams = useSearchParams();
  const [editOpen, setEditOpen] = useState(searchParams.get('edit') === '1');

  const decodedName = useMemo(() => decodeURIComponent(customerId), [customerId]);
  const { data: customer, isLoading, isError } = useCustomer(decodedName);
  const { data: balance = 0 } = useCustomerBalance(decodedName);
  const { data: invoices = [] } = useCustomerInvoices(decodedName);
  const totalPurchases = invoices
    .filter((inv) => inv.docstatus !== 2)
    .reduce((sum, inv) => sum + (inv.grand_total || 0), 0);

  useEffect(() => {
    if (searchParams.get('edit') === '1') {
      setEditOpen(true);
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton rows={1} columns={3} />
        <LoadingSkeleton rows={5} columns={2} />
      </div>
    );
  }

  if (isError || !customer) {
    return <p className="text-sm text-muted-foreground">Customer not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/customers" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}>
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/new?customer=${encodeURIComponent(customer.name)}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5')}
          >
            <PlusCircle className="h-4 w-4" /> New Invoice
          </Link>
          <Button size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Customer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{customer.customer_name}</h2>
                <p className="text-xs text-muted-foreground mt-1">{customer.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {customer.customer_type === 'Company' ? (
                  <Badge className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100">Company</Badge>
                ) : (
                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-100">Individual</Badge>
                )}
                {customer.disabled === 0 ? (
                  <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100">Active</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">Disabled</Badge>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Customer Group</p>
                <p className="font-medium mt-0.5">{customer.customer_group || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Territory</p>
                <p className="font-medium mt-0.5">{customer.territory || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mobile</p>
                <p className="font-medium mt-0.5">{customer.mobile_no || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium mt-0.5">{customer.email_id || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Website</p>
                <p className="font-medium mt-0.5">{customer.website || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tax ID</p>
                <p className="font-medium mt-0.5">{customer.tax_id || '—'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Customer Details</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{customer.customer_details || 'No additional details added.'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{money(totalPurchases)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-indigo-600" />
                Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{money(balance)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices found.</p>
              ) : (
                invoices.map((inv) => (
                  <Link
                    key={inv.name}
                    href={`/invoices/${encodeURIComponent(inv.name)}`}
                    className="block rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="font-medium">{inv.name}</p>
                      <Badge variant="secondary">{inv.posting_date}</Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Grand Total: {money(inv.grand_total || 0)}</span>
                      <span>Outstanding: {money(inv.outstanding_amount || 0)}</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Customer</SheetTitle>
            <SheetDescription>Update customer information and status.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 px-1 pb-6">
            <CustomerForm customer={customer} onSuccess={() => setEditOpen(false)} onCancel={() => setEditOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
