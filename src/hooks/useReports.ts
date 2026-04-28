import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';
import type { StockBalanceFilters, StockLedgerFilters } from '@/services/reports.service';

export const REPORTS_KEY = 'reports';

export function useStockBalance(filters?: StockBalanceFilters, enabled = true) {
  return useQuery({
    queryKey: [REPORTS_KEY, 'stock-balance', filters],
    queryFn: () => reportsService.getStockBalance(filters),
    enabled,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useStockLedger(filters?: StockLedgerFilters, enabled = true) {
  return useQuery({
    queryKey: [REPORTS_KEY, 'stock-ledger', filters],
    queryFn: () => reportsService.getStockLedger(filters),
    enabled,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: [REPORTS_KEY, 'dashboard-kpis'],
    queryFn: () => reportsService.getDashboardKPIs(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
    retryDelay: 1000,
  });
}
