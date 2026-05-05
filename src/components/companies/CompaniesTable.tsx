'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanies, useDeleteCompany } from '@/hooks/useCompanies';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableErrorState } from '@/components/shared/TableErrorState';
import { Edit, Trash2, Search, Building2 } from 'lucide-react';
import type { ElementType } from 'react';
import type { Company } from '@/types/company.types';

export function CompaniesTable() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const { data, isLoading, isError, error, refetch } = useCompanies({ search });
  const deleteCompany = useDeleteCompany();

  const companies = data?.data ?? [];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCompany.mutateAsync(deleteTarget.name);
    setDeleteTarget(null);
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (isError) return <TableErrorState error={error?.message ?? 'Failed to load companies'} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Companies</p>
              <p className="text-2xl font-bold text-blue-600">{data?.total ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {companies.length === 0 ? (
        <EmptyState
          title="No companies found"
          description={search ? 'Try a different search term.' : 'Add your first company to get started.'}
          icon={Building2 as ElementType}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Abbr</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium">{c.company_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.abbr}</Badge>
                  </TableCell>
                  <TableCell>{c.default_currency}</TableCell>
                  <TableCell>{c.country ?? '—'}</TableCell>
                  <TableCell>{c.phone_no ?? '—'}</TableCell>
                  <TableCell>{c.email ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/companies/${encodeURIComponent(c.name)}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Company"
        description={`Are you sure you want to delete "${deleteTarget?.company_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteCompany.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
