'use client';

import { useState } from 'react';
import { useWarehouses } from '@/hooks/useWarehouses';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { Edit, Trash2, Search, Warehouse as WarehouseIcon } from 'lucide-react';
import type { Warehouse, WarehouseType } from '@/types/warehouse.types';

const TYPE_BADGE_CLASSES: Record<WarehouseType, string> = {
  Storage: 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-100',
  Transit: 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-100',
  Manufacturing: 'bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-100',
  'Fixed Asset': 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-100',
};

function WarehouseTypeBadge({ type }: { type?: WarehouseType | string }) {
  if (!type) return <span className="text-muted-foreground text-xs">—</span>;
  const cls = TYPE_BADGE_CLASSES[type as WarehouseType];
  return (
    <Badge className={cls ?? 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-100'}>
      {type}
    </Badge>
  );
}

interface WarehouseTableProps {
  onEdit: (warehouse: Warehouse) => void;
  onDelete?: (warehouse: Warehouse) => void;
}

export function WarehouseTable({ onEdit, onDelete }: WarehouseTableProps) {
  const [search, setSearch] = useState('');
  const { data: warehouses = [], isLoading, isError, error, refetch } = useWarehouses();

  const filtered = search
    ? warehouses.filter(
        (w) =>
          w.warehouse_name.toLowerCase().includes(search.toLowerCase()) ||
          w.city?.toLowerCase().includes(search.toLowerCase())
      )
    : warehouses;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search warehouses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : isError ? (
        <TableErrorState
          error={(error as Error)?.message ?? 'Something went wrong'}
          onRetry={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        search ? (
          <EmptyState
            title="No results found"
            description="Try adjusting your search"
          />
        ) : (
          <EmptyState
            icon={WarehouseIcon}
            title="No warehouses added"
            description="Add your first warehouse"
          />
        )
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((warehouse) => (
                <TableRow key={warehouse.name}>
                  <TableCell className="font-medium">{warehouse.warehouse_name}</TableCell>
                  <TableCell>
                    <WarehouseTypeBadge type={warehouse.warehouse_type} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {warehouse.parent_warehouse ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {warehouse.city ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(warehouse)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(warehouse)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

