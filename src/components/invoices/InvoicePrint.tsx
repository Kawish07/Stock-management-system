'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SalesInvoice } from '@/types/invoice.types';
import { cn } from '@/lib/utils';

interface InvoicePrintProps {
  invoice: SalesInvoice;
}

function fmt(n: number) {
  return (n ?? 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(invoice: SalesInvoice) {
  if (invoice.docstatus === 2)
    return <Badge variant="destructive" className="text-sm px-3 py-1">CANCELLED</Badge>;
  if ((invoice.outstanding_amount ?? 0) <= 0)
    return <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">PAID</Badge>;
  return <Badge className="bg-orange-100 text-orange-800 text-sm px-3 py-1">UNPAID</Badge>;
}

export function InvoicePrint({ invoice }: InvoicePrintProps) {
  const router = useRouter();

  const subtotal = invoice.items?.reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0;
  const totalTax = invoice.taxes?.reduce((s, t) => s + (t.tax_amount ?? 0), 0) ?? 0;
  const grandTotal = invoice.grand_total ?? subtotal + totalTax;

  return (
    <>
      {/* ── Screen-only toolbar ── */}
      <div className="print:hidden flex gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1.5" /> Print Invoice
        </Button>
      </div>

      {/* ── Printable invoice ── */}
      <div
        id="invoice-print"
        className={cn(
          'bg-white text-gray-900 p-10 max-w-3xl mx-auto rounded-lg shadow-sm',
          'print:shadow-none print:p-8 print:max-w-none print:rounded-none'
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">StockFlow</h1>
            <p className="text-sm text-gray-500">Stock Management System</p>
            <p className="text-sm text-gray-500 mt-1">kawishiqbal898@gmail.com</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-extrabold text-gray-700 tracking-wide">INVOICE</p>
            <p className="text-sm text-gray-500 mt-2">
              <span className="font-medium">Invoice #:</span> {invoice.name}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Date:</span>{' '}
              {invoice.posting_date
                ? new Date(invoice.posting_date).toLocaleDateString('en-PK', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })
                : '—'}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-medium">Due:</span>{' '}
              {invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString('en-PK', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })
                : '—'}
            </p>
            <div className="mt-2">{statusBadge(invoice)}</div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs uppercase font-semibold text-gray-400 mb-2 tracking-wider">Bill To</p>
          <p className="font-semibold text-gray-800 text-base">
            {invoice.customer_name || invoice.customer}
          </p>
          {invoice.customer_name && invoice.customer !== invoice.customer_name && (
            <p className="text-sm text-gray-500">ID: {invoice.customer}</p>
          )}
          {invoice.mode_of_payment && (
            <p className="text-sm text-gray-500 mt-1">
              Payment: {invoice.mode_of_payment}
            </p>
          )}
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="text-left p-3 font-medium rounded-tl-md">#</th>
              <th className="text-left p-3 font-medium">Item</th>
              <th className="text-right p-3 font-medium">Qty</th>
              <th className="text-left p-3 font-medium">UOM</th>
              <th className="text-right p-3 font-medium">Rate</th>
              <th className="text-right p-3 font-medium">Disc%</th>
              <th className="text-right p-3 font-medium rounded-tr-md">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="p-3 text-gray-500">{idx + 1}</td>
                <td className="p-3">
                  <p className="font-medium text-gray-800">{item.item_name}</p>
                  {item.description && item.description !== item.item_name && (
                    <p className="text-xs text-gray-400">{item.description}</p>
                  )}
                </td>
                <td className="p-3 text-right tabular-nums">{item.qty}</td>
                <td className="p-3 text-gray-500">{item.uom}</td>
                <td className="p-3 text-right tabular-nums">{fmt(item.rate)}</td>
                <td className="p-3 text-right text-gray-500">
                  {(item.discount_percentage ?? 0) > 0 ? `${item.discount_percentage}%` : '—'}
                </td>
                <td className="p-3 text-right font-medium tabular-nums">{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="tabular-nums">PKR {fmt(subtotal)}</span>
            </div>
            {invoice.taxes?.map((tax, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-500">{tax.description} ({tax.rate}%)</span>
                <span className="tabular-nums">PKR {fmt(tax.tax_amount ?? 0)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold text-base">
              <span>Grand Total</span>
              <span className="tabular-nums">PKR {fmt(grandTotal)}</span>
            </div>
            {invoice.outstanding_amount !== undefined && (
              <div className={cn(
                'flex justify-between text-sm font-medium',
                (invoice.outstanding_amount ?? 0) <= 0 ? 'text-green-700' : 'text-orange-700'
              )}>
                <span>Outstanding</span>
                <span className="tabular-nums">PKR {fmt(invoice.outstanding_amount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {invoice.remarks && (
          <div className="mb-6 p-3 border border-gray-200 rounded-md">
            <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Remarks</p>
            <p className="text-sm text-gray-600">{invoice.remarks}</p>
          </div>
        )}

        <div className="border-t pt-6 text-center text-sm text-gray-400">
          <p className="font-medium text-gray-600 mb-1">Thank you for your business!</p>
          <p>For queries: kawishiqbal898@gmail.com</p>
          <p className="mt-2 text-xs">Generated by StockFlow · {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* ── Print-only CSS ── */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; }
          nav, aside, header { display: none !important; }
        }
      `}</style>
    </>
  );
}
