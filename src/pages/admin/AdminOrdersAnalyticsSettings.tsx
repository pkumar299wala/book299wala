// Book.299wala.com - Admin Modules 5, 6, 7, 8, 9, 10 + Admin Activity Log:
// Analytics, Orders, Notifications, Customers, Activity Log, Safe Settings (No Passwords in Code)

import React, { useMemo, useState } from 'react';
import {
  Activity,
  Download,
  Eye,
  Mail,
  MessageCircle,
  Send,
  TrendingUp,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import {
  AdminActivityLog,
  ContactMessage,
  Customer,
  EmailNotificationLog,
  Order,
  OrderStatus,
  Product,
  SiteSettings,
} from '../../types';
import { exportSalesReportExcel } from '../../services/pdfService';
import { uploadFileToStorage } from '../../services/firestoreService';

// MODULE 8: DASHBOARD & SALES REPORT ANALYTICS
export const AdminAnalyticsDashboard: React.FC<{
  orders: Order[];
  products: Product[];
}> = ({ orders, products }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const activeOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === 'Cancelled') return false;
      const d = o.createdAt.slice(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

  const metrics = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);
    const weekAgo = now - 7 * 86400000;
    const monthAgo = now - 30 * 86400000;

    let todaySale = 0;
    let weekSale = 0;
    let monthSale = 0;
    const productCounts: Record<string, { name: string; units: number; revenue: number }> = {};

    activeOrders.forEach((o) => {
      const ts = new Date(o.createdAt).getTime();
      if (o.createdAt.slice(0, 10) === todayStr) todaySale += o.grandTotal;
      if (ts >= weekAgo) weekSale += o.grandTotal;
      if (ts >= monthAgo) monthSale += o.grandTotal;

      o.items.forEach((it) => {
        if (!productCounts[it.productId]) {
          productCounts[it.productId] = { name: it.productName, units: 0, revenue: 0 };
        }
        productCounts[it.productId].units += it.quantity;
        productCounts[it.productId].revenue += it.price * it.quantity;
      });
    });

    const top5 = Object.values(productCounts)
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 5);

    const dailyBars: { label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const iso = d.toISOString().slice(0, 10);
      const sum = activeOrders
        .filter((o) => o.createdAt.slice(0, 10) === iso)
        .reduce((acc, o) => acc + o.grandTotal, 0);
      dailyBars.push({
        label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        amount: sum,
      });
    }

    return { todaySale, weekSale, monthSale, top5, dailyBars };
  }, [activeOrders]);

  const maxBar = Math.max(100, ...metrics.dailyBars.map((b) => b.amount));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Aaj Ki Sale</p>
          <p className="mt-1 font-mono-num text-2xl font-extrabold text-[#16A34A]">
            ₹{metrics.todaySale}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Is Hafte Ki Sale</p>
          <p className="mt-1 font-mono-num text-2xl font-extrabold text-[#0B2C6F]">
            ₹{metrics.weekSale}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Is Mahine Ki Sale</p>
          <p className="mt-1 font-mono-num text-2xl font-extrabold text-[#FF6B00]">
            ₹{metrics.monthSale}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Total Orders</p>
          <p className="mt-1 font-mono-num text-2xl font-extrabold text-slate-900">
            {activeOrders.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Total Products</p>
          <p className="mt-1 font-mono-num text-2xl font-extrabold text-slate-900">
            {products.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Best Selling</p>
          <p className="mt-1 line-clamp-2 text-xs font-bold text-[#0B2C6F]">
            {metrics.top5[0]?.name || products[0]?.name || '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Date Range Filter:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-2.5"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-2.5"
          />
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="font-bold text-[#FF6B00] hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportSalesReportExcel(activeOrders, 'xlsx')}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#16A34A] px-4 text-xs font-bold text-white hover:bg-green-700 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => exportSalesReportExcel(activeOrders, 'csv')}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#0B2C6F]" />
            <h3 className="font-display text-base font-bold text-slate-900">
              Daily Sales Graph (Last 7 Days)
            </h3>
          </div>
          <div className="mt-6 flex h-56 items-end justify-between gap-2 border-b border-slate-200 pb-2">
            {metrics.dailyBars.map((bar) => {
              const heightPct = Math.max(6, Math.round((bar.amount / maxBar) * 100));
              return (
                <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                  <span className="font-mono-num text-[11px] font-bold text-slate-700">
                    ₹{bar.amount}
                  </span>
                  <div
                    className="w-full max-w-[42px] rounded-t-md bg-[#0B2C6F] transition-all"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[11px] font-medium text-slate-500">{bar.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <h3 className="font-display text-base font-bold text-slate-900">
            Top 5 Best Selling Products
          </h3>
          {metrics.top5.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">Naye orders aane par yahan top products dikhenge.</p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {metrics.top5.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="mr-2 font-mono-num font-bold text-[#FF6B00]">0{i + 1}.</span>
                    <span className="font-medium text-slate-800">{item.name}</span>
                  </div>
                  <div className="shrink-0 text-right font-mono-num">
                    <div className="font-bold text-slate-900">₹{item.revenue}</div>
                    <div className="text-[11px] text-slate-500">{item.units} Sold</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// MODULE 5: ORDER MANAGEMENT
export const AdminOrderManager: React.FC<{
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}> = ({ orders, onUpdateStatus }) => {
  const [periodFilter, setPeriodFilter] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');
  const [search, setSearch] = useState('');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toISOString().slice(0, 10);
    return orders.filter((o) => {
      const ts = new Date(o.createdAt).getTime();
      if (periodFilter === 'Today' && o.createdAt.slice(0, 10) !== todayStr) return false;
      if (periodFilter === 'Week' && ts < now - 7 * 86400000) return false;
      if (periodFilter === 'Month' && ts < now - 30 * 86400000) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${o.id} ${o.customerName} ${o.mobile}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, periodFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['All', 'Today', 'Week', 'Month'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setPeriodFilter(f)}
              className={`h-9 rounded-lg px-3.5 text-xs font-bold cursor-pointer ${
                periodFilter === f
                  ? 'bg-[#0B2C6F] text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {f === 'Week' ? 'This Week' : f === 'Month' ? 'This Month' : f === 'All' ? 'All Orders' : 'Today'}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Mobile / Order ID / Name..."
          className="h-10 w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                  Koi orders nahi mile.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono-num font-bold text-[#0B2C6F]">
                    #{o.id}
                    <div className="text-[11px] font-normal text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{o.customerName}</div>
                    <div className="font-mono-num text-xs text-slate-500">
                      {o.mobile} · {o.classLevel}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-[200px]">
                    {o.items.map((i) => i.productName).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-num font-bold text-slate-900">
                    ₹{o.grandTotal}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-semibold">{o.paymentMethod}</div>
                    <div className="text-slate-500">{o.paymentStatus}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => onUpdateStatus(o.id, e.target.value as OrderStatus)}
                      className="h-9 rounded border border-slate-300 bg-white px-2 text-xs font-bold"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailOrder(o)}
                      className="inline-flex h-8 items-center gap-1 rounded border border-slate-200 px-2.5 text-xs font-bold text-[#0B2C6F] hover:bg-blue-50 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-lg font-bold text-[#0B2C6F]">
                Order Detail · #{detailOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="rounded p-1 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-[#F3F4F6] p-3 text-xs">
                <div>
                  <span className="text-slate-500">Name:</span>{' '}
                  <strong>{detailOrder.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Mobile / WA:</span>{' '}
                  <strong className="font-mono-num">{detailOrder.mobile}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Class:</span>{' '}
                  <strong>{detailOrder.classLevel}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Total:</span>{' '}
                  <strong className="font-mono-num">₹{detailOrder.grandTotal}</strong>
                </div>
                {detailOrder.address && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Delivery Address:</span>{' '}
                    <strong>
                      {detailOrder.address}, {detailOrder.city} {detailOrder.pincode}
                    </strong>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  Items & Download History
                </p>
                <ul className="mt-2 space-y-2">
                  {detailOrder.items.map((it) => (
                    <li
                      key={it.productId}
                      className="flex justify-between rounded border border-slate-200 p-2.5 text-xs"
                    >
                      <span>{it.productName}</span>
                      <span className="font-mono-num font-bold text-[#0B2C6F]">
                        {it.productType === 'Digital'
                          ? `Downloads: ${it.downloadCount}/3`
                          : `Qty: ${it.quantity}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  Payment Screenshot Proof
                </p>
                {detailOrder.paymentScreenshot ? (
                  <img
                    src={detailOrder.paymentScreenshot}
                    alt="Customer Payment Screenshot"
                    className="mt-2 max-h-60 rounded-lg border border-slate-200 object-contain"
                  />
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    Koi screenshot upload nahi hua (Payment Mode: {detailOrder.paymentMethod}).
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ADMIN ACTIVITY LOG (Kaun, Kab, Kya Change Kiya)
export const AdminActivityLogView: React.FC<{
  logs: AdminActivityLog[];
}> = ({ logs }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-[#0B2C6F]" />
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Admin Activity Log (Audit Trail)
          </h3>
          <p className="text-xs text-slate-500">
            Kaun, Kab, Kya Change Kiya — Product Add, Price Change, Delete, Settings (Immutable Firestore Log)
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">Abhi tak koi admin activity record nahi hui.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
              <tr>
                <th className="px-3 py-2.5">Kab (Time)</th>
                <th className="px-3 py-2.5">Kaun (Admin)</th>
                <th className="px-3 py-2.5">Kya Kiya (Action)</th>
                <th className="px-3 py-2.5">Target & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono-num text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-[#0B2C6F]">{log.adminEmail}</td>
                  <td className="px-3 py-2.5 font-bold text-slate-900">{log.action}</td>
                  <td className="px-3 py-2.5 text-slate-700">
                    <div className="font-semibold">{log.target}</div>
                    <div className="text-xs text-slate-500">{log.details}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// MODULE 6: EMAIL & WHATSAPP NOTIFICATION CENTER
export const AdminNotificationsCenter: React.FC<{
  emails: EmailNotificationLog[];
  contacts: ContactMessage[];
  settings: SiteSettings;
  onSendDailyReportNow: () => Promise<void>;
}> = ({ emails, contacts, settings, onSendDailyReportNow }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h3 className="font-display text-base font-bold text-[#0B2C6F]">
            Email & WhatsApp Alert Automation
          </h3>
          <p className="text-xs text-slate-600">
            Admin Email: <strong>{settings.adminEmail}</strong> · WhatsApp Alert:{' '}
            <strong className="font-mono-num">{settings.whatsapp}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSendDailyReportNow}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#0B2C6F] px-4 text-xs font-bold text-white cursor-pointer"
          >
            <Send className="h-4 w-4" />
            Send Daily 9 PM Report Now
          </button>
          <a
            href={`https://wa.me/91${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Book.299wala.com Daily Update: Total ${emails.length} notifications logged.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#16A34A] px-4 text-xs font-bold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Alert ({settings.whatsapp})
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Mail className="h-5 w-5 text-[#FF6B00]" />
          <h3 className="font-display text-base font-bold text-slate-900">
            Dispatched Emails Log ({emails.length})
          </h3>
        </div>
        <div className="space-y-3">
          {emails.map((mail) => (
            <div key={mail.id} className="rounded-lg border border-slate-200 bg-[#F3F4F6] p-3.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#0B2C6F]">TO: {mail.to}</span>
                <span className="font-mono-num text-slate-500">
                  {new Date(mail.sentAt).toLocaleString('en-IN')} · {mail.status}
                </span>
              </div>
              <p className="mt-1 font-display text-sm font-bold text-slate-900">{mail.subject}</p>
              <p className="mt-1 whitespace-pre-line text-slate-700">{mail.body}</p>
            </div>
          ))}
        </div>
      </div>

      {contacts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-base font-bold text-slate-900">
            Customer Contact Form Messages ({contacts.length})
          </h3>
          <div className="mt-3 space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                <p className="font-bold">
                  {c.name} · <span className="font-mono-num">{c.mobile}</span> ({c.email})
                </p>
                <p className="mt-1 text-slate-700">{c.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// MODULE 7: CUSTOMER MANAGEMENT
export const AdminCustomerManager: React.FC<{
  customers: Customer[];
  orders: Order[];
  onToggleBlock: (customer: Customer) => Promise<void>;
}> = ({ customers, orders, onToggleBlock }) => {
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
            <tr>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3 text-right">Total Spent</th>
              <th className="px-4 py-3">Last Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-500">
                  Abhi tak koi customer registered nahi hai.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {c.name}
                    {c.isBlocked && (
                      <span className="ml-2 text-xs font-bold text-red-600">(Blocked)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono-num text-xs">{c.mobile}</td>
                  <td className="px-4 py-3 text-xs">{c.classLevel}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-bold">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-right font-mono-num font-bold text-[#16A34A]">
                    ₹{c.totalSpent}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(c.lastOrderDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCust(c)}
                        className="rounded border border-slate-200 px-2.5 py-1 text-xs font-bold text-[#0B2C6F] cursor-pointer"
                      >
                        History
                      </button>
                      <a
                        href={`https://wa.me/91${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Namaste ${c.name}, Galaxy Science Academy (Book.299wala.com) se sampark kar rahe hain.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-[#16A34A] px-2.5 py-1 text-xs font-bold text-white"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => onToggleBlock(c)}
                        className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold cursor-pointer ${
                          c.isBlocked
                            ? 'bg-slate-200 text-slate-800'
                            : 'border border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {c.isBlocked ? (
                          <UserCheck className="h-3.5 w-3.5" />
                        ) : (
                          <UserX className="h-3.5 w-3.5" />
                        )}
                        {c.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-lg font-bold text-[#0B2C6F]">
                {selectedCust.name} — Kya-Kya Kharida
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCust(null)}
                className="cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto text-xs">
              {orders
                .filter((o) => o.userId === selectedCust.id || o.mobile === selectedCust.mobile)
                .map((o) => (
                  <div key={o.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex justify-between font-bold">
                      <span>#{o.id}</span>
                      <span className="font-mono-num">₹{o.grandTotal}</span>
                    </div>
                    <p className="mt-1 text-slate-600">
                      {o.items.map((i) => i.productName).join(', ')}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// MODULE 9 & 10: SAFE SETTINGS (NO PASSWORDS STORED IN SETTINGS)
export const AdminSettingsManager: React.FC<{
  settings: SiteSettings;
  onSaveSettings: (next: SiteSettings) => Promise<void>;
}> = ({ settings, onSaveSettings }) => {
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { publicUrl } = await uploadFileToStorage({ file, folder: 'branding' });
      if (publicUrl) {
        setForm((prev) => ({ ...prev, logoUrl: publicUrl }));
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSaveSettings(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
    >
      <div className="border-b border-slate-200 pb-4">
        <h3 className="font-display text-lg font-bold text-[#0B2C6F]">
          Website, UPI & WhatsApp Settings (Firestore Protected)
        </h3>
        <p className="text-xs text-slate-500">
          UPI ID, WhatsApp aur delivery charges sirf verified Admin hi badal sakte hain. Password change Firebase Auth Email Reset se hota hai.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-xs font-bold text-slate-700">Website Name</label>
          <input
            type="text"
            value={form.websiteName}
            onChange={(e) => setForm({ ...form, websiteName: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">UPI ID</label>
          <input
            type="text"
            value={form.upiId}
            onChange={(e) => setForm({ ...form, upiId: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">
            Upload New Logo {uploadingLogo ? '(Uploading...)' : ''}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="mt-1 block w-full text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">Admin Notification Email</label>
          <input
            type="email"
            value={form.adminEmail}
            onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">Mobile / WhatsApp Number</label>
          <input
            type="text"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value, mobile: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">Digital / Physical Delivery (₹)</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="number"
              value={form.digitalDeliveryCharge}
              onChange={(e) => setForm({ ...form, digitalDeliveryCharge: Number(e.target.value) })}
              className="h-10 rounded-lg border border-slate-300 px-2.5 text-sm font-mono-num"
            />
            <input
              type="number"
              value={form.physicalDeliveryCharge}
              onChange={(e) => setForm({ ...form, physicalDeliveryCharge: Number(e.target.value) })}
              className="h-10 rounded-lg border border-slate-300 px-2.5 text-sm font-mono-num"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2 sm:col-span-2 lg:col-span-3">
          <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={form.codEnabled}
              onChange={(e) => setForm({ ...form, codEnabled: e.target.checked })}
              className="h-4 w-4 accent-[#16A34A]"
            />
            COD On / Off
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={form.watermarkEnabled}
              onChange={(e) => setForm({ ...form, watermarkEnabled: e.target.checked })}
              className="h-4 w-4 accent-[#0B2C6F]"
            />
            PDF Watermark
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700">About Us Text</label>
          <textarea
            rows={3}
            value={form.aboutText}
            onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">Refund Policy Text</label>
          <textarea
            rows={3}
            value={form.refundPolicyText}
            onChange={(e) => setForm({ ...form, refundPolicyText: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700">Contact Address</label>
          <input
            type="text"
            value={form.contactAddress}
            onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </div>
      </div>

      {saved && (
        <p className="text-xs font-bold text-[#16A34A]">
          All settings Firestore me save ho gayi hain!
        </p>
      )}

      <button
        type="submit"
        className="h-11 rounded-lg bg-[#16A34A] px-6 text-sm font-bold text-white hover:bg-green-700 cursor-pointer"
      >
        Save Settings to Firestore
      </button>
    </form>
  );
};
