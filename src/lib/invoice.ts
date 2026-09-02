/**
 * Generate a printable HTML invoice for an order and open it in a new window.
 * The user can then print it to PDF or save it.
 */
import { formatVND, formatDate } from '@/lib/format';

interface InvoiceItem {
  name: string;
  sku?: string | null;
  productType: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl?: string | null;
}

interface InvoiceSellerOrder {
  shopName?: string;
  shopSlug?: string;
  items: InvoiceItem[];
  subtotal: number;
  shippingTotal: number;
  commissionAmount?: number;
  sellerRevenue?: number;
  fulfillmentType?: string;
}

interface InvoiceOrder {
  code: string;
  createdAt: string | Date;
  status: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  paymentMethod?: string | null;
  paymentStatus: string;
  shippingAddress?: string | null;
  items: InvoiceItem[];
  sellerOrders?: InvoiceSellerOrder[];
}

export function generateInvoiceHTML(order: InvoiceOrder): string {
  const address = order.shippingAddress ? JSON.parse(order.shippingAddress) : {};

  // Build seller breakdown section if sellerOrders available
  const sellerBreakdown = order.sellerOrders && order.sellerOrders.length > 0 ? `
    <div style="margin-top:24px;">
      <h3 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#06b6d4;margin-bottom:10px;">Seller Breakdown</h3>
      ${order.sellerOrders.map((so) => `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:600;font-size:13px;color:#0f172a;">${so.shop?.name ?? 'Shop'}</div>
            ${so.fulfillmentType ? `<span style="font-size:10px;padding:2px 8px;border-radius:999px;background:#f1f5f9;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">${so.fulfillmentType}</span>` : ''}
          </div>
          <div style="font-size:12px;color:#64748b;">
            ${so.items.map((item) => `${item.name} × ${item.quantity}`).join(' · ')}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px dashed #e2e8f0;">
            <span style="font-size:11px;color:#64748b;">Subtotal: ${formatVND(so.subtotal)} · Shipping: ${formatVND(so.shippingTotal)}</span>
            <span style="font-size:12px;font-weight:600;color:#0f172a;">${formatVND(so.subtotal + so.shippingTotal)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const itemsRows = order.items.map((item, i) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="color:#94a3b8;font-size:11px;font-weight:600;">${String(i + 1).padStart(2, '0')}</span>
          <div>
            <div style="font-weight:600;color:#0f172a;font-size:13px;">${item.name}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">
              ${item.sku ? `<span style="font-family:monospace;">${item.sku}</span> · ` : ''}${item.productType}
            </div>
          </div>
        </div>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;color:#475569;font-size:13px;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;color:#475569;font-size:13px;">${formatVND(item.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;font-weight:600;color:#0f172a;font-size:13px;">${formatVND(item.lineTotal)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice ${order.code} — CircuitHub</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; color: #0f172a; line-height: 1.5; padding: 24px; }
  .invoice { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px -8px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #06b6d4 0%, #2dd4bf 100%); padding: 32px 40px; color: white; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-brand { display: flex; align-items: center; gap: 12px; }
  .header-logo { width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .header-logo svg { width: 24px; height: 24px; }
  .header-name { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .header-tagline { font-size: 11px; opacity: 0.85; margin-top: 2px; }
  .header-invoice-label { text-align: right; }
  .header-invoice-label h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .header-invoice-label p { font-size: 13px; opacity: 0.9; font-family: monospace; }
  .body { padding: 32px 40px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .meta-block h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #06b6d4; margin-bottom: 8px; }
  .meta-block p { font-size: 13px; color: #334155; line-height: 1.6; }
  .meta-block .code { font-family: monospace; font-weight: 600; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #475569; border-bottom: 2px solid #e2e8f0; }
  thead th:not(:first-child) { text-align: right; }
  .totals { margin-left: auto; width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
  .totals-row span:first-child { color: #64748b; }
  .totals-row span:last-child { font-variant-numeric: tabular-nums; color: #0f172a; font-weight: 500; }
  .totals-divider { border-top: 1px solid #e2e8f0; margin: 8px 0; }
  .totals-grand { display: flex; justify-content: space-between; padding: 12px 0 4px; align-items: baseline; }
  .totals-grand span:first-child { font-size: 14px; font-weight: 700; color: #0f172a; }
  .totals-grand span:last-child { font-size: 22px; font-weight: 800; color: #06b6d4; font-variant-numeric: tabular-nums; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-paid { background: #d1fae5; color: #065f46; }
  .status-completed { background: #d1fae5; color: #065f46; }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-cancelled { background: #fee2e2; color: #991b1b; }
  .footer { background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; text-align: center; }
  .footer p { font-size: 11px; color: #94a3b8; line-height: 1.6; }
  .footer-brand { font-weight: 700; color: #475569; }
  .print-btn { position: fixed; top: 20px; right: 20px; background: #06b6d4; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px -4px rgba(6,182,212,0.5); transition: background 0.2s; }
  .print-btn:hover { background: #0891b2; }
  @media print { .print-btn { display: none; } body { background: white; padding: 0; } .invoice { box-shadow: none; max-width: 100%; border-radius: 0; } }
  @media (max-width: 640px) { .header { flex-direction: column; gap: 16px; } .meta-grid { grid-template-columns: 1fr; } .totals { width: 100%; } }
</style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
  <div class="invoice">
    <div class="header">
      <div class="header-brand">
        <div class="header-logo">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 5h14v14H5z" stroke="#06b6d4" stroke-width="2" stroke-linejoin="round"/>
            <path d="M8 8h8M8 12h8M8 16h5" stroke="#06b6d4" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="9" cy="9" r="1" fill="#06b6d4"/>
            <circle cx="15" cy="13" r="1" fill="#06b6d4"/>
          </svg>
        </div>
        <div>
          <div class="header-name">Circuit<span style="opacity:0.7">Hub</span></div>
          <div class="header-tagline">Build it. Design it. Ship it.</div>
        </div>
      </div>
      <div class="header-invoice-label">
        <h1>INVOICE</h1>
        <p>${order.code}</p>
      </div>
    </div>
    <div class="body">
      <div class="meta-grid">
        <div class="meta-block">
          <h3>Invoice Details</h3>
          <p>
            <span class="code">${order.code}</span><br/>
            Date: ${formatDate(order.createdAt)}<br/>
            Status: <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span><br/>
            Payment: <span class="status-badge status-${order.paymentStatus.toLowerCase()}">${order.paymentStatus}</span>
            ${order.paymentMethod ? ` · ${order.paymentMethod}` : ''}
          </p>
        </div>
        <div class="meta-block">
          <h3>Shipping Address</h3>
          <p>
            ${address.fullName || 'Customer'}<br/>
            ${address.phone || ''}<br/>
            ${address.line1 || ''}${address.line2 ? `, ${address.line2}` : ''}<br/>
            ${address.ward ? `${address.ward}, ` : ''}${address.district ? `${address.district}, ` : ''}${address.city || ''}<br/>
            ${address.country || 'Vietnam'} ${address.zipCode || ''}
          </p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      ${sellerBreakdown}

      <div class="totals">
        <div class="totals-row"><span>Subtotal</span><span>${formatVND(order.subtotal)}</span></div>
        ${order.discountTotal > 0 ? `<div class="totals-row"><span>Discount</span><span style="color:#059669;">−${formatVND(order.discountTotal)}</span></div>` : ''}
        <div class="totals-row"><span>Shipping</span><span>${formatVND(order.shippingTotal)}</span></div>
        <div class="totals-divider"></div>
        <div class="totals-grand"><span>Grand Total</span><span>${formatVND(order.grandTotal)}</span></div>
      </div>
    </div>
    <div class="footer">
      <p class="footer-brand">CircuitHub — The Engineering Marketplace for Hardware Creators</p>
      <p>Thank you for your purchase! For support, contact hello@circuithub.vn · +84 28 7300 1234</p>
      <p style="margin-top:8px;">This invoice was generated electronically and is valid without signature.</p>
    </div>
  </div>
</body>
</html>`;
}

export function downloadInvoice(order: InvoiceOrder) {
  const html = generateInvoiceHTML(order);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  // Clean up the URL after 1 second (allows the window to load)
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return win;
}
