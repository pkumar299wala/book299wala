// Book.299wala.com - Main Application Router & Firebase Store Controller
// Owned by Galaxy Science Academy, Ghazipur (Pappu Nishad)

import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, testConnection } from './firebase';
import {
  DEFAULT_SETTINGS,
  INITIAL_COUPONS,
  INITIAL_OFFERS,
  INITIAL_PRODUCTS,
} from './data/seedData';
import {
  AdminActivityLog,
  CartItem,
  ClassLevel,
  ContactMessage,
  Coupon,
  Customer,
  EmailNotificationLog,
  FestivalOffer,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  SiteSettings,
  UploadedFileRecord,
} from './types';
import {
  ADMIN_EMAIL,
  calculateCartPricing,
  cartSession,
  createContactFirestore,
  createEmailLogFirestore,
  createOrderFirestore,
  deleteCouponFirestore,
  deleteFileRecordFirestore,
  deleteProductFirestore,
  ensureAdminMarkerAndSeed,
  getCustomerFirestore,
  logAdminActivity,
  saveCouponFirestore,
  saveFileRecordFirestore,
  saveOfferFirestore,
  saveProductFirestore,
  saveSettingsFirestore,
  subscribeActivityLogsAdmin,
  subscribeAllOrdersAdmin,
  subscribeContactsAdmin,
  subscribeCoupons,
  subscribeCustomerOrders,
  subscribeCustomersAdmin,
  subscribeEmailLogsAdmin,
  subscribeFilesAdmin,
  subscribeOffers,
  subscribeProducts,
  subscribeSettings,
  toggleCustomerBlockFirestore,
  updateOrderItemsDownloadFirestore,
  updateOrderStatusFirestore,
  upsertCustomerFirestore,
} from './services/firestoreService';
import {
  AppRoute,
  FloatingWhatsAppButton,
  FooterSection,
  HeaderSection,
} from './components/HeaderAndFooter';
import { SamplePreviewModal } from './components/SamplePreviewModal';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage, CheckoutPage } from './pages/CartAndCheckoutPages';
import { InfoPage, MyAccountPage, OrderSuccessPage } from './pages/AccountAndSuccessPages';
import { AdminPanel } from './pages/admin/AdminPanel';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'Application error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] p-4">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <h1 className="font-display text-xl font-bold text-red-700">
              Kuch Technical Error Aa Gaya
            </h1>
            <p className="mt-2 text-xs text-slate-600 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#0B2C6F] px-5 text-sm font-bold text-white cursor-pointer"
            >
              Page Reload Karein
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function omitUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => omitUndefined(item)) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const clean: Record<string, unknown> = {};
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== undefined) {
        clean[k] = omitUndefined(v);
      }
    });
    return clean as T;
  }
  return obj;
}

function routeFromPath(pathname: string): AppRoute {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return { page: 'admin' };
  if (pathname === '/cart') return { page: 'cart' };
  if (pathname === '/checkout') return { page: 'checkout' };
  if (pathname === '/account') return { page: 'account' };
  if (pathname === '/about') return { page: 'about' };
  if (pathname === '/contact') return { page: 'contact' };
  if (pathname === '/policy/privacy') return { page: 'policy', kind: 'privacy' };
  if (pathname === '/policy/refund') return { page: 'policy', kind: 'refund' };
  if (pathname === '/policy/terms') return { page: 'policy', kind: 'terms' };
  if (pathname.startsWith('/product/')) {
    return { page: 'product', productId: decodeURIComponent(pathname.replace('/product/', '')) };
  }
  if (pathname.startsWith('/order-success/')) {
    return {
      page: 'order-success',
      orderId: decodeURIComponent(pathname.replace('/order-success/', '')),
    };
  }
  return { page: 'home' };
}

function pathFromRoute(route: AppRoute): string {
  switch (route.page) {
    case 'home':
      return '/';
    case 'admin':
      return '/admin';
    case 'cart':
      return '/cart';
    case 'checkout':
      return '/checkout';
    case 'account':
      return '/account';
    case 'about':
      return '/about';
    case 'contact':
      return '/contact';
    case 'policy':
      return `/policy/${route.kind}`;
    case 'product':
      return `/product/${encodeURIComponent(route.productId)}`;
    case 'order-success':
      return `/order-success/${encodeURIComponent(route.orderId)}`;
  }
}

