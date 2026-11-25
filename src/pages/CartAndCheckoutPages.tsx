// Book.299wala.com - Cart Page & Checkout Page (Firestore + Firebase Storage Screenshot + Phone Auth Verified)
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CLASS_LEVELS } from '../data/seedData';
import {
  CartItem,
  ClassLevel,
  Coupon,
  FestivalOffer,
  PaymentMethod,
  Product,
  SiteSettings,
} from '../types';
import { calculateCartPricing, uploadFileToStorage } from '../services/firestoreService';
import { CoverArtwork } from '../components/CoverArtwork';
import { PhoneOtpAuth } from '../components/PhoneOtpAuth';

interface CartPageProps {
  cart: CartItem[];
  products: Product[];
  offers: FestivalOffer[];
  coupons: Coupon[];
  settings: SiteSettings;
  appliedCoupon: string;
  onApplyCoupon: (code: string) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onContinueShopping: () => void;
  onProceedCheckout: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  products,
  offers,
  coupons,
  settings,
  appliedCoupon,
  onApplyCoupon,
  onUpdateQty,
  onRemoveItem,
  onContinueShopping,
  onProceedCheckout,
}) => {
  const [couponInput, setCouponInput] = useState(appliedCoupon);
  const [couponMsg, setCouponMsg] = useState('');

  const pricing = calculateCartPricing(
    cart,
    products,
    offers,
    coupons,
    appliedCoupon,
    settings
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) {
      onApplyCoupon('');
      setCouponMsg('');
      return;
    }
    const found = coupons.find((c) => c.code.toUpperCase() === clean && c.active);
    if (!found) {
      setCouponMsg('Invalid ya expired coupon code.');
      return;
    }
    onApplyCoupon(clean);
    setCouponMsg(`Coupon ${clean} lag gaya!`);
  };

  if (pricing.lineItems.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12">
          <ShoppingBag className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">
            Aapka Cart Khali Hai
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Class 6 to 12 Notes, Formula Sheet ya Test Series add karke padhai shuru karein.
          </p>
          <button
            type="button"
            onClick={onContinueShopping}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#FF6B00] px-6 text-sm font-bold text-white hover:bg-orange-600 cursor-pointer"
          >
            Store Dekhein
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <button
        type="button"
        onClick={onContinueShopping}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B2C6F] hover:underline cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Aur Products Dekhein
      </button>

      <h1 className="font-display text-2xl font-extrabold text-slate-900">
        Aapka Shopping Cart ({pricing.totalUnits} Items)
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {pricing.lineItems.map(({ product, quantity, unitPrice, lineTotal }) => (
            <div
              key={product.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <CoverArtwork product={product} className="h-full w-full" size="sm" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">
                  {product.classLevel} · {product.productType} (
                  {product.productType === 'Digital' ? 'Instant Download' : 'Courier'})
                </p>
                <h3 className="mt-0.5 font-display text-base font-bold text-slate-900">
                  {product.name}
                </h3>
                <p className="mt-1 font-mono-num text-sm font-bold text-[#0B2C6F]">
                  ₹{unitPrice} each
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="flex items-center rounded-lg border border-slate-300 bg-[#F3F4F6]">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => onUpdateQty(product.id, -1)}
                    className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-mono-num w-8 text-center text-sm font-bold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => onUpdateQty(product.id, 1)}
                    className="flex h-10 w-10 items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-mono-num text-base font-bold text-slate-900">₹{lineTotal}</p>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(product.id)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-display text-lg font-bold text-slate-900">Order Summary</h2>

            <form onSubmit={handleApplyCoupon} className="mt-4">
              <label className="text-xs font-bold text-slate-600">
                Coupon Code Lagayein (GALAXY50 / FIRST100)
              </label>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="GALAXY50"
                    className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm font-semibold uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-[#0B2C6F] px-4 text-xs font-bold text-white hover:bg-blue-900 cursor-pointer whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
              {couponMsg && (
                <p className="mt-1.5 text-xs font-semibold text-[#16A34A]">{couponMsg}</p>
              )}
            </form>

            <dl className="mt-5 space-y-2.5 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Items Subtotal</dt>
                <dd className="font-mono-num font-semibold text-slate-900">₹{pricing.subtotal}</dd>
              </div>

              {pricing.comboDiscount > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <dt className="font-semibold">Buy 3 Get 1 Free Offer</dt>
                  <dd className="font-mono-num font-bold">-₹{pricing.comboDiscount}</dd>
                </div>
              )}

              {pricing.couponDiscount > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <dt className="font-semibold">Coupon ({appliedCoupon})</dt>
                  <dd className="font-mono-num font-bold">-₹{pricing.couponDiscount}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-slate-600">
                  Delivery Charge ({pricing.hasPhysical ? 'Physical' : 'Digital'})
                </dt>
                <dd className="font-mono-num font-semibold text-slate-900">
                  {pricing.deliveryCharge === 0 ? (
                    <span className="text-[#16A34A]">FREE (₹0)</span>
                  ) : (
                    `₹${pricing.deliveryCharge}`
                  )}
                </dd>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">
                <dt>Grand Total</dt>
                <dd className="font-mono-num text-xl text-[#0B2C6F]">₹{pricing.grandTotal}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={onProceedCheckout}
              className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#FF6B00] px-5 text-base font-bold text-white hover:bg-orange-600 transition-colors cursor-pointer"
            >
              Checkout Karein · ₹{pricing.grandTotal}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

interface CheckoutPageProps {
  currentUser: User | null;
  cart: CartItem[];
  products: Product[];
  offers: FestivalOffer[];
  coupons: Coupon[];
  settings: SiteSettings;
  appliedCoupon: string;
  onBackToCart: () => void;
  onConfirmOrder: (payload: {
    customerName: string;
    mobile: string;
    whatsapp: string;
    email: string;
    classLevel: ClassLevel;
    address?: string;
    city?: string;
    pincode?: string;
    paymentMethod: PaymentMethod;
    paymentScreenshot?: string;
  }) => Promise<void>;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  currentUser,
  cart,
  products,
  offers,
  coupons,
  settings,
  appliedCoupon,
  onBackToCart,
  onConfirmOrder,
}) => {
  const pricing = calculateCartPricing(
    cart,
    products,
    offers,
    coupons,
    appliedCoupon,
    settings
  );

  const authPhone10 = currentUser?.phoneNumber
    ? currentUser.phoneNumber.replace(/\D/g, '').slice(-10)
    : '';

  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState(authPhone10);
  const [whatsapp, setWhatsapp] = useState(authPhone10);
  const [email, setEmail] = useState(currentUser?.email || '');
  const [classLevel, setClassLevel] = useState<ClassLevel>('Class 10');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Ghazipur');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [uploadingShot, setUploadingShot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (authPhone10 && !mobile) {
      setMobile(authPhone10);
      setWhatsapp(authPhone10);
    }
  }, [authPhone10, mobile]);

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(
    settings.owner
  )}&am=${pricing.grandTotal}&cu=INR&tn=${encodeURIComponent('Book299wala Order')}`;

  useEffect(() => {
    QRCode.toDataURL(upiDeepLink, { width: 220, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [upiDeepLink]);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploadingShot(true);
    setFormError('');
    try {
      const { publicUrl } = await uploadFileToStorage({
        file,
        folder: 'screenshots',
        userId: currentUser.uid,
      });
      if (publicUrl) setScreenshotUrl(publicUrl);
    } catch (err) {
      setFormError(
        `Screenshot upload failed: ${err instanceof Error ? err.message : 'Try again'}`
      );
    } finally {
      setUploadingShot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!currentUser) {
      setFormError('Kripya pehle apna Mobile Number OTP se verify karein.');
      return;
    }
    if (!customerName.trim() || mobile.replace(/\D/g, '').length < 10) {
      setFormError('Kripya apna sahi Naam aur 10-digit Mobile Number bharein.');
      return;
    }
    if (pricing.hasPhysical && !address.trim()) {
      setFormError('Physical book delivery ke liye poora Address (Gaon/Post/District) bharein.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirmOrder({
        customerName: customerName.trim(),
        mobile: mobile.replace(/\D/g, '').slice(-10),
        whatsapp: (whatsapp || mobile).replace(/\D/g, '').slice(-10),
        email: email.trim(),
        classLevel,
        address: pricing.hasPhysical ? address.trim() : undefined,
        city: pricing.hasPhysical ? city.trim() : undefined,
        pincode: pricing.hasPhysical ? pincode.trim() : undefined,
        paymentMethod,
        paymentScreenshot: screenshotUrl || undefined,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Order could not be placed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <button
        type="button"
        onClick={onBackToCart}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B2C6F] hover:underline cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Wapas Cart Par Jayein
      </button>

      <h1 className="font-display text-2xl font-extrabold text-slate-900">
        Secure Checkout & Payment ({settings.upiId})
      </h1>

      {/* Step 1: Firebase Phone Auth Verification Gate */}
      {!currentUser ? (
        <div className="mt-6 max-w-lg">
          <PhoneOtpAuth
            title="Step 1: Mobile OTP Verification (Firebase Security)"
            subtitle="Order place karne aur watermarked PDF download access ke liye apna mobile number OTP se verify karein."
            onVerified={(digits) => {
              setMobile(digits);
              setWhatsapp(digits);
            }}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-[#0B2C6F]">
                  1. Student Details Bharein
                </h2>
                <span className="text-xs font-bold text-[#16A34A]">
                  Verified: {authPhone10 || currentUser.email}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Full Name (Poora Naam) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Poora naam likhein"
                    className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Class / Exam *</label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                    className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  >
                    {CLASS_LEVELS.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Same as mobile"
                    className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Email ID (Order Confirmation & Download Link Ke Liye)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com (Optional)"
                    className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </div>

                {pricing.hasPhysical && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Delivery Address (Physical Book/Kit Courier Ke Liye) *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Gaon / Mohalla, Post, Tehsil, District..."
                        className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700">
                        City / District
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Pin Code</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="233001"
                        className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment Options */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-display text-lg font-bold text-[#0B2C6F]">
                2. Payment Option Chunein
              </h2>

              <div className="mt-4 space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="mt-1 h-4 w-4 accent-[#0B2C6F]"
                  />
                  <div className="flex-1">
                    <p className="font-display text-sm font-bold text-slate-900">
                      UPI Payment ({settings.upiId})
                    </p>
                    <p className="text-xs text-slate-600">
                      Is UPI Par Pay Karein: <strong className="text-[#0B2C6F]">{settings.upiId}</strong>
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'PhonePe / GPay / Paytm'}
                    onChange={() => setPaymentMethod('PhonePe / GPay / Paytm')}
                    className="mt-1 h-4 w-4 accent-[#0B2C6F]"
                  />
                  <div className="flex-1">
                    <p className="font-display text-sm font-bold text-slate-900">
                      PhonePe / Google Pay / Paytm
                    </p>
                    <p className="text-xs text-slate-600">
                      Same UPI ID <strong className="text-[#0B2C6F]">{settings.upiId}</strong> par ₹
                      {pricing.grandTotal} pay karein
                    </p>
                  </div>
                </label>

                {pricing.hasPhysical && settings.codEnabled && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'Cash On Delivery'}
                      onChange={() => setPaymentMethod('Cash On Delivery')}
                      className="mt-1 h-4 w-4 accent-[#0B2C6F]"
                    />
                    <div className="flex-1">
                      <p className="font-display text-sm font-bold text-slate-900">
                        Cash On Delivery (Physical Products Only)
                      </p>
                      <p className="text-xs text-slate-600">
                        Courier ghar aane par cash payment karein.
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {paymentMethod !== 'Cash On Delivery' && (
                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    {qrDataUrl && (
                      <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-2">
                        <img src={qrDataUrl} alt="UPI Payment QR Code" className="h-36 w-36" />
                      </div>
                    )}
                    <div className="space-y-2 text-sm text-slate-800">
                      <p className="font-display font-bold text-[#0B2C6F]">
                        {settings.upiId} Par Payment Karein · ₹{pricing.grandTotal}
                      </p>
                      <p className="text-xs text-slate-700">
                        QR Scan karein ya UPI App se pay karein. Payment Ke Baad Screenshot WhatsApp Par Bhejein:{' '}
                        <strong className="font-mono-num">{settings.whatsapp}</strong> Ya Email Karein:{' '}
                        <strong>{settings.adminEmail}</strong>
                      </p>
                      <a
                        href={upiDeepLink}
                        className="inline-flex h-9 items-center rounded-lg bg-[#0B2C6F] px-3 text-xs font-bold text-white hover:bg-blue-900"
                      >
                        Open UPI App (PhonePe / GPay)
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-blue-200 pt-4">
                    <label className="block text-xs font-bold text-slate-800">
                      Payment Screenshot Upload Karein (Securely Stored in Firebase Storage)
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 hover:bg-slate-50">
                        <Upload className="h-4 w-4 text-[#0B2C6F]" />
                        <span>{uploadingShot ? 'Uploading...' : 'Screenshot Chunein'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingShot}
                          onChange={handleScreenshotUpload}
                          className="hidden"
                        />
                      </label>
                      {screenshotUrl && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#16A34A]">
                          <CheckCircle2 className="h-4 w-4" />
                          Screenshot Uploaded!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-display text-lg font-bold text-slate-900">Your Items</h2>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {pricing.lineItems.map(({ product, quantity, lineTotal }) => (
                  <li key={product.id} className="flex justify-between gap-3 py-2.5">
                    <span className="text-slate-700">
                      {product.name} <strong className="text-slate-900">× {quantity}</strong>
                    </span>
                    <span className="font-mono-num shrink-0 font-bold text-slate-900">
                      ₹{lineTotal}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Subtotal</dt>
                  <dd className="font-mono-num font-semibold">₹{pricing.subtotal}</dd>
                </div>
                {pricing.comboDiscount > 0 && (
                  <div className="flex justify-between text-[#16A34A]">
                    <dt>Buy 3 Get 1 Free</dt>
                    <dd className="font-mono-num font-bold">-₹{pricing.comboDiscount}</dd>
                  </div>
                )}
                {pricing.couponDiscount > 0 && (
                  <div className="flex justify-between text-[#16A34A]">
                    <dt>Coupon Discount</dt>
                    <dd className="font-mono-num font-bold">-₹{pricing.couponDiscount}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-600">Delivery</dt>
                  <dd className="font-mono-num font-semibold">
                    {pricing.deliveryCharge === 0 ? 'FREE' : `₹${pricing.deliveryCharge}`}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold">
                  <dt>Total Payable</dt>
                  <dd className="font-mono-num text-xl text-[#0B2C6F]">₹{pricing.grandTotal}</dd>
                </div>
              </dl>

              {formError && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || uploadingShot}
                className="mt-5 inline-flex min-h-[50px] w-full items-center justify-center rounded-lg bg-[#16A34A] px-5 text-base font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? 'Confirming Order...' : `Order Confirm Karein · ₹${pricing.grandTotal}`}
              </button>
            </div>
          </div>
        </form>
      )}
    </main>
  );
};
