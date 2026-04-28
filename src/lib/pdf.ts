/**
 * pdf.ts — Client-side PDF generation using jsPDF + jspdf-autotable.
 * All functions are async and lazily import jsPDF so the bundle is only
 * loaded when actually needed (not on initial page load).
 */

import type { InvoiceRecord } from '@/types/invoice.types';
import type { StockBalanceRow, StockLedgerRow } from '@/services/reports.service';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'StockFlow';
const BRAND_COLOR: [number, number, number] = [79, 70, 229]; // indigo-600

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pkr(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function today(): string {
  return new Date().toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function loadJsPDF() {
  return import('jspdf').then((mod) => mod.default ?? (mod as never));
}

function loadAutoTable() {
  return import('jspdf-autotable').then((mod) => mod.default ?? (mod as never));
}

// ─── Invoice PDF ──────────────────────────────────────────────────────────────

export async function downloadInvoicePdf(invoice: InvoiceRecord): Promise<void> {
  const [JsPDF, autoTable] = await Promise.all([loadJsPDF(), loadAutoTable()]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new (JsPDF as any)({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;

  // ── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_NAME, margin, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('ERPNext Stock Management', margin, 19);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES INVOICE', pageW - margin, 12, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${today()}`, pageW - margin, 19, { align: 'right' });

  // ── Invoice meta ────────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  let y = 38;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', margin, y);
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 1.5, pageW - margin, y + 1.5);
  y += 7;

  const metaLeft = [
    ['Invoice ID', invoice.id],
    ['Date', invoice.date],
    ['Source', invoice.source === 'erpnext' ? 'ERPNext' : 'Local'],
  ];
  const metaRight = [
    ['Customer', invoice.customer || 'Walk-in Customer'],
    ['Warehouse', invoice.warehouse || '—'],
    ['Remarks', invoice.remarks || '—'],
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  metaLeft.forEach(([label, value], i) => {
    const rowY = y + i * 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 30, rowY);
  });

  metaRight.forEach(([label, value], i) => {
    const rowY = y + i * 6;
    const cx = pageW / 2 + 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, cx, rowY);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), cx + 28, rowY);
  });

  y += metaLeft.length * 6 + 8;

  // ── Items table ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ITEMS', margin, y);
  doc.line(margin, y + 1.5, pageW - margin, y + 1.5);
  y += 4;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (autoTable as any)(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Product', 'Item Code', 'Qty', 'Unit Price', 'Total']],
    body: [
      [
        '1',
        invoice.item_name || invoice.item_code,
        invoice.item_code,
        invoice.qty.toLocaleString(),
        pkr(invoice.rate),
        pkr(invoice.total),
      ],
    ],
    headStyles: {
      fillColor: BRAND_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
    columnStyles: {
      0: { cellWidth: 8 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [246, 247, 251] },
    theme: 'striped',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTable = (doc as any).lastAutoTable.finalY + 6;

  // ── Totals box ──────────────────────────────────────────────────────────────
  const boxX = pageW - margin - 70;
  const boxY = afterTable;
  const boxW = 70;
  const boxH = 22;

  doc.setFillColor(246, 247, 251);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'F');
  doc.setDrawColor(220, 220, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', boxX + 4, boxY + 8);
  doc.text('Grand Total:', boxX + 4, boxY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(pkr(invoice.total), boxX + boxW - 4, boxY + 8, { align: 'right' });

  doc.setFontSize(11);
  doc.setTextColor(...BRAND_COLOR);
  doc.text(pkr(invoice.total), boxX + boxW - 4, boxY + 16, { align: 'right' });

  // ── Footer ──────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, pageH - 14, pageW, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated by ${APP_NAME} · ${today()}`, pageW / 2, pageH - 6, { align: 'center' });

  doc.save(`invoice-${invoice.id}.pdf`);
}

// ─── Stock Balance PDF ────────────────────────────────────────────────────────

export async function downloadStockBalancePdf(
  rows: StockBalanceRow[],
  filters?: { item_code?: string; warehouse?: string; from_date?: string; to_date?: string }
): Promise<void> {
  const [JsPDF, autoTable] = await Promise.all([loadJsPDF(), loadAutoTable()]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new (JsPDF as any)({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_NAME, margin, 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Stock Balance Report', margin, 17);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('STOCK BALANCE', pageW - margin, 10, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${today()}`, pageW - margin, 17, { align: 'right' });

  // Filter summary
  let y = 30;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  const filterParts: string[] = [];
  if (filters?.item_code) filterParts.push(`Item: ${filters.item_code}`);
  if (filters?.warehouse) filterParts.push(`Warehouse: ${filters.warehouse}`);
  if (filters?.from_date) filterParts.push(`From: ${filters.from_date}`);
  if (filters?.to_date) filterParts.push(`To: ${filters.to_date}`);
  if (filterParts.length) {
    doc.text(`Filters: ${filterParts.join(' | ')}`, margin, y);
    y += 6;
  }

  // Totals
  const totals = rows.reduce(
    (acc, r) => ({
      opening_qty: acc.opening_qty + (r.opening_qty ?? 0),
      in_qty: acc.in_qty + (r.in_qty ?? 0),
      out_qty: acc.out_qty + (r.out_qty ?? 0),
      bal_qty: acc.bal_qty + (r.bal_qty ?? 0),
      bal_val: acc.bal_val + (r.bal_val ?? 0),
    }),
    { opening_qty: 0, in_qty: 0, out_qty: 0, bal_qty: 0, bal_val: 0 }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (autoTable as any)(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Item Code', 'Item Name', 'Warehouse', 'Opening', 'In', 'Out', 'Balance Qty', 'Rate', 'Balance Value']],
    body: rows.map((r) => [
      r.item_code ?? '',
      r.item_name ?? '',
      r.warehouse ?? '',
      (r.opening_qty ?? 0).toLocaleString(),
      (r.in_qty ?? 0).toLocaleString(),
      (r.out_qty ?? 0).toLocaleString(),
      (r.bal_qty ?? 0).toLocaleString(),
      pkr(r.val_rate ?? 0),
      pkr(r.bal_val ?? 0),
    ]),
    foot: [[
      '', '', 'TOTALS',
      totals.opening_qty.toLocaleString(),
      totals.in_qty.toLocaleString(),
      totals.out_qty.toLocaleString(),
      totals.bal_qty.toLocaleString(),
      '',
      pkr(totals.bal_val),
    ]],
    headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    footStyles: { fillColor: [230, 232, 250], textColor: [30, 30, 80], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
    alternateRowStyles: { fillColor: [246, 247, 251] },
    theme: 'striped',
    showFoot: 'lastPage',
  });

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, pageH - 10, pageW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${APP_NAME} · Stock Balance Report · ${today()} · ${rows.length} items`, pageW / 2, pageH - 3.5, { align: 'center' });

  doc.save(`stock-balance-${new Date().toISOString().split('T')[0]}.pdf`);
}

// ─── Stock Ledger PDF ─────────────────────────────────────────────────────────

export async function downloadStockLedgerPdf(
  rows: StockLedgerRow[],
  filters?: { item_code?: string; warehouse?: string; from_date?: string; to_date?: string }
): Promise<void> {
  const [JsPDF, autoTable] = await Promise.all([loadJsPDF(), loadAutoTable()]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new (JsPDF as any)({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_NAME, margin, 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Stock Ledger Report', margin, 17);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('STOCK LEDGER', pageW - margin, 10, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${today()}`, pageW - margin, 17, { align: 'right' });

  // Filter summary
  let y = 30;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  const filterParts: string[] = [];
  if (filters?.item_code) filterParts.push(`Item: ${filters.item_code}`);
  if (filters?.warehouse) filterParts.push(`Warehouse: ${filters.warehouse}`);
  if (filters?.from_date) filterParts.push(`From: ${filters.from_date}`);
  if (filters?.to_date) filterParts.push(`To: ${filters.to_date}`);
  if (filterParts.length) {
    doc.text(`Filters: ${filterParts.join(' | ')}`, margin, y);
    y += 6;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (autoTable as any)(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Date', 'Voucher Type', 'Voucher No', 'Item', 'In Qty', 'Out Qty', 'Balance Qty', 'Val. Rate', 'Stock Value']],
    body: rows.map((r) => {
      const inQty = r.actual_qty > 0 ? r.actual_qty : 0;
      const outQty = r.actual_qty < 0 ? Math.abs(r.actual_qty) : 0;
      return [
        r.posting_date,
        r.voucher_type ?? '',
        r.voucher_no ?? '',
        r.item_code ?? '',
        inQty > 0 ? inQty.toLocaleString() : '—',
        outQty > 0 ? outQty.toLocaleString() : '—',
        (r.qty_after_transaction ?? 0).toLocaleString(),
        pkr(r.valuation_rate ?? 0),
        pkr(Math.abs(r.stock_value_difference ?? 0)),
      ];
    }),
    headStyles: { fillColor: BRAND_COLOR, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
    alternateRowStyles: { fillColor: [246, 247, 251] },
    theme: 'striped',
    didParseCell: (data: { section: string; column: { index: number }; cell: { styles: { textColor: number[] } }; row: { raw: (string | number)[] } }) => {
      if (data.section === 'body') {
        if (data.column.index === 4 && data.row.raw[4] !== '—') {
          data.cell.styles.textColor = [22, 163, 74];
        }
        if (data.column.index === 5 && data.row.raw[5] !== '—') {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
  });

  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, pageH - 10, pageW, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${APP_NAME} · Stock Ledger Report · ${today()} · ${rows.length} entries`, pageW / 2, pageH - 3.5, { align: 'center' });

  doc.save(`stock-ledger-${new Date().toISOString().split('T')[0]}.pdf`);
}
