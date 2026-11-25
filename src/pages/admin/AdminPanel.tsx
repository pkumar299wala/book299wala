// Book.299wala.com - Protected Admin Panel Shell (/admin)
// Real Firebase Auth Email/Password Login ONLY (Galaxyscienceacademy@gmail.com)
// - ZERO demo passwords or hints in code/UI
// - 5 wrong password attempts -> 15 minute lockout
// - Forgot Password -> Sends reset link to Galaxyscienceacademy@gmail.com
// - 2-hour auto-logout after browser close/inactivity
// - Admin Activity Log (Kaun, Kab, Kya Change Kiya)

import React, { useEffect, useState } from 'react';
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  FolderOpen,
  IndianRupee,
  Lock,
  LogOut,
  Package,
  PlusCircle,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react';
import { auth } from '../../firebase';
import { ADMIN_EMAIL } from '../../services/firestoreService';
import {
  AdminActivityLog,
  ClassLevel,
  ContactMessage,
  Coupon,
  Customer,
  EmailNotificationLog,
  FestivalOffer,
  Order,
  OrderStatus,
  Product,
  SiteSettings,
  UploadedFileRecord,
} from '../../types';
import {
  AdminFileManager,
  AdminPriceManager,
  AdminProductForm,
  AdminProductList,
} from './AdminProductsAndPricing';
import {
  AdminActivityLogView,
  AdminAnalyticsDashboard,
  AdminCustomerManager,
  AdminNotificationsCenter,
  AdminOrderManager,
  AdminSettingsManager,
} from './AdminOrdersAnalyticsSettings';

type AdminTab =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'add-product'
  | 'pricing'
  | 'files'
  | 'customers'
  | 'notifications'
  | 'activity'
  | 'settings';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const SESSION_KEY = 'b299_admin_last_active_ts';
const LOCK_KEY = 'b299_admin_lockout_state';