async function dispatchEmailToServer(log: EmailNotificationLog): Promise<void> {
  try {
    await fetch('/api/notify/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  } catch {
    // Non-blocking notification endpoint
  }
}

function StoreApp() {
  const [route, setRoute] = useState<AppRoute>(() => routeFromPath(window.location.pathname));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [firestoreCoupons, setFirestoreCoupons] = useState<Coupon[]>([]);
  const [couponsLoaded, setCouponsLoaded] = useState(false);
  const [firestoreOffers, setFirestoreOffers] = useState<FestivalOffer[]>([]);
  const [offersLoaded, setOffersLoaded] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerProfile, setCustomerProfile] = useState<Customer | null>(null);
  const [files, setFiles] = useState<UploadedFileRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [emails, setEmails] = useState<EmailNotificationLog[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => cartSession.get());
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [sampleModalProduct, setSampleModalProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Effective catalog falls back read-only to seed catalog until Admin logs in & seeds Firestore
  const products =
    productsLoaded && firestoreProducts.length > 0 ? firestoreProducts : INITIAL_PRODUCTS;
  const coupons =
    couponsLoaded && firestoreCoupons.length > 0 ? firestoreCoupons : INITIAL_COUPONS;
  const offers =
    offersLoaded && firestoreOffers.length > 0 ? firestoreOffers : INITIAL_OFFERS;

  const isAdminEmail =
    Boolean(currentUser?.email) &&
    currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isVerifiedAdmin = isAdminEmail && Boolean(currentUser?.emailVerified);

  // Browser back/forward routing
  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Ephemeral cart persistence in sessionStorage
  useEffect(() => {
    cartSession.save(cart);
  }, [cart]);

  // Startup Firestore connection check + Firebase Auth listener
  useEffect(() => {
    testConnection();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubAuth();
  }, []);

  // Public Firestore listeners (Products, Settings, Coupons, Offers)
  useEffect(() => {
    const unsubProd = subscribeProducts((items) => {
      setFirestoreProducts(items);
      setProductsLoaded(true);
    });
    const unsubSettings = subscribeSettings((s) => setSettings(s));
    const unsubCoupons = subscribeCoupons((c) => {
      setFirestoreCoupons(c);
      setCouponsLoaded(true);
    });
    const unsubOffers = subscribeOffers((o) => {
      setFirestoreOffers(o);
      setOffersLoaded(true);
    });
    return () => {
      unsubProd();
      unsubSettings();
      unsubCoupons();
      unsubOffers();
    };
  }, []);

  // Admin seeding when verified admin logs in
  useEffect(() => {
    if (authReady && isVerifiedAdmin && productsLoaded) {
      ensureAdminMarkerAndSeed(firestoreProducts.length);
    }
  }, [authReady, isVerifiedAdmin, productsLoaded, firestoreProducts.length]);

  // Role-scoped Firestore listeners (Admin vs Customer)
  useEffect(() => {
    if (!authReady || !currentUser) {
      setOrders([]);
      setCustomers([]);
      setCustomerProfile(null);
      setFiles([]);
      setActivityLogs([]);
      setEmails([]);
      setContacts([]);
      return;
    }

    if (isVerifiedAdmin) {
      const unsubOrders = subscribeAllOrdersAdmin(setOrders);
      const unsubCustomers = subscribeCustomersAdmin(setCustomers);
      const unsubFiles = subscribeFilesAdmin(setFiles);
      const unsubActivity = subscribeActivityLogsAdmin(setActivityLogs);
      const unsubEmails = subscribeEmailLogsAdmin(setEmails);
      const unsubContacts = subscribeContactsAdmin(setContacts);
      return () => {
        unsubOrders();
        unsubCustomers();
        unsubFiles();
        unsubActivity();
        unsubEmails();
        unsubContacts();
      };
    }

    if (isAdminEmail && !currentUser.emailVerified) {
      // Wait for email verification before querying admin-restricted collections
      return;
    }

    // Authenticated Student/Customer: only their own orders and customer profile
    const unsubMyOrders = subscribeCustomerOrders(currentUser.uid, setOrders);
    getCustomerFirestore(currentUser.uid)
      .then((prof) => setCustomerProfile(prof))
      .catch(() => setCustomerProfile(null));

    return () => {
      unsubMyOrders();
    };
  }, [authReady, currentUser, isVerifiedAdmin, isAdminEmail]);

  const navigate = (next: AppRoute) => {
    const nextPath = pathFromRoute(next);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  const logEmail = async (entry: Omit<EmailNotificationLog, 'id' | 'sentAt' | 'status'>) => {
    const newLog: EmailNotificationLog = {
      ...entry,
      id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sentAt: new Date().toISOString(),
      status: 'Sent',
    };
    dispatchEmailToServer(newLog);
    if (currentUser) {
      await createEmailLogFirestore(omitUndefined(newLog));
    }
  };

  // Cart Actions
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
    showToast(`"${product.name.slice(0, 34)}..." Cart me add ho gaya!`);
  };

  const handleBuyNow = (product: Product) => {
    setCart((prev) => {
      const exists = prev.some((c) => c.productId === product.id);
      return exists ? prev : [...prev, { productId: product.id, quantity: 1 }];
    });
    navigate({ page: 'checkout' });
  };

  const handleAddComboPack = (productIds: string[]) => {
    setCart((prev) => {
      const next = [...prev];
      productIds.forEach((pid) => {
        if (!next.some((c) => c.productId === pid)) {
          next.push({ productId: pid, quantity: 1 });
        }
      });
      return next;
    });
    showToast('Buy 3 Get 1 Free Combo Pack Cart me add ho gaya!');
    navigate({ page: 'cart' });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  // Order Placement in Firestore
  const handleConfirmOrder = async (payload: {
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
  }) => {
    if (!currentUser) {
      throw new Error('Kripya pehle apna Mobile OTP verify karein.');
    }
    if (customerProfile?.isBlocked) {
      throw new Error(`Order blocked. Support ${settings.whatsapp} par sampark karein.`);
    }

    const pricing = calculateCartPricing(
      cart,
      products,
      offers,
      coupons,
      appliedCoupon,
      settings
    );
    if (pricing.lineItems.length === 0) return;

    const orderId = `299-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const newOrder: Order = omitUndefined({
      id: orderId,
      userId: currentUser.uid,
      customerName: payload.customerName,
      mobile: payload.mobile,
      whatsapp: payload.whatsapp,
      ...(payload.email ? { email: payload.email } : {}),
      classLevel: payload.classLevel,
      ...(payload.address ? { address: payload.address } : {}),
      ...(payload.city ? { city: payload.city } : {}),
      ...(payload.pincode ? { pincode: payload.pincode } : {}),
      items: pricing.lineItems.map(({ product, quantity, unitPrice }) =>
        omitUndefined({
          productId: product.id,
          productName: product.name,
          productType: product.productType,
          category: product.category,
          price: unitPrice,
          quantity,
          ...(product.mainFileId ? { mainFileId: product.mainFileId } : {}),
          ...(product.mainFileName ? { mainFileName: product.mainFileName } : {}),
          downloadCount: 0,
        })
      ),
      subtotal: pricing.subtotal,
      ...(appliedCoupon ? { couponCode: appliedCoupon } : {}),
      discountAmount: pricing.couponDiscount,
      comboDiscount: pricing.comboDiscount,
      deliveryCharge: pricing.deliveryCharge,
      grandTotal: pricing.grandTotal,
      paymentMethod: payload.paymentMethod,
      ...(payload.paymentScreenshot ? { paymentScreenshot: payload.paymentScreenshot } : {}),
     paymentStatus:
  payload.paymentMethod === 'Cash On Delivery'
    ? 'COD - Pending'
    : 'Pending Verification',
status: 'Pending', // Jab tak Admin Confirm na kare, Pending hi rahega
      createdAt: nowIso,
    });

    await createOrderFirestore(newOrder);

    // Upsert Customer Profile in Firestore (strictly owned by currentUser.uid)
    const updatedCustomer: Customer = omitUndefined({
      id: currentUser.uid,
      name: payload.customerName,
      mobile: payload.mobile,
      whatsapp: payload.whatsapp,
      ...(payload.email
        ? { email: payload.email }
        : customerProfile?.email
          ? { email: customerProfile.email }
          : {}),
      classLevel: payload.classLevel,
      ...(payload.address
        ? { address: payload.address }
        : customerProfile?.address
          ? { address: customerProfile.address }
          : {}),
      totalOrders: (customerProfile?.totalOrders || 0) + 1,
      totalSpent: (customerProfile?.totalSpent || 0) + pricing.grandTotal,
      lastOrderDate: nowIso,
      isBlocked: false,
    });
    await upsertCustomerFirestore(updatedCustomer);
    setCustomerProfile(updatedCustomer);

    // Check low stock alerts on Physical items (read-only check; Admin updates inventory)
    for (const li of pricing.lineItems) {
      if (li.product.productType === 'Physical' && li.product.stock - li.quantity <= 0) {
        await logEmail({
          to: settings.adminEmail,
          subject: `Stock Low - ${li.product.name} - Turant Stock Bharo`,
          body: `Alert: Physical product "${li.product.name}" ka stock kam/0 ho gaya hai (${li.quantity} ordered in #${orderId}). Kripya Admin Panel se stock update karein.`,
          type: 'stock_low',
        });
      }
    }

    // Email Notification 1: To Admin
    const firstProdName = pricing.lineItems[0]?.product.name || 'Study Material';
    await logEmail({
      to: settings.adminEmail,
      subject: `New Order #${orderId} - ${firstProdName} - ₹${pricing.grandTotal} - ${settings.websiteName}`,
      body: `Customer Name: ${payload.customerName}\nMobile: ${payload.mobile}\nWhatsApp: ${payload.whatsapp}\nClass: ${payload.classLevel}\nProducts: ${pricing.lineItems.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}\nTotal Price: ₹${pricing.grandTotal}\nPayment Mode: ${payload.paymentMethod} (${settings.upiId})\nDate: ${new Date(nowIso).toLocaleString('en-IN')}\nDownload Portal: ${window.location.origin}/order-success/${encodeURIComponent(orderId)}\nScreenshot Attached: ${payload.paymentScreenshot ? 'Yes (View in Admin Order Detail)' : 'No'}`,
      type: 'new_order',
    });

    // Email Notification 2: To Customer (if email provided)
    if (payload.email) {
      await logEmail({
        to: payload.email,
        subject: `Order Confirmed #${orderId} - Download Link - ${settings.websiteName}`,
        body: `Namaste ${payload.customerName},\nAapka order #${orderId} (₹${pricing.grandTotal}) confirm ho gaya hai.\nMy Account me apne verified mobile number ${payload.mobile} se login karke PDF download karein.\nSupport WhatsApp: ${settings.whatsapp}`,
        type: 'customer_confirm',
      });
    }

    setCart([]);
    setAppliedCoupon('');
    navigate({ page: 'order-success', orderId });
  };

  // Track Download Count in Firestore (Max 3 per order)
  const handleRecordDownload = async (order: Order, productId: string) => {
    await updateOrderItemsDownloadFirestore(order, productId);
  };

  // Contact Form Handler
  const handleSendContact = async (payload: {
    name: string;
    mobile: string;
    email: string;
    message: string;
  }) => {
    const newMsg: ContactMessage = omitUndefined({
      id: `msg-${Date.now()}`,
      name: payload.name,
      mobile: payload.mobile,
      email: payload.email || '',
      message: payload.message,
      createdAt: new Date().toISOString(),
    });
    await createContactFirestore(newMsg);
    await logEmail({
      to: settings.adminEmail,
      subject: `Contact Form Message from ${payload.name} (${payload.mobile}) - ${settings.websiteName}`,
      body: `Name: ${payload.name}\nMobile: ${payload.mobile}\nEmail: ${payload.email || 'Not Provided'}\nMessage:\n${payload.message}`,
      type: 'contact_form',
    });
  };

  // Daily 9 PM Report Generator
  const handleSendDailyReportNow = async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaysOrders = orders.filter(
      (o) => o.createdAt.slice(0, 10) === todayStr && o.status !== 'Cancelled'
    );
    const totalRev = todaysOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const counts: Record<string, number> = {};
    todaysOrders.forEach((o) =>
      o.items.forEach((it) => {
        counts[it.productName] = (counts[it.productName] || 0) + it.quantity;
      })
    );
    const topProd = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    await logEmail({
      to: settings.adminEmail,
      subject: `Daily 9 PM Sales Report (${todayStr}) - ₹${totalRev} - ${settings.websiteName}`,
      body: `Aaj Ke Total Orders: ${todaysOrders.length}\nAaj Ki Total Sale: ₹${totalRev}\nSabse Zyada Bika Product: ${topProd}`,
      type: 'daily_report',
    });
    await logAdminActivity(
      'Daily Report Sent',
      settings.adminEmail,
      `Orders: ${todaysOrders.length} | Revenue: ₹${totalRev}`
    );
    showToast(`Daily Sales Report ${settings.adminEmail} par bhej diya gaya!`);
  };

  // Render Admin Panel at /admin
  if (route.page === 'admin') {
    return (
      <>
        <AdminPanel
          currentUser={currentUser}
          onBackToStore={() => navigate({ page: 'home' })}
          products={products}
          orders={orders}
          customers={customers}
          coupons={coupons}
          offers={offers}
          files={files}
          activityLogs={activityLogs}
          emails={emails}
          contacts={contacts}
          settings={settings}
          onSaveProduct={async (prod, newFiles) => {
            await saveProductFirestore(
              omitUndefined(prod),
              firestoreProducts.some((p) => p.id === prod.id) ? 'Product Updated' : 'Product Added'
            );
            for (const f of newFiles) {
              await saveFileRecordFirestore(omitUndefined(f));
            }
            showToast(`"${prod.name}" Firestore me save ho gaya aur website par live hai!`);
          }}
          onDeleteProduct={async (p) => {
            await deleteProductFirestore(p);
            showToast('Product delete ho gaya.');
          }}
          onDuplicateProduct={async (p) => {
            const copy: Product = omitUndefined({
              ...p,
              id: `prod-${Date.now()}`,
              name: `${p.name} (Copy)`,
              createdAt: new Date().toISOString(),
              salesCount: 0,
            });
            await saveProductFirestore(copy, 'Product Duplicated');
            showToast('Product duplicate ban gaya!');
          }}
          onToggleProductStatus={async (p) => {
            const nextStatus = p.status === 'Published' ? 'Hidden' : 'Published';
            await saveProductFirestore(
              omitUndefined({ ...p, status: nextStatus }),
              'Product Visibility Changed'
            );
            showToast(`Product ab ${nextStatus} hai.`);
          }}
          onQuickPriceSave={async (p, mrp, sellingPrice) => {
            await saveProductFirestore(
              omitUndefined({ ...p, mrp, sellingPrice }),
              'Price Changed'
            );
            showToast('Price Firestore par update ho gaya!');
          }}
          onBulkClassDiscount={async (cls, pct) => {
            const targets = products.filter((p) => p.classLevel === cls);
            for (const p of targets) {
              const nextSelling = Math.max(1, Math.round(p.mrp * (1 - pct / 100)));
              await saveProductFirestore(
                omitUndefined({ ...p, sellingPrice: nextSelling }),
                `Bulk Discount (${cls} - ${pct}%)`
              );
            }
            showToast(`${cls} par ${pct}% bulk discount apply ho gaya!`);
          }}
          onSaveCoupon={async (c) => {
            await saveCouponFirestore(omitUndefined(c));
            showToast(`Coupon ${c.code} save ho gaya!`);
          }}
          onDeleteCoupon={async (c) => {
            await deleteCouponFirestore(c);
            showToast(`Coupon ${c.code} delete ho gaya.`);
          }}
          onSaveOffer={async (o) => {
            await saveOfferFirestore(omitUndefined(o));
            showToast(`Offer "${o.title}" update ho gaya!`);
          }}
          onToggleWatermark={async () => {
            const next = omitUndefined({
              ...settings,
              watermarkEnabled: !settings.watermarkEnabled,
            });
            await saveSettingsFirestore(next);
            showToast(`PDF Watermark ${next.watermarkEnabled ? 'ON' : 'OFF'} ho gaya.`);
          }}
          onDeleteFile={async (file) => {
            await deleteFileRecordFirestore(file);
            showToast('File Firebase Storage se delete ho gayi.');
          }}
          onReplaceProductFile={async (productId, newFile) => {
            await saveFileRecordFirestore(omitUndefined(newFile));
            const target = products.find((p) => p.id === productId);
            if (target) {
              await saveProductFirestore(
                omitUndefined({
                  ...target,
                  mainFileId: newFile.id,
                  mainFileName: newFile.name,
                  mainFileType: newFile.mimeType,
                }),
                'Product PDF Replaced'
              );
            }
            showToast('Nayi file replace ho gayi aur Storage me save ho gayi!');
          }}
          onUpdateOrderStatus={async (orderId, status: OrderStatus) => {
            await updateOrderStatusFirestore(orderId, status);
            showToast(`Order #${orderId} status updated to ${status}`);
          }}
          onSendDailyReportNow={handleSendDailyReportNow}
          onToggleBlockCustomer={async (c) => {
            await toggleCustomerBlockFirestore(c);
            showToast(`Customer ${c.isBlocked ? 'Unblocked' : 'Blocked'}.`);
          }}
          onSaveSettings={async (next) => {
            await saveSettingsFirestore(omitUndefined(next));
            showToast('Settings Firestore me save ho gayi!');
          }}
        />
        {toastMessage && (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg">
            {toastMessage}
          </div>
        )}
      </>
    );
  }

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currentProduct =
    route.page === 'product' ? products.find((p) => p.id === route.productId) : undefined;
  const currentOrder =
    route.page === 'order-success'
      ? orders.find((o) => o.id === route.orderId) || orders[0]
      : undefined;

  const accountBadge = currentUser
    ? currentUser.phoneNumber || currentUser.email || 'Account'
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F4F6]">
      <HeaderSection
        settings={settings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={totalCartCount}
        loggedInMobile={accountBadge}
        onNavigate={navigate}
      />

      <div className="flex-1">
        {route.page === 'home' && (
          <HomePage
            products={products}
            offers={offers}
            settings={settings}
            searchQuery={searchQuery}
            onOpenDetail={(p) => navigate({ page: 'product', productId: p.id })}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onOpenSample={(p) => setSampleModalProduct(p)}
            onAddComboPack={handleAddComboPack}
          />
        )}

        {route.page === 'product' && currentProduct && (
          <ProductDetailPage
            product={currentProduct}
            allProducts={products}
            offers={offers}
            onBack={() => navigate({ page: 'home' })}
            onOpenDetail={(p) => navigate({ page: 'product', productId: p.id })}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onOpenSample={(p) => setSampleModalProduct(p)}
          />
        )}

        {route.page === 'cart' && (
          <CartPage
            cart={cart}
            products={products}
            offers={offers}
            coupons={coupons}
            settings={settings}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={setAppliedCoupon}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveCartItem}
            onContinueShopping={() => navigate({ page: 'home' })}
            onProceedCheckout={() => navigate({ page: 'checkout' })}
          />
        )}

        {route.page === 'checkout' && (
          <CheckoutPage
            currentUser={currentUser}
            cart={cart}
            products={products}
            offers={offers}
            coupons={coupons}
            settings={settings}
            appliedCoupon={appliedCoupon}
            onBackToCart={() => navigate({ page: 'cart' })}
            onConfirmOrder={handleConfirmOrder}
          />
        )}

        {route.page === 'order-success' && currentOrder && (
          <OrderSuccessPage
            order={currentOrder}
            products={products}
            settings={settings}
            onDownloadItem={handleRecordDownload}
            onGoHome={() => navigate({ page: 'home' })}
            onGoAccount={() => navigate({ page: 'account' })}
          />
        )}

        {route.page === 'account' && (
          <MyAccountPage
            currentUser={currentUser}
            customerProfile={customerProfile}
            orders={orders}
            products={products}
            settings={settings}
            onLogout={async () => {
              await signOut(auth);
            }}
            onUpdateProfile={async (updates) => {
              if (!currentUser) return;
              const phoneDigits =
                customerProfile?.mobile ||
                (currentUser.phoneNumber
                  ? currentUser.phoneNumber.replace(/\D/g, '').slice(-10)
                  : '');
              const merged: Customer = omitUndefined({
                id: currentUser.uid,
                name: updates.name || customerProfile?.name || 'Student',
                mobile: phoneDigits,
                whatsapp: customerProfile?.whatsapp || phoneDigits,
                ...(updates.email || customerProfile?.email
                  ? { email: updates.email || customerProfile?.email }
                  : {}),
                classLevel: updates.classLevel || customerProfile?.classLevel || 'Class 10',
                ...(updates.address || customerProfile?.address
                  ? { address: updates.address || customerProfile?.address }
                  : {}),
                totalOrders: customerProfile?.totalOrders || 0,
                totalSpent: customerProfile?.totalSpent || 0,
                lastOrderDate: customerProfile?.lastOrderDate || new Date().toISOString(),
                isBlocked: customerProfile?.isBlocked || false,
              });
              await upsertCustomerFirestore(merged);
              setCustomerProfile(merged);
            }}
            onDownloadItem={handleRecordDownload}
          />
        )}

        {route.page === 'about' && (
          <InfoPage mode="about" settings={settings} onSendContact={handleSendContact} />
        )}
        {route.page === 'contact' && (
          <InfoPage mode="contact" settings={settings} onSendContact={handleSendContact} />
        )}
        {route.page === 'policy' && (
          <InfoPage mode={route.kind} settings={settings} onSendContact={handleSendContact} />
        )}
      </div>

      <FooterSection settings={settings} onNavigate={navigate} />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />

      <SamplePreviewModal
        product={sampleModalProduct}
        onClose={() => setSampleModalProduct(null)}
        onBuyNow={handleBuyNow}
      />

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <StoreApp />
    </AppErrorBoundary>
  );
}
