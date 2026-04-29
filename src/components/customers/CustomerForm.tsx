'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useCreateCustomer, useCustomerGroups, useUpdateCustomer } from '@/hooks/useCustomers';
import type { Customer } from '@/types/customer.types';

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FALLBACK_GROUPS = ['Commercial', 'Individual', 'Non Profit', 'Retail', 'Government'];

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const router = useRouter();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const { data: customerGroups = FALLBACK_GROUPS } = useCustomerGroups();

  const [error, setError] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);

  const [customerName, setCustomerName] = useState(customer?.customer_name ?? '');
  const [customerType, setCustomerType] = useState<'Company' | 'Individual'>(customer?.customer_type ?? 'Company');
  const [customerGroup, setCustomerGroup] = useState(customer?.customer_group ?? FALLBACK_GROUPS[0]);
  const [territory, setTerritory] = useState(customer?.territory ?? 'All Territories');
  const [mobileNo, setMobileNo] = useState(customer?.mobile_no ?? '');
  const [emailId, setEmailId] = useState(customer?.email_id ?? '');
  const [website, setWebsite] = useState(customer?.website ?? '');
  const [taxId, setTaxId] = useState(customer?.tax_id ?? '');
  const [customerDetails, setCustomerDetails] = useState(customer?.customer_details ?? '');
  const [disabled, setDisabled] = useState((customer?.disabled ?? 0) === 1);

  const isEdit = !!customer;
  const isBusy = createCustomer.isPending || updateCustomer.isPending;

  const groups = useMemo(() => Array.from(new Set([...FALLBACK_GROUPS, ...customerGroups])), [customerGroups]);

  const submit = async () => {
    setError(null);

    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }

    const payload: Partial<Customer> = {
      customer_name: customerName.trim(),
      customer_type: customerType,
      customer_group: customerGroup,
      territory: territory.trim() || 'All Territories',
      mobile_no: mobileNo.trim() || undefined,
      email_id: emailId.trim() || undefined,
      website: website.trim() || undefined,
      tax_id: taxId.trim() || undefined,
      customer_details: customerDetails.trim() || undefined,
      disabled: disabled ? 1 : 0,
    };

    try {
      if (isEdit && customer) {
        await updateCustomer.mutateAsync({ name: customer.name, data: payload });
      } else {
        await createCustomer.mutateAsync(payload);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/customers');
      }
    } catch (e) {
      setError((e as Error).message || 'Something went wrong.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Customer Name <span className="text-red-500">*</span></Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Acme Pvt Ltd"
              disabled={isBusy}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Customer Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={customerType === 'Company' ? 'default' : 'outline'}
                onClick={() => setCustomerType('Company')}
                disabled={isBusy}
              >
                Company
              </Button>
              <Button
                type="button"
                variant={customerType === 'Individual' ? 'default' : 'outline'}
                onClick={() => setCustomerType('Individual')}
                disabled={isBusy}
              >
                Individual
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Customer Group</Label>
            <Popover open={groupOpen} onOpenChange={setGroupOpen}>
              <PopoverTrigger
                role="combobox"
                className="w-full inline-flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground"
                disabled={isBusy}
              >
                <span className="truncate">{customerGroup || 'Select customer group...'}</span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-[340px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search group..." />
                  <CommandList>
                    <CommandEmpty>No group found.</CommandEmpty>
                    <CommandGroup>
                      {groups.map((g) => (
                        <CommandItem
                          key={g}
                          value={g}
                          onSelect={() => {
                            setCustomerGroup(g);
                            setGroupOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', customerGroup === g ? 'opacity-100' : 'opacity-0')} />
                          {g}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label>Territory</Label>
            <Input
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              placeholder="All Territories"
              disabled={isBusy}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mobile No</Label>
              <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} disabled={isBusy} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={emailId} onChange={(e) => setEmailId(e.target.value)} disabled={isBusy} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Website (optional)</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} disabled={isBusy} />
            </div>
            <div className="space-y-1.5">
              <Label>Tax ID (GST/NTN)</Label>
              <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} disabled={isBusy} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Additional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Customer Details</Label>
            <Textarea
              rows={4}
              value={customerDetails}
              onChange={(e) => setCustomerDetails(e.target.value)}
              placeholder="Notes about this customer"
              disabled={isBusy}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Disabled</p>
              <p className="text-xs text-muted-foreground">Disabled customers are blocked from transactions.</p>
            </div>
            <Switch checked={disabled} onCheckedChange={setDisabled} />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button onClick={submit} disabled={isBusy}>
          {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update Customer' : 'Create Customer'}
        </Button>
        <Button
          variant="outline"
          disabled={isBusy}
          onClick={() => {
            if (onCancel) onCancel();
            else router.push('/customers');
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
