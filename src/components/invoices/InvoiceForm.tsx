'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useItems } from '@/hooks/useItems';
import { useCreateInvoice, useUpdateInvoice, useSubmitInvoice } from '@/hooks/useInvoice';
import { useCustomerBalance } from '@/hooks/useCustomers';
import { invoiceService } from '@/services/invoice.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Plus, Trash2, Copy, ChevronsUpDown, Check, Loader2,
  Send, Save, X, Printer,
} from 'lucide-react';
import type { SalesInvoice, SalesInvoiceItem, InvoiceTax } from '@/types/invoice.types';
import type { Item } from '@/types/item.types';
import { cn } from '@/lib/utils';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function today() {
  return new Date().toISOString().split('T')[0];
}

function dueDateDefault() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

function calcAmount(qty: number, rate: number, disc = 0): number {
  return qty * rate * (1 - disc / 100);
}

function fmt(n: number) {
  return 'PKR ' + (n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let _rowId = 0;
function newId() { return `row-${++_rowId}`; }

function emptyRow(): SalesInvoiceItem {
  return {
    _id: newId(),
    item_code: '',
    item_name: '',
    description: '',
    qty: 1,
    uom: 'Nos',
    rate: 0,
    amount: 0,
    discount_percentage: 0,
    warehouse: '',
  };
}

// â”€â”€ Customer Combobox â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CustomerCombobox({
  value, onChange,
}: { value: string; onChange: (val: string, name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<{ name: string; customer_name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    invoiceService.searchCustomers(search).then((res) => {
      if (!cancelled) { setCustomers(res); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [search]);

  const selected = customers.find((c) => c.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full inline-flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="truncate">{selected ? selected.customer_name : value || 'Select customer…'}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search customerâ€¦"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {loading && (
              <CommandEmpty>
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </CommandEmpty>
            )}
            {!loading && customers.length === 0 && (
              <CommandEmpty>No customers found.</CommandEmpty>
            )}
            <CommandGroup>
              {customers.map((c) => (
                <CommandItem
                  key={c.name}
                  value={c.name}
                  onSelect={() => {
                    onChange(c.name, c.customer_name);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === c.name ? 'opacity-100' : 'opacity-0')} />
                  {c.customer_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// â”€â”€ Item Combobox â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ItemCombobox({
  value, items, onSelect,
}: {
  value: string;
  items: Item[];
  onSelect: (item: Item) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? items.filter(
        (i) =>
          i.item_name.toLowerCase().includes(search.toLowerCase()) ||
          i.item_code.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const selected = items.find((i) => i.item_code === value || i.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="w-full inline-flex items-center justify-between rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-normal shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-8">
        <span className="truncate">{selected ? selected.item_name : value || 'Select item…'}</span>
        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search itemâ€¦"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-48">
            {filtered.length === 0 && <CommandEmpty>No items found.</CommandEmpty>}
            <CommandGroup>
              {filtered.map((i) => (
                <CommandItem
                  key={i.item_code ?? i.name}
                  value={i.item_code ?? i.name}
                  onSelect={() => { onSelect(i); setOpen(false); setSearch(''); }}
                >
                  <Check className={cn('mr-2 h-3.5 w-3.5', value === (i.item_code ?? i.name) ? 'opacity-100' : 'opacity-0')} />
                  <span className="text-sm">{i.item_name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{i.item_code}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// â”€â”€ Main InvoiceForm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface InvoiceFormProps {
  /** If provided, we're editing an existing draft */
  existing?: SalesInvoice;
  /** Pre-fill customer from query param */
  defaultCustomer?: string;
}

export function InvoiceForm({ existing, defaultCustomer }: InvoiceFormProps) {
  const router = useRouter();

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const submitInvoice = useSubmitInvoice();

  const { data: itemsData } = useItems({ limit: 500 });
  const allItems: Item[] = itemsData?.data ?? [];

  // â”€â”€ Form state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [customer, setCustomer] = useState(existing?.customer ?? defaultCustomer ?? '');
  const [customerName, setCustomerName] = useState(existing?.customer_name ?? '');
  const [postingDate, setPostingDate] = useState(existing?.posting_date ?? today());
  const [dueDate, setDueDate] = useState(existing?.due_date ?? dueDateDefault());
  const [remarks, setRemarks] = useState(existing?.remarks ?? '');
  const [modeOfPayment, setModeOfPayment] = useState(existing?.mode_of_payment ?? '');

  const [rows, setRows] = useState<SalesInvoiceItem[]>(() =>
    existing?.items?.length
      ? existing.items.map((r) => ({ ...r, _id: newId() }))
      : [emptyRow()]
  );

  const [taxes, setTaxes] = useState<InvoiceTax[]>(existing?.taxes ?? []);
  const [apiError, setApiError] = useState<string | null>(null);
  const { data: customerOutstanding = 0 } = useCustomerBalance(customer);

  // â”€â”€ Calculations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const subtotal = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalDiscount = rows.reduce(
    (s, r) => s + r.qty * r.rate * ((r.discount_percentage ?? 0) / 100), 0
  );
  const totalTax = taxes.reduce((s, t) => {
    const amt = subtotal * (t.rate / 100);
    return s + amt;
  }, 0);
  const grandTotal = subtotal + totalTax;

  // â”€â”€ Row manipulation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const updateRow = useCallback((id: string, patch: Partial<SalesInvoiceItem>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._id !== id) return r;
        const merged = { ...r, ...patch };
        merged.amount = calcAmount(merged.qty, merged.rate, merged.discount_percentage ?? 0);
        return merged;
      })
    );
  }, []);

  const handleItemSelect = useCallback(
    async (id: string, item: Item) => {
      // Get selling price first
      const price = await invoiceService.getItemPrice(item.item_code ?? item.name);
      const rate = price || item.valuation_rate || 0;
      updateRow(id, {
        item_code: item.item_code ?? item.name,
        item_name: item.item_name,
        description: item.description ?? item.item_name,
        uom: item.stock_uom ?? 'Nos',
        rate,
        amount: calcAmount(1, rate, 0),
        qty: 1,
        discount_percentage: 0,
      });
    },
    [updateRow]
  );

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const duplicateRow = (id: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r._id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], _id: newId() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const deleteRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r._id !== id) : prev));
  };

  // â”€â”€ Tax manipulation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addTax = () => {
    setTaxes((prev) => [
      ...prev,
      { charge_type: 'On Net Total', account_head: '', description: 'GST', rate: 17 },
    ]);
  };

  const updateTax = (idx: number, patch: Partial<InvoiceTax>) => {
    setTaxes((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const deleteTax = (idx: number) => {
    setTaxes((prev) => prev.filter((_, i) => i !== idx));
  };

  // â”€â”€ Build payload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function buildPayload(): SalesInvoice {
    const validRows = rows
      .filter((r) => r.item_code.trim())
      .map(({ _id, item_name, amount, ...r }) => {
        const cleaned = {
          item_code: r.item_code,
          qty: r.qty,
          uom: r.uom,
          rate: r.rate,
          description: r.description || undefined,
          discount_percentage: r.discount_percentage || undefined,
          warehouse: r.warehouse || undefined,
        };

        return cleaned;
      });

    const validTaxes = taxes
      .filter((t) => t.account_head.trim())
      .map((t) => ({
        ...t,
        tax_amount: subtotal * (t.rate / 100),
      }));

    return {
      ...(existing?.name ? { name: existing.name } : {}),
      customer,
      posting_date: postingDate,
      due_date: dueDate,
      remarks: remarks || undefined,
      mode_of_payment: modeOfPayment || undefined,
      items: validRows,
      taxes: validTaxes.length ? validTaxes : undefined,
    } as SalesInvoice;
  }

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSaveDraft = async () => {
    setApiError(null);
    if (!customer) { setApiError('Please select a customer.'); return; }
    const hasValidItems = rows.some((r) => r.item_code.trim() && r.qty > 0);
    if (!hasValidItems) { setApiError('Add at least one valid item with quantity greater than 0.'); return; }

    try {
      const payload = buildPayload();
      if (existing?.name) {
        await updateInvoice.mutateAsync({ name: existing.name, data: payload });
      } else {
        const created = await createInvoice.mutateAsync(payload);
        router.push(`/invoices/${encodeURIComponent(created.name!)}`);
        return;
      }
    } catch (e: unknown) {
      setApiError((e as Error).message);
    }
  };

  const handleSubmit = async () => {
    setApiError(null);
    if (!customer) { setApiError('Please select a customer.'); return; }
    const hasValidItems = rows.some((r) => r.item_code.trim() && r.qty > 0);
    if (!hasValidItems) { setApiError('Add at least one valid item with quantity greater than 0.'); return; }

    try {
      let name = existing?.name;
      if (!name) {
        const created = await createInvoice.mutateAsync(buildPayload());
        name = created.name!;
      } else {
        await updateInvoice.mutateAsync({ name, data: buildPayload() });
      }
      await submitInvoice.mutateAsync(name);
      router.push(`/invoices/${encodeURIComponent(name)}`);
    } catch (e: unknown) {
      setApiError((e as Error).message);
    }
  };

  const isBusy = createInvoice.isPending || updateInvoice.isPending || submitInvoice.isPending;

  const isDraft = existing?.docstatus !== 1 && existing?.docstatus !== 2;
  const isSubmitted = existing?.docstatus === 1;

  return (
    <div className="space-y-6">
      {/* â”€â”€ Header â”€â”€ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label>Customer <span className="text-destructive">*</span></Label>
              {isDraft ? (
                <CustomerCombobox
                  value={customer}
                  onChange={(val, name) => { setCustomer(val); setCustomerName(name); }}
                />
              ) : (
                <p className="text-sm font-medium py-2">{existing?.customer_name || existing?.customer}</p>
              )}
              {customer && customerOutstanding > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Warning: This customer has PKR {customerOutstanding.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} outstanding.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={postingDate}
                disabled={!isDraft}
                onChange={(e) => setPostingDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                disabled={!isDraft}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mode of Payment</Label>
              <Select value={modeOfPayment} onValueChange={(value) => setModeOfPayment(value ?? '')} disabled={!isDraft}>
                <SelectTrigger><SelectValue placeholder="Selectâ€¦" /></SelectTrigger>
                <SelectContent>
                  {['Cash', 'Card', 'Bank Transfer', 'Cheque'].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Remarks</Label>
              <Textarea
                rows={2}
                placeholder="Optional notesâ€¦"
                value={remarks}
                disabled={!isDraft}
                onChange={(e) => setRemarks(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* â”€â”€ Items Table â”€â”€ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium w-[220px]">Item</th>
                  <th className="text-left p-3 font-medium w-[160px]">Description</th>
                  <th className="text-right p-3 font-medium w-20">Qty</th>
                  <th className="text-left p-3 font-medium w-20">UOM</th>
                  <th className="text-right p-3 font-medium w-28">Rate (PKR)</th>
                  <th className="text-right p-3 font-medium w-20">Disc %</th>
                  <th className="text-right p-3 font-medium w-28">Amount</th>
                  {isDraft && <th className="w-16" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row._id} className="border-b hover:bg-muted/20">
                    <td className="p-2">
                      {isDraft ? (
                        <ItemCombobox
                          value={row.item_code}
                          items={allItems}
                          onSelect={(item) => handleItemSelect(row._id!, item)}
                        />
                      ) : (
                        <span className="text-sm">{row.item_name}</span>
                      )}
                    </td>
                    <td className="p-2">
                      <Input
                        className="h-8 text-sm"
                        value={row.description ?? ''}
                        disabled={!isDraft}
                        onChange={(e) => updateRow(row._id!, { description: e.target.value })}
                        placeholder="Description"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="h-8 text-sm text-right w-20"
                        min={0.001}
                        step="any"
                        value={row.qty}
                        disabled={!isDraft}
                        onChange={(e) =>
                          updateRow(row._id!, { qty: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        className="h-8 text-sm w-16"
                        value={row.uom}
                        disabled={!isDraft}
                        onChange={(e) => updateRow(row._id!, { uom: e.target.value })}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="h-8 text-sm text-right w-28"
                        min={0}
                        step="any"
                        value={row.rate}
                        disabled={!isDraft}
                        onChange={(e) =>
                          updateRow(row._id!, { rate: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="h-8 text-sm text-right w-20"
                        min={0}
                        max={100}
                        step="any"
                        value={row.discount_percentage ?? 0}
                        disabled={!isDraft}
                        onChange={(e) =>
                          updateRow(row._id!, {
                            discount_percentage: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className="p-2 text-right font-medium tabular-nums">
                      {(row.amount ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {isDraft && (
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Duplicate row"
                            onClick={() => duplicateRow(row._id!)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            title="Delete row"
                            onClick={() => deleteRow(row._id!)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isDraft && (
            <div className="p-3 border-t">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* â”€â”€ Taxes + Totals â”€â”€ */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Taxes */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Taxes</CardTitle>
              {isDraft && (
                <Button type="button" variant="outline" size="sm" className="gap-1.5 h-7" onClick={addTax}>
                  <Plus className="h-3.5 w-3.5" /> Add Tax
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {taxes.length === 0 && (
              <p className="text-sm text-muted-foreground">No taxes applied.</p>
            )}
            {taxes.map((tax, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  className="h-8 text-sm flex-1"
                  placeholder="Tax name (e.g. GST 17%)"
                  value={tax.description}
                  disabled={!isDraft}
                  onChange={(e) => updateTax(idx, { description: e.target.value })}
                />
                <div className="flex items-center gap-1 w-28">
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    min={0}
                    max={100}
                    value={tax.rate}
                    disabled={!isDraft}
                    onChange={(e) => updateTax(idx, { rate: parseFloat(e.target.value) || 0 })}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <span className="text-sm tabular-nums w-28 text-right">
                  {fmt(subtotal * (tax.rate / 100))}
                </span>
                {isDraft && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteTax(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="lg:w-80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{fmt(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums text-red-600">- {fmt(totalDiscount)}</span>
              </div>
            )}
            {taxes.map((tax, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tax.description} ({tax.rate}%)</span>
                <span className="tabular-nums">{fmt(subtotal * (tax.rate / 100))}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Grand Total</span>
              <span className="tabular-nums">{fmt(grandTotal)}</span>
            </div>
            {isSubmitted && existing?.outstanding_amount !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className={cn(
                  'tabular-nums font-medium',
                  existing.outstanding_amount > 0 ? 'text-orange-600' : 'text-green-600'
                )}>
                  {fmt(existing.outstanding_amount)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* â”€â”€ Error â”€â”€ */}
      {apiError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {apiError}
        </div>
      )}

      {/* â”€â”€ Actions â”€â”€ */}
      <div className="flex flex-wrap gap-3 justify-between">
        <Button type="button" variant="outline" onClick={() => router.push('/invoices')}>
          <X className="h-4 w-4 mr-1.5" /> Close
        </Button>
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={handleSaveDraft}
              >
                {(createInvoice.isPending || updateInvoice.isPending) && (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-1.5" /> Save Draft
              </Button>
              <Button
                type="button"
                disabled={isBusy}
                onClick={handleSubmit}
              >
                {submitInvoice.isPending && (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                )}
                <Send className="h-4 w-4 mr-1.5" /> Submit Invoice
              </Button>
            </>
          )}
          {(isSubmitted || existing?.docstatus === 2) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
