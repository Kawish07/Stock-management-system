'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStockEntries } from '@/hooks/useStockEntry';
import { formatDate, getDocStatusLabel, getDocStatusVariant } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { getStockEntryTypeLabel } from '@/types/stockEntry.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function RecentEntries() {
  const router = useRouter();
  const { data, isLoading } = useStockEntries({ pageSize: 10 });
  const entries = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Stock Entries</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-10">
            No stock entries yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry No</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow
                  key={entry.name}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/stock-entries/${encodeURIComponent(entry.name ?? '')}`)
                  }
                >
                  <TableCell className="font-medium text-sm">{entry.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getStockEntryTypeLabel(entry.stock_entry_type)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(entry.posting_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getDocStatusVariant(entry.docstatus)}>
                      {getDocStatusLabel(entry.docstatus)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
