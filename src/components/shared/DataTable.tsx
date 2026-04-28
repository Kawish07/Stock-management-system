'use client';

import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  skeletonRows?: number;
  rowClassName?: (row: T) => string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  isLoading,
  emptyMessage = 'No data found.',
  emptyDescription,
  emptyAction,
  skeletonRows = 5,
  rowClassName,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingSkeleton rows={skeletonRows} columns={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <EmptyState
          title={emptyMessage}
          description={emptyDescription}
        />
        {emptyAction && <div className="flex justify-center pb-8">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50/80 dark:bg-zinc-800/50">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={col.headerClassName ?? col.className}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={idx} className={rowClassName?.(row)}>
              {columns.map((col) => (
                <TableCell key={String(col.key)} className={col.className}>
                  {col.render
                    ? col.render(row[col.key as keyof T], row)
                    : String(row[col.key as keyof T] ?? '—')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