interface AdminPanelProps {
  currentUser: User | null;
  onBackToStore: () => void;
  products: Product[];
  orders: Order[];
  customers: Customer[];
  coupons: Coupon[];
  offers: FestivalOffer[];
  files: UploadedFileRecord[];
  activityLogs: AdminActivityLog[];
  emails: EmailNotificationLog[];
  contacts: ContactMessage[];
  settings: SiteSettings;
  onSaveProduct: (product: Product, newFiles: UploadedFileRecord[]) => Promise<void>;
  onDeleteProduct: (p: Product) => Promise<void>;
  onDuplicateProduct: (p: Product) => Promise<void>;
  onToggleProductStatus: (p: Product) => Promise<void>;
  onQuickPriceSave: (p: Product, mrp: number, sellingPrice: number) => Promise<void>;
  onBulkClassDiscount: (cls: ClassLevel, pct: number) => Promise<void>;
  onSaveCoupon: (c: Coupon) => Promise<void>;
  onDeleteCoupon: (c: Coupon) => Promise<void>;
  onSaveOffer: (o: FestivalOffer) => Promise<void>;
  onToggleWatermark: () => Promise<void>;
  onDeleteFile: (file: UploadedFileRecord) => Promise<void>;
  onReplaceProductFile: (productId: string, file: UploadedFileRecord) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onSendDailyReportNow: () => Promise<void>;
  onToggleBlockCustomer: (c: Customer) => Promise<void>;
  onSaveSettings: (s: SiteSettings) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const [emailInput, setEmailInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const isAuthorizedAdmin =
    Boolean(props.currentUser) &&
    props.currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Check initial lockout state from server + client
  useEffect(() => {
    const readClientLock = () => {
      try {
        const raw = localStorage.getItem(LOCK_KEY);
        if (!raw) return 0;
        const parsed = JSON.parse(raw) as { lockedUntil: number };
        return parsed.lockedUntil > Date.now()
          ? Math.ceil((parsed.lockedUntil - Date.now()) / 1000)
          : 0;
      } catch {
        return 0;
      }
    };
    setLockSeconds(readClientLock());
    fetch('/api/auth/admin-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check', email: ADMIN_EMAIL }),
    })
      .then((r) => r.json())
      .then((d: { locked?: boolean; remainingSeconds?: number }) => {
        if (d.locked && d.remainingSeconds) setLockSeconds(d.remainingSeconds);
      })
      .catch(() => {});
  }, []);

  // Countdown timer for 15-minute lockout
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const t = setInterval(() => setLockSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockSeconds]);

  // 2-hour auto-logout after browser close or inactivity
  useEffect(() => {
    if (!isAuthorizedAdmin) return;
    const lastTs = Number(localStorage.getItem(SESSION_KEY) || '0');
    if (lastTs && Date.now() - lastTs > TWO_HOURS_MS) {
      localStorage.removeItem(SESSION_KEY);
      signOut(auth);
      return;
    }
    const touch = () => localStorage.setItem(SESSION_KEY, String(Date.now()));
    touch();
    const events = ['click', 'keydown', 'mousemove', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, touch, { passive: true }));
    const timer = setInterval(() => {
      const latest = Number(localStorage.getItem(SESSION_KEY) || '0');
      if (latest && Date.now() - latest > TWO_HOURS_MS) {
        localStorage.removeItem(SESSION_KEY);
        signOut(auth);
      }
    }, 60000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, touch));
      clearInterval(timer);
    };
  }, [isAuthorizedAdmin]);

  const recordFailedAttempt = async () => {
    let localCount = 1;
    let lockedUntil = 0;
    try {
      const raw = localStorage.getItem(LOCK_KEY);
      const prev = raw ? (JSON.parse(raw) as { count: number; lockedUntil: number }) : { count: 0, lockedUntil: 0 };
      localCount = prev.lockedUntil > Date.now() ? 5 : prev.count + 1;
      if (localCount >= 5) {
        lockedUntil = Date.now() + 15 * 60 * 1000;
      }
      localStorage.setItem(LOCK_KEY, JSON.stringify({ count: localCount, lockedUntil }));
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/auth/admin-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fail', email: ADMIN_EMAIL }),
      });
      const data = (await res.json()) as { locked: boolean; remainingSeconds: number; attemptsLeft: number };
      if (data.locked) {
        setLockSeconds(data.remainingSeconds);
        return 0;
      }
      return data.attemptsLeft;
    } catch {
      if (lockedUntil > Date.now()) {
        setLockSeconds(15 * 60);
        return 0;
      }
      return Math.max(0, 5 - localCount);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');
    setResetMsg('');

    if (lockSeconds > 0) {
      setLoginErr(`Account locked. ${Math.ceil(lockSeconds / 60)} minute baad try karein.`);
      return;
    }

    const emailClean = emailInput.trim();
    if (emailClean.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      const left = await recordFailedAttempt();
      setLoginErr(
        left === 0
          ? '5 galat koshish ke baad account 15 minute ke liye lock ho gaya hai.'
          : `Access Denied: Sirf authorized Admin email hi login kar sakta hai. (${left} attempts left)`
      );
      return;
    }

    if (passInput.length < 8) {
      const left = await recordFailedAttempt();
      setLoginErr(
        left === 0
          ? '5 galat koshish ke baad account 15 minute ke liye lock ho gaya hai.'
          : `Invalid credentials. (${left} attempts left)`
      );
      return;
    }

    setLoadingAuth(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, emailClean, passInput);
      if (cred.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        await signOut(auth);
        setLoginErr('Unauthorized account.');
        return;
      }
      localStorage.removeItem(LOCK_KEY);
      localStorage.setItem(SESSION_KEY, String(Date.now()));
      await fetch('/api/auth/admin-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'success', email: ADMIN_EMAIL }),
      }).catch(() => {});
      setPassInput('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('operation-not-allowed')) {
        setLoginErr(
          'Firebase Console > Authentication > Sign-in method me Email/Password provider enable karein aur Admin user add karein.'
        );
      } else {
        const left = await recordFailedAttempt();
        setLoginErr(
          left === 0
            ? '5 galat password ke baad Admin Login 15 minute ke liye lock ho gaya hai.'
            : `Galat Email ya Password. (${left} attempts remaining)`
        );
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoginErr('');
    setResetMsg('');
    setLoadingAuth(true);
    try {
      await sendPasswordResetEmail(auth, ADMIN_EMAIL);
      setResetMsg(`Password reset link ${ADMIN_EMAIL} par bhej diya gaya hai. Apna inbox check karein.`);
    } catch (err) {
      setLoginErr(
        `Reset email bhejne me error: ${err instanceof Error ? err.message : 'Check Firebase Email/Password setup'}`
      );
    } finally {
      setLoadingAuth(false);
    }
  };

  if (!isAuthorizedAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F4F6] p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B2C6F] text-white">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#0B2C6F]">
                Admin Login · Book.299wala
              </h1>
              <p className="text-xs text-slate-500">Firebase Authentication Protected</p>
            </div>
          </div>

          <form onSubmit={handleAdminSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">Admin Email</label>
              <input
                type="email"
                required
                autoComplete="username"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter admin email"
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="Enter password"
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            {lockSeconds > 0 && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
                Security Lockout Active: {Math.floor(lockSeconds / 60)}m {lockSeconds % 60}s remaining
              </div>
            )}

            {loginErr && (
              <p className="rounded-lg bg-red-50 p-2.5 text-xs font-semibold text-red-700 border border-red-200">
                {loginErr}
              </p>
            )}

            {resetMsg && (
              <p className="rounded-lg bg-green-50 p-2.5 text-xs font-semibold text-[#16A34A] border border-green-200">
                {resetMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loadingAuth || lockSeconds > 0}
              className="min-h-[46px] w-full rounded-lg bg-[#0B2C6F] text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-50 cursor-pointer"
            >
              {loadingAuth ? 'Verifying...' : 'Login'}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={loadingAuth}
                onClick={handleForgotPassword}
                className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={props.onBackToStore}
                className="text-xs font-semibold text-slate-600 hover:underline cursor-pointer"
              >
                Back to Store
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Sales & Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'products', label: 'Manage Products', icon: <Package className="h-4 w-4" /> },
    { id: 'add-product', label: 'Add New Product', icon: <PlusCircle className="h-4 w-4" /> },
    { id: 'pricing', label: 'Price & Coupons', icon: <IndianRupee className="h-4 w-4" /> },
    { id: 'files', label: 'File Manager', icon: <FolderOpen className="h-4 w-4" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="h-4 w-4" /> },
    { id: 'notifications', label: 'Emails & Alerts', icon: <Bell className="h-4 w-4" /> },
    { id: 'activity', label: 'Activity Log', icon: <Activity className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const handleLogout = async () => {
    localStorage.removeItem(SESSION_KEY);
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#0B2C6F] px-4 py-3 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-lg font-extrabold">
              Book.<span className="text-[#FF6B00]">299wala</span> Admin
            </span>
            <span className="text-xs font-medium text-blue-100">
              Logged in as: <strong>{props.currentUser?.email}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={props.onBackToStore}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-bold text-white hover:bg-white/25 cursor-pointer"
            >
              <Store className="h-4 w-4" />
              View Website
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#FF6B00] px-3 text-xs font-bold text-white hover:bg-orange-600 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Email Verification Prompt if Admin account created in Console is not yet verified */}
      {props.currentUser && !props.currentUser.emailVerified && (
        <div className="mx-auto mt-4 max-w-7xl px-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
              <span>
                Firestore security rules ke liye <strong>{props.currentUser.email}</strong> verify hona zaroori hai.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!props.currentUser) return;
                  await sendEmailVerification(props.currentUser);
                  setVerifyMsg(`Verification email ${props.currentUser.email} par bhej diya gaya hai!`);
                }}
                className="rounded-lg bg-amber-700 px-3 py-1.5 font-bold text-white cursor-pointer"
              >
                Send Verification Link
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 font-bold text-amber-900 cursor-pointer"
              >
                Refresh Status
              </button>
            </div>
            {verifyMsg && <p className="w-full font-bold text-[#16A34A]">{verifyMsg}</p>}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:rounded-xl lg:border lg:border-slate-200 lg:bg-white lg:p-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'add-product') setEditingProduct(null);
                  setActiveTab(item.id);
                }}
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#0B2C6F] text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 lg:bg-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 lg:col-span-9">
          {activeTab === 'dashboard' && (
            <AdminAnalyticsDashboard orders={props.orders} products={props.products} />
          )}

          {activeTab === 'products' && (
            <AdminProductList
              products={props.products}
              onAddNew={() => {
                setEditingProduct(null);
                setActiveTab('add-product');
              }}
              onEdit={(p) => {
                setEditingProduct(p);
                setActiveTab('add-product');
              }}
              onDelete={props.onDeleteProduct}
              onDuplicate={props.onDuplicateProduct}
              onToggleStatus={props.onToggleProductStatus}
            />
          )}

          {activeTab === 'add-product' && (
            <AdminProductForm
              editingProduct={editingProduct}
              onSaveProduct={async (p, newFiles) => {
                await props.onSaveProduct(p, newFiles);
                setEditingProduct(null);
                setActiveTab('products');
              }}
              onCancel={() => {
                setEditingProduct(null);
                setActiveTab('products');
              }}
            />
          )}

          {activeTab === 'pricing' && (
            <AdminPriceManager
              products={props.products}
              coupons={props.coupons}
              offers={props.offers}
              onQuickPriceSave={props.onQuickPriceSave}
              onBulkClassDiscount={props.onBulkClassDiscount}
              onSaveCoupon={props.onSaveCoupon}
              onDeleteCoupon={props.onDeleteCoupon}
              onSaveOffer={props.onSaveOffer}
            />
          )}

          {activeTab === 'files' && (
            <AdminFileManager
              files={props.files}
              products={props.products}
              settings={props.settings}
              onToggleWatermark={props.onToggleWatermark}
              onDeleteFile={props.onDeleteFile}
              onReplaceProductFile={props.onReplaceProductFile}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrderManager
              orders={props.orders}
              onUpdateStatus={props.onUpdateOrderStatus}
            />
          )}

          {activeTab === 'notifications' && (
            <AdminNotificationsCenter
              emails={props.emails}
              contacts={props.contacts}
              settings={props.settings}
              onSendDailyReportNow={props.onSendDailyReportNow}
            />
          )}

          {activeTab === 'customers' && (
            <AdminCustomerManager
              customers={props.customers}
              orders={props.orders}
              onToggleBlock={props.onToggleBlockCustomer}
            />
          )}

          {activeTab === 'activity' && <AdminActivityLogView logs={props.activityLogs} />}

          {activeTab === 'settings' && (
            <AdminSettingsManager
              settings={props.settings}
              onSaveSettings={props.onSaveSettings}
            />
          )}
        </section>
      </div>
    </div>
  );
};
