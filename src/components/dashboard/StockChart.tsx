'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStockBalance } from '@/hooks/useReports';
import { useItems } from '@/hooks/useItems';

const PIE_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

export function StockChart() {
  const { data: stockData = [], isLoading: stockLoading } = useStockBalance(
    { to_date: new Date().toISOString().split('T')[0] },
    true
  );
  const { data: itemsData, isLoading: itemsLoading } = useItems({ limit: 500 });

  const barData = useMemo(
    () =>
      [...stockData]
        .sort((a, b) => (b.bal_qty ?? 0) - (a.bal_qty ?? 0))
        .slice(0, 10)
        .map((entry) => ({
          name: entry.item_code,
          qty: Number((entry.bal_qty ?? 0).toFixed(2)),
        })),
    [stockData]
  );

  const pieData = useMemo(() => {
    const groups: Record<string, number> = {};
    (itemsData?.data ?? []).forEach((item) => {
      const group = item.item_group || 'Uncategorized';
      groups[group] = (groups[group] ?? 0) + (item.actual_qty ?? 0);
    });
    return Object.entries(groups)
      .filter(([, qty]) => qty > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [itemsData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar chart — top 10 items by stock qty */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Items by Stock Qty</CardTitle>
        </CardHeader>
        <CardContent>
          {stockLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Loading chart…
            </div>
          ) : barData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No stock data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 44, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="qty" name="Qty" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Pie chart — stock qty by category */}
      <Card>
        <CardHeader>
          <CardTitle>Stock by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Loading chart…
            </div>
          ) : pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              No category data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={95}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [(Number(value ?? 0)).toLocaleString(), 'Qty']} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={10}
                  formatter={(value) =>
                    value.length > 14 ? `${value.slice(0, 14)}…` : value
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
