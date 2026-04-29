'use client';

import { useDashboardKPIs } from '@/hooks/useReports';
import { useInvoicesToday, useRevenueToday, useUnpaidInvoices } from '@/hooks/useInvoice';
import { useCustomersCount } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package, Warehouse, ClipboardList, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Receipt, DollarSign, Clock, Users2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardKPIs } from '@/services/reports.service';

const KPI_CONFIG = [
  {
    key: 'totalItems' as const,
    label: 'Total Items',
    icon: Package,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    key: 'totalWarehouses' as const,
    label: 'Warehouses',
    icon: Warehouse,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  {
    key: 'lowStockItems' as const,
    label: 'Low Stock Items',
    icon: AlertTriangle,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950',
  },
  {
    key: 'stockEntriesToday' as const,
    label: 'Entries Today',
    icon: ClipboardList,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
];

function ChangeBadge({ kpiKey, data }: { kpiKey: keyof DashboardKPIs; data: DashboardKPIs }) {
  if (kpiKey === 'stockEntriesToday') {
    const today = data.stockEntriesToday;
    const yesterday = data.stockEntriesYesterday;
    if (yesterday === 0) {
      return today > 0 ? (
        <Badge variant="secondary" className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950">
          <TrendingUp className="h-3 w-3 mr-1 inline" />
          New activity
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-xs text-muted-foreground">
          <Minus className="h-3 w-3 inline" /> No change
        </Badge>
      );
    }
    const pct = Math.round(((today - yesterday) / yesterday) * 100);
    const up = pct >= 0;
    return (
      <Badge
        variant="secondary"
        className={`text-xs font-medium ${up ? 'text-green-600 bg-green-50 dark:bg-green-950' : 'text-red-600 bg-red-50 dark:bg-red-950'}`}
      >
        {up ? (
          <TrendingUp className="h-3 w-3 mr-1 inline" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1 inline" />
        )}
        {up ? '+' : ''}{pct}% vs yesterday
      </Badge>
    );
  }

  if (kpiKey === 'lowStockItems') {
    return data.lowStockItems > 0 ? (
      <Badge variant="destructive" className="text-xs">Needs attention</Badge>
    ) : (
      <Badge variant="secondary" className="text-xs text-green-600 bg-green-50 dark:bg-green-950">
        All OK
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs text-muted-foreground">
      <Minus className="h-3 w-3 mr-1 inline" /> Stable
    </Badge>
  );
}

export function KPICards() {
  const { data, isLoading } = useDashboardKPIs();
  const { data: invoicesToday, isLoading: invLoading } = useInvoicesToday();
  const { data: revenueToday, isLoading: revLoading } = useRevenueToday();
  const { data: totalCustomers, isLoading: customersLoading } = useCustomersCount();
  const { data: unpaid, isLoading: unpaidLoading } = useUnpaidInvoices();

  return (
    <div className="space-y-4">
      {/* ── Stock KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
            </CardTitle>
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-5 w-28" />
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">{data?.[key] ?? 0}</p>
                {data && <ChangeBadge kpiKey={key} data={data} />}
              </>
            )}
          </CardContent>
        </Card>
      ))}
      </div>

      {/* ── Sales / Invoice KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Invoices Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invoices Today
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
              <Receipt className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {invLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{invoicesToday ?? 0}</p>
            )}
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              <Minus className="h-3 w-3 mr-1 inline" /> Sales invoices today
            </Badge>
          </CardContent>
        </Card>

        {/* Revenue Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Today
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {revLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className="text-2xl font-bold">
                PKR {(revenueToday ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            )}
            <Badge variant="secondary" className="text-xs text-green-600 bg-green-50 dark:bg-green-950">
              <TrendingUp className="h-3 w-3 mr-1 inline" /> Submitted invoices
            </Badge>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Customers
            </CardTitle>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950">
              <Users2 className="h-4 w-4 text-sky-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {customersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{totalCustomers ?? 0}</p>
            )}
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              <Minus className="h-3 w-3 mr-1 inline" /> Registered customers
            </Badge>
          </CardContent>
        </Card>

        {/* Unpaid Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unpaid Amount
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {unpaidLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  PKR {(unpaid?.amount ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {unpaid?.count ?? 0} unpaid invoices
                </p>
              </>
            )}
            {(unpaid?.count ?? 0) > 0 ? (
              <Badge variant="destructive" className="text-xs">Needs follow-up</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs text-green-600 bg-green-50 dark:bg-green-950">
                All clear
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


