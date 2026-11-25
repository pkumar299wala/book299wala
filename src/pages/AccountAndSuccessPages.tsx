// Book.299wala.com - Order Success, My Account (Firebase Phone Auth), About, Contact & Policies
import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  CheckCircle2,
  Download,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { CLASS_LEVELS } from '../data/seedData';
import { ClassLevel, Customer, Order, Product, SiteSettings } from '../types';
import { generateWatermarkedProductFile, triggerBlobDownload } from '../services/pdfService';
import { PhoneOtpAuth } from '../components/PhoneOtpAuth';

interface OrderSuccessProps {
  order: Order;
  products: Product[];
  settings: SiteSettings;
  onDownloadItem: (order: Order, productId: string) => Promise<void>;
  onGoHome: () => void;
  onGoAccount: () => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessProps> = ({
  order,
  products,
  settings,
  onDownloadItem,
  onGoHome,
  onGoAccount,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadMsg, setDownloadMsg] = useState('');

  const handleDownload = async (productId: string) => {
    const item = order.items.find((i) => i.productId === productId);
    if (!item) return;
    if (item.downloadCount >= settings.maxDownloadLimit) {
      setDownloadMsg(
        `Is order par maximum ${settings.maxDownloadLimit} downloads poore ho chuke hain. Support ke liye WhatsApp ${settings.whatsapp} par message karein.`
      );
      return;
    }

    setDownloadingId(productId);
    setDownloadMsg('');
    try {
      const product = products.find((p) => p.id === productId);
      const { blob, filename } = await generateWatermarkedProductFile({
        order,
        product,
        productId,
        watermarkEnabled: settings.watermarkEnabled,
      });
      triggerBlobDownload(blob, filename);
      await onDownloadItem(order, productId);
      setDownloadMsg(
        `Download Shuru Ho Gaya! Har page par watermark laga hai: "For: ${order.customerName} - ${order.mobile.slice(0, 5)}xxxxx - Order #${order.id} - Book.299wala.com"`
      );
    } catch (err) {
      setDownloadMsg(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const whatsappShareUrl = `https://wa.me/91${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Namaste Pappu Sir, mera Order #${order.id} confirm ho gaya hai.\nName: ${order.customerName}\nMobile: ${order.mobile}\nAmount: ₹${order.grandTotal}\nPayment Mode: ${order.paymentMethod}\nKripya mere order ka status aur link check kar lein.`
  )}`;

  const hasDigital = order.items.some((i) => i.productType === 'Digital');
  const hasPhysical = order.items.some((i) => i.productType === 'Physical');

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-[#16A34A]">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold text-[#16A34A]">
            Order Confirm Ho Gaya!
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Dhanyawad <strong>{order.customerName}</strong>! Aapka Order ID hai{' '}
            <span className="font-mono-num font-bold text-[#0B2C6F]">#{order.id}</span>
          </p>
        </div>

        {hasPhysical && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-[#0B2C6F]">
            <Truck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Order Confirmed, Tracking ID Soon</p>
              <p className="text-xs text-slate-700">
                Aapki physical book/kit 3-5 dino me courier se bhej di jayegi. Tracking details WhatsApp ({order.whatsapp}) par mil jayengi.
              </p>
            </div>
          </div>
        )}

        {hasDigital && (
          <div className="mt-6 space-y-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Digital Study Material — Secure Watermarked Download
            </h2>
            {order.items
              .filter((i) => i.productType === 'Digital')
              .map((item) => {
                const remaining = Math.max(0, settings.maxDownloadLimit - item.downloadCount);
                return (
                  <div
                    key={item.productId}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-[#F3F4F6] p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-display text-sm font-bold text-slate-900">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        Downloads Left:{' '}
                        <span className="font-mono-num font-bold text-[#0B2C6F]">
                          {remaining} / {settings.maxDownloadLimit}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={remaining === 0 || downloadingId === item.productId}
                      onClick={() => handleDownload(item.productId)}
                      className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-4 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                    >
                      <Download className="h-4 w-4" />
                      {downloadingId === item.productId ? 'Preparing PDF...' : 'Download Now'}
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        {downloadMsg && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-800">
            {downloadMsg}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-slate-200 pt-6">
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[46px] items-center gap-2 rounded-lg bg-[#0B2C6F] px-5 text-sm font-bold text-white hover:bg-blue-900"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Par Link Bhejein
          </a>
          <button
            type="button"
            onClick={onGoAccount}
            className="inline-flex min-h-[46px] items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
          >
            My Orders Dekhein
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex min-h-[46px] items-center rounded-lg bg-[#FF6B00] px-5 text-sm font-bold text-white hover:bg-orange-600 cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </main>
  );
};

// MY ACCOUNT PAGE (Real Firebase Phone Auth OTP, Orders, Downloads, Profile Edit)
interface MyAccountPageProps {
  currentUser: User | null;
  customerProfile: Customer | null;
  orders: Order[];
  products: Product[];
  settings: SiteSettings;
  onLogout: () => Promise<void>;
  onUpdateProfile: (updates: Partial<Customer>) => Promise<void>;
  onDownloadItem: (order: Order, productId: string) => Promise<void>;
}

export const MyAccountPage: React.FC<MyAccountPageProps> = ({
  currentUser,
  customerProfile,
  orders,
  products,
  settings,
  onLogout,
  onUpdateProfile,
  onDownloadItem,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'downloads' | 'profile'>('orders');
  const [profileSaved, setProfileSaved] = useState(false);
  const [dlMessage, setDlMessage] = useState('');

  const [editName, setEditName] = useState(customerProfile?.name || '');
  const [editClass, setEditClass] = useState<ClassLevel>(customerProfile?.classLevel || 'Class 10');
  const [editEmail, setEditEmail] = useState(customerProfile?.email || '');
  const [editAddress, setEditAddress] = useState(customerProfile?.address || '');

  const handleReDownload = async (order: Order, productId: string) => {
    const item = order.items.find((i) => i.productId === productId);
    if (!item) return;
    if (item.downloadCount >= settings.maxDownloadLimit) {
      setDlMessage(
        `Order #${order.id} par max ${settings.maxDownloadLimit} downloads limit poori ho chuki hai.`
      );
      return;
    }
    const product = products.find((p) => p.id === productId);
    const { blob, filename } = await generateWatermarkedProductFile({
      order,
      product,
      productId,
      watermarkEnabled: settings.watermarkEnabled,
    });
    triggerBlobDownload(blob, filename);
    await onDownloadItem(order, productId);
    setDlMessage(
      `"${item.productName}" download ho raha hai (${order.customerName} · #${order.id} watermark ke saath).`
    );
  };

  if (!currentUser) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <PhoneOtpAuth
          title="Student Login (Firebase Phone OTP)"
          subtitle="Apne Orders aur Watermarked PDF Downloads dekhne ke liye Mobile OTP se login karein"
          onVerified={() => {}}
        />
      </main>
    );
  }

  const displayPhone =
    customerProfile?.mobile ||
    (currentUser.phoneNumber ? currentUser.phoneNumber.replace(/\D/g, '').slice(-10) : '') ||
    currentUser.email ||
    'Student';

  const myDigitalItems = orders.flatMap((o) =>
    o.items
      .filter((i) => i.productType === 'Digital')
      .map((i) => ({ order: o, item: i }))
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <p className="text-xs font-semibold text-slate-500">Logged in via Firebase Auth</p>
          <h1 className="font-display text-xl font-bold text-[#0B2C6F]">
            {customerProfile?.name || 'Student'} ·{' '}
            <span className="font-mono-num">{displayPhone}</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(['orders', 'downloads', 'profile'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`h-10 rounded-lg px-4 text-sm font-bold capitalize cursor-pointer ${
              activeTab === tab
                ? 'bg-[#0B2C6F] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab === 'orders'
              ? `My Orders (${orders.length})`
              : tab === 'downloads'
                ? `My Downloads (${myDigitalItems.length})`
                : 'My Profile'}
          </button>
        ))}
      </div>

      {dlMessage && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-800">
          {dlMessage}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="mt-5 space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              Abhi tak koi order nahi hai.
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono-num font-bold text-[#0B2C6F]">#{o.id}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="text-xs font-bold">
                    <span className="text-slate-700">{o.status}</span>
                    <span className="mx-2 text-slate-300">·</span>
                    <span className="font-mono-num text-slate-900">₹{o.grandTotal}</span>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {o.items.map((it) => (
                    <li key={it.productId} className="flex justify-between">
                      <span>
                        {it.productName} × {it.quantity}
                      </span>
                      <span className="font-mono-num font-semibold">₹{it.price * it.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'downloads' && (
        <div className="mt-5 space-y-3">
          {myDigitalItems.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              Koi digital PDF download available nahi hai.
            </div>
          ) : (
            myDigitalItems.map(({ order, item }) => {
              const left = Math.max(0, settings.maxDownloadLimit - item.downloadCount);
              return (
                <div
                  key={`${order.id}-${item.productId}`}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-xs text-slate-500">
                      Order <span className="font-mono-num font-semibold">#{order.id}</span> ·
                      Remaining:{' '}
                      <span className="font-mono-num font-bold text-[#0B2C6F]">
                        {left}/{settings.maxDownloadLimit}
                      </span>
                    </p>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      {item.productName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    disabled={left === 0}
                    onClick={() => handleReDownload(order, item.productId)}
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-4 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" />
                    Re-Download
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onUpdateProfile({
              name: editName,
              classLevel: editClass,
              email: editEmail,
              address: editAddress,
            });
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 3000);
          }}
          className="mt-5 rounded-xl border border-slate-200 bg-white p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-slate-900">Edit Profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Class</label>
              <select
                value={editClass}
                onChange={(e) => setEditClass(e.target.value as ClassLevel)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {CLASS_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Address</label>
              <input
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>
          {profileSaved && (
            <p className="text-xs font-bold text-[#16A34A]">Profile successfully save ho gaya!</p>
          )}
          <button
            type="submit"
            className="h-11 rounded-lg bg-[#0B2C6F] px-6 text-sm font-bold text-white hover:bg-blue-900 cursor-pointer"
          >
            Save Profile
          </button>
        </form>
      )}
    </main>
  );
};

export const InfoPage: React.FC<{
  mode: 'about' | 'contact' | 'privacy' | 'refund' | 'terms';
  settings: SiteSettings;
  onSendContact: (payload: { name: string; mobile: string; email: string; message: string }) => Promise<void>;
}> = ({ mode, settings, onSendContact }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (mode === 'contact') {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:grid-cols-2">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#0B2C6F]">Contact Us</h1>
            <p className="mt-2 text-sm text-slate-600">
              Kisi bhi PDF, order ya school bulk kit ke liye seedha message karein. Message turant{' '}
              <strong>{settings.adminEmail}</strong> par bheja jata hai.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0B2C6F]" />
                <span>
                  {settings.ownerName} · {settings.owner}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#16A34A]" />
                <span className="font-mono-num">{settings.mobile} (WhatsApp & Call)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#FF6B00]" />
                <span>{settings.adminEmail}</span>
              </p>
              <p className="text-xs text-slate-500">{settings.contactAddress}</p>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await onSendContact({ name, mobile, email, message });
              setSent(true);
              setName('');
              setMobile('');
              setEmail('');
              setMessage('');
            }}
            className="space-y-3"
          >
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aapka Naam *"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Mobile Number *"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (Optional)"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Apna sawal ya message likhein..."
              className="w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
            {sent && (
              <p className="rounded-lg bg-green-50 p-3 text-xs font-bold text-[#16A34A]">
                Aapka message {settings.adminEmail} par bhej diya gaya hai! Jaldi reply milega.
              </p>
            )}
            <button
              type="submit"
              className="min-h-[46px] w-full rounded-lg bg-[#FF6B00] text-sm font-bold text-white hover:bg-orange-600 cursor-pointer"
            >
              Send Message
            </button>
          </form>
        </div>
      </main>
    );
  }

  const titleMap = {
    about: `About ${settings.websiteName}`,
    privacy: 'Privacy Policy',
    refund: 'Refund & Replacement Policy',
    terms: 'Terms & Conditions',
  };

  const bodyMap = {
    about: settings.aboutText,
    privacy: settings.privacyPolicyText,
    refund: settings.refundPolicyText,
    terms: settings.termsText,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="font-display text-2xl font-extrabold text-[#0B2C6F]">{titleMap[mode]}</h1>
        <p className="mt-4 whitespace-pre-line text-sm sm:text-base leading-relaxed text-slate-700">
          {bodyMap[mode]}
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-[#F3F4F6] p-4 text-xs text-slate-600">
          <Lock className="h-4 w-4 text-[#0B2C6F]" />
          <span>
            {settings.owner} · Mobile: {settings.mobile} · Email: {settings.adminEmail}
          </span>
        </div>
      </div>
    </main>
  );
};
