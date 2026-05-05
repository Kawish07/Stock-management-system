'use client';

import { useNearExpiryBatches, useExpiredBatches } from '@/hooks/useExpiry';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { daysUntilExpiry } from '@/types/expiry.types';
import { format } from 'date-fns';

function ExpiryBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
        Expired {Math.abs(days)}d ago
      </Badge>
    );
  }
  if (days <= 4) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
        {days}d left — Critical
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
      {days}d left
    </Badge>
  );
}

export function NearExpiryTable() {
  const { data: nearData, isLoading: nearLoading } = useNearExpiryBatches();
  const { data: expiredData, isLoading: expiredLoading } = useExpiredBatches();

  const nearBatches = nearData?.data ?? [];
  const expiredBatches = expiredData ?? [];

  const isLoading = nearLoading || expiredLoading;

  if (isLoading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expired</p>
              <p className="text-2xl font-bold text-red-600">{expiredBatches.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expiring within 90 days</p>
              <p className="text-2xl font-bold text-amber-600">{nearBatches.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Critical (≤4 days)</p>
              <p className="text-2xl font-bold text-green-600">
                {nearBatches.filter((b) => {
                  const d = daysUntilExpiry(b.expiry_date);
                  return d !== null && d <= 4;
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expired Section */}
      {expiredBatches.length > 0 && (
        <div>
          <h3 className="font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Expired Batches ({expiredBatches.length})
          </h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredBatches.map((b) => {
                  const days = daysUntilExpiry(b.expiry_date) ?? 0;
                  return (
                    <TableRow key={b.name} className="bg-red-50/40">
                      <TableCell className="font-mono text-sm">{b.batch_id}</TableCell>
                      <TableCell>{b.item_name ?? b.item}</TableCell>
                      <TableCell>
                        {b.expiry_date ? format(new Date(b.expiry_date), 'dd MMM yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <ExpiryBadge days={days} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Near Expiry Section */}
      <div>
        <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Expiring Within 30 Days ({nearBatches.length})
        </h3>
        {nearBatches.length === 0 ? (
          <EmptyState
            title="No items near expiry"
            description="All your batches have more than 30 days before expiry."
            icon={CheckCircle2}
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Mfg. Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nearBatches
                  .sort((a, b) => {
                    const da = daysUntilExpiry(a.expiry_date) ?? 999;
                    const db = daysUntilExpiry(b.expiry_date) ?? 999;
                    return da - db;
                  })
                  .map((b) => {
                    const days = daysUntilExpiry(b.expiry_date) ?? 0;
                    return (
                      <TableRow
                        key={b.name}
                        className={days <= 4 ? 'bg-red-50/40' : 'bg-amber-50/30'}
                      >
                        <TableCell className="font-mono text-sm">{b.batch_id}</TableCell>
                        <TableCell>{b.item_name ?? b.item}</TableCell>
                        <TableCell>
                          {b.manufacturing_date
                            ? format(new Date(b.manufacturing_date), 'dd MMM yyyy')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {b.expiry_date
                            ? format(new Date(b.expiry_date), 'dd MMM yyyy')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <ExpiryBadge days={days} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
