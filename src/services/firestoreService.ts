// Book.299wala.com - Firebase Firestore & Storage Repository
// Products, Orders, Customers, Settings, Coupons, Offers, Files & Activity Logs live in Firestore.
// Ephemeral shopping cart stays in sessionStorage only.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, handleFirestoreError, OperationType, storage } from '../firebase';
import {
  DEFAULT_SETTINGS,
  INITIAL_COUPONS,
  INITIAL_OFFERS,
  INITIAL_PRODUCTS,
} from '../data/seedData';
import {
  AdminActivityLog,
  CartItem,
  ContactMessage,
  Coupon,
  Customer,
  EmailNotificationLog,
  FestivalOffer,
  Order,
  Product,
  SiteSettings,
  UploadedFileRecord,
} from '../types';

export const ADMIN_EMAIL = 'Galaxyscienceacademy@gmail.com';
const CART_KEY = 'b299_ephemeral_cart_v2';

// Random non-guessable filename generator (e.g., notes_17320123_9f3k8a2x.pdf)
export function generateRandomFileName(originalName: string, prefix = 'file'): string {
  const parts = originalName.split('.');
  const ext = parts.length > 1 ? parts.pop()!.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : 'bin';
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  const randHex = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${Date.now()}_${randHex}.${ext}`;
}

export async function uploadFileToStorage(params: {
  file: File;
  folder: 'protected_files' | 'covers' | 'samples' | 'branding' | 'screenshots';
  userId?: string;
}): Promise<{ storagePath: string; publicUrl?: string }> {
  const { file, folder, userId } = params;
  const prefix =
    folder === 'protected_files'
      ? 'notes'
      : folder === 'covers'
        ? 'cover'
        : folder === 'samples'
          ? 'sample'
          : folder === 'branding'
            ? 'logo'
            : 'proof';
  const randomName = generateRandomFileName(file.name, prefix);
  const storagePath =
    folder === 'screenshots' && userId
      ? `screenshots/${userId}/${randomName}`
      : `${folder}/${randomName}`;

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type || 'application/octet-stream' });

  // Protected study files do NOT return a public download URL; buyers download via verified order check
  if (folder === 'protected_files') {
    return { storagePath };
  }
  const publicUrl = await getDownloadURL(storageRef);
  return { storagePath, publicUrl };
}

export async function deleteFileFromStorage(storagePath?: string): Promise<void> {
  if (!storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (err) {
    console.warn('Storage delete warning:', err);
  }
}

// Ephemeral Cart (Session only)
export const cartSession = {
  get: (): CartItem[] => {
    try {
      const raw = sessionStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  },
  save: (items: CartItem[]): void => {
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  },
};

// Real-time Firestore Listeners
export function subscribeProducts(onData: (items: Product[]) => void): () => void {
  const path = 'products';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Product);
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeSettings(onData: (settings: SiteSettings) => void): () => void {
  const path = 'settings/public';
  return onSnapshot(
    doc(db, 'settings', 'public'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as SiteSettings);
      } else {
        onData(DEFAULT_SETTINGS);
      }
    },
    (err) => handleFirestoreError(err, OperationType.GET, path)
  );
}

export function subscribeCoupons(onData: (items: Coupon[]) => void): () => void {
  const path = 'coupons';
  return onSnapshot(
    collection(db, path),
    (snap) => onData(snap.docs.map((d) => d.data() as Coupon)),
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeOffers(onData: (items: FestivalOffer[]) => void): () => void {
  const path = 'offers';
  return onSnapshot(
    collection(db, path),
    (snap) => onData(snap.docs.map((d) => d.data() as FestivalOffer)),
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeCustomerOrders(
  userId: string,
  onData: (items: Order[]) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as Order)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeAllOrdersAdmin(onData: (items: Order[]) => void): () => void {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data() as Order)),
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeCustomersAdmin(onData: (items: Customer[]) => void): () => void {
  const path = 'customers';
  return onSnapshot(
    collection(db, path),
    (snap) => onData(snap.docs.map((d) => d.data() as Customer)),
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeFilesAdmin(onData: (items: UploadedFileRecord[]) => void): () => void {
  const path = 'files';
  return onSnapshot(
    collection(db, path),
    (snap) => onData(snap.docs.map((d) => d.data() as UploadedFileRecord)),
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeActivityLogsAdmin(onData: (items: AdminActivityLog[]) => void): () => void {
  const path = 'activityLogs';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data() as AdminActivityLog)),
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeEmailLogsAdmin(onData: (items: EmailNotificationLog[]) => void): () => void {
  const path = 'emailLogs';
  const q = query(collection(db, path), orderBy('sentAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data() as EmailNotificationLog)),
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

export function subscribeContactsAdmin(onData: (items: ContactMessage[]) => void): () => void {
  const path = 'contacts';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => d.data() as ContactMessage)),
    (err) => handleFirestoreError(err, OperationType.LIST, path)
  );
}

// Firestore Mutations with Error Wrapper & Admin Activity Audit Logging
export async function logAdminActivity(
  action: string,
  target: string,
  details: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const entry: AdminActivityLog = {
    id,
    adminUid: user.uid,
    adminEmail: user.email || ADMIN_EMAIL,
    action,
    target,
    details,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'activityLogs', id), entry);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `activityLogs/${id}`);
  }
}

export async function ensureAdminMarkerAndSeed(
  existingProductsCount: number
): Promise<void> {
  const user = auth.currentUser;
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return;

  // Write admins/{uid} if verified
  if (user.emailVerified) {
    try {
      await setDoc(
        doc(db, 'admins', user.uid),
        { uid: user.uid, email: user.email || ADMIN_EMAIL },
        { merge: true }
      );
    } catch {
      // ignore if rules block unverified
    }
  }

  // Bootstrap Firestore Settings if missing
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'public'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'public'), DEFAULT_SETTINGS);
    }
  } catch {
    // ignore until verified
  }

  // Bootstrap Initial Catalog if Firestore products collection is empty
  if (existingProductsCount === 0) {
    try {
      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach((p) => {
        batch.set(doc(db, 'products', p.id), p);
      });
      INITIAL_COUPONS.forEach((c) => {
        batch.set(doc(db, 'coupons', c.id), c);
      });
      INITIAL_OFFERS.forEach((o) => {
        batch.set(doc(db, 'offers', o.id), o);
      });
      await batch.commit();
      await logAdminActivity(
        'Catalog Seeded',
        '18 Products + Coupons',
        'Initialized default store catalog in Firestore'
      );
    } catch (err) {
      console.warn('Seed skipped or requires verified admin:', err);
    }
  }
}

export async function saveProductFirestore(
  product: Product,
  actionLabel = 'Product Saved'
): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await setDoc(doc(db, 'products', product.id), product);
    await logAdminActivity(
      actionLabel,
      product.name,
      `Price: ₹${product.sellingPrice} (MRP ₹${product.mrp}) | Status: ${product.status}`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteProductFirestore(product: Product): Promise<void> {
  const path = `products/${product.id}`;
  try {
    await deleteDoc(doc(db, 'products', product.id));
    await logAdminActivity('Product Deleted', product.name, `ID: ${product.id}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveFileRecordFirestore(record: UploadedFileRecord): Promise<void> {
  const path = `files/${record.id}`;
  try {
    await setDoc(doc(db, 'files', record.id), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getFileRecordFirestore(fileId: string): Promise<UploadedFileRecord | null> {
  const path = `files/${fileId}`;
  try {
    const snap = await getDoc(doc(db, 'files', fileId));
    return snap.exists() ? (snap.data() as UploadedFileRecord) : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function deleteFileRecordFirestore(file: UploadedFileRecord): Promise<void> {
  const path = `files/${file.id}`;
  try {
    await deleteFileFromStorage(file.storagePath);
    await deleteDoc(doc(db, 'files', file.id));
    await logAdminActivity('File Deleted', file.name, `Storage path: ${file.storagePath}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function createOrderFirestore(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateOrderItemsDownloadFirestore(
  order: Order,
  productId: string
): Promise<void> {
  const path = `orders/${order.id}`;
  const updatedItems = order.items.map((it) =>
    it.productId === productId
      ? {
          ...it,
          downloadCount: it.downloadCount + 1,
          lastDownloadedAt: new Date().toISOString(),
        }
      : it
  );
  try {
    await updateDoc(doc(db, 'orders', order.id), { items: updatedItems });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function updateOrderStatusFirestore(
  orderId: string,
  status: Order['status']
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), { status });
    await logAdminActivity('Order Status Changed', `#${orderId}`, `New Status: ${status}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function upsertCustomerFirestore(customer: Customer): Promise<void> {
  const path = `customers/${customer.id}`;
  try {
    await setDoc(doc(db, 'customers', customer.id), customer, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getCustomerFirestore(uid: string): Promise<Customer | null> {
  const path = `customers/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'customers', uid));
    return snap.exists() ? (snap.data() as Customer) : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function toggleCustomerBlockFirestore(customer: Customer): Promise<void> {
  const path = `customers/${customer.id}`;
  try {
    await updateDoc(doc(db, 'customers', customer.id), { isBlocked: !customer.isBlocked });
    await logAdminActivity(
      customer.isBlocked ? 'Customer Unblocked' : 'Customer Blocked',
      customer.name,
      `Mobile: ${customer.mobile}`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function saveSettingsFirestore(settings: SiteSettings): Promise<void> {
  const path = 'settings/public';
  try {
    await setDoc(doc(db, 'settings', 'public'), settings);
    await logAdminActivity(
      'Settings Updated',
      settings.websiteName,
      `UPI: ${settings.upiId} | WhatsApp: ${settings.whatsapp}`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveCouponFirestore(coupon: Coupon): Promise<void> {
  const path = `coupons/${coupon.id}`;
  try {
    await setDoc(doc(db, 'coupons', coupon.id), coupon);
    await logAdminActivity(
      'Coupon Created',
      coupon.code,
      `${coupon.type === 'percent' ? `${coupon.value}%` : `₹${coupon.value}`} Off`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteCouponFirestore(coupon: Coupon): Promise<void> {
  const path = `coupons/${coupon.id}`;
  try {
    await deleteDoc(doc(db, 'coupons', coupon.id));
    await logAdminActivity('Coupon Deleted', coupon.code, `Removed coupon ${coupon.code}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveOfferFirestore(offer: FestivalOffer): Promise<void> {
  const path = `offers/${offer.id}`;
  try {
    await setDoc(doc(db, 'offers', offer.id), offer);
    await logAdminActivity(
      'Festival Offer Updated',
      offer.title,
      `${offer.discountPercent}% Off | Active: ${offer.active}`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function createEmailLogFirestore(log: EmailNotificationLog): Promise<void> {
  const path = `emailLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'emailLogs', log.id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function createContactFirestore(msg: ContactMessage): Promise<void> {
  const path = `contacts/${msg.id}`;
  try {
    await setDoc(doc(db, 'contacts', msg.id), msg);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// Pure Pricing & Combo Helpers
export function calcDiscountPercent(mrp: number, sellingPrice: number): number {
  if (!mrp || mrp <= sellingPrice) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

export function getEffectivePrice(
  product: Product,
  offers: FestivalOffer[]
): { effectivePrice: number; activeOfferTitle?: string } {
  const today = new Date().toISOString().slice(0, 10);
  const matching = offers.find(
    (o) =>
      o.active &&
      o.startDate <= today &&
      o.endDate >= today &&
      (o.targetClass === 'All' || o.targetClass === product.classLevel)
  );
  if (!matching) return { effectivePrice: product.sellingPrice };
  const discounted = Math.max(
    1,
    Math.round(product.sellingPrice * (1 - matching.discountPercent / 100))
  );
  return {
    effectivePrice: discounted,
    activeOfferTitle: `${matching.title} (${matching.discountPercent}% Extra Off)`,
  };
}

export function calculateCartPricing(
  cart: CartItem[],
  products: Product[],
  offers: FestivalOffer[],
  coupons: Coupon[],
  appliedCouponCode: string,
  settings: SiteSettings
) {
  const expandedPrices: number[] = [];
  let subtotal = 0;
  let hasPhysical = false;

  const lineItems = cart
    .map((ci) => {
      const product = products.find((p) => p.id === ci.productId);
      if (!product) return null;
      const { effectivePrice } = getEffectivePrice(product, offers);
      const lineTotal = effectivePrice * ci.quantity;
      subtotal += lineTotal;
      if (product.productType === 'Physical') hasPhysical = true;
      for (let i = 0; i < ci.quantity; i++) {
        expandedPrices.push(effectivePrice);
      }
      return {
        ...ci,
        product,
        unitPrice: effectivePrice,
        lineTotal,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  let comboDiscount = 0;
  if (expandedPrices.length >= 4) {
    const sortedAsc = [...expandedPrices].sort((a, b) => a - b);
    const freeCount = Math.floor(sortedAsc.length / 4);
    for (let i = 0; i < freeCount; i++) {
      comboDiscount += sortedAsc[i];
    }
  }

  const afterCombo = Math.max(0, subtotal - comboDiscount);

  let couponDiscount = 0;
  let validCoupon: Coupon | undefined;
  const codeTrim = appliedCouponCode.trim().toUpperCase();
  if (codeTrim) {
    const today = new Date().toISOString().slice(0, 10);
    const found = coupons.find(
      (c) => c.code.toUpperCase() === codeTrim && c.active && c.expiryDate >= today
    );
    if (found && afterCombo >= found.minOrder) {
      validCoupon = found;
      if (found.type === 'percent') {
        couponDiscount = Math.round((afterCombo * found.value) / 100);
      } else {
        couponDiscount = Math.min(afterCombo, found.value);
      }
    }
  }

  const afterDiscounts = Math.max(0, afterCombo - couponDiscount);

  let deliveryCharge = settings.digitalDeliveryCharge;
  if (hasPhysical) {
    deliveryCharge =
      afterDiscounts >= settings.freeDeliveryAbove ? 0 : settings.physicalDeliveryCharge;
  }

  const grandTotal = afterDiscounts + deliveryCharge;

  return {
    lineItems,
    hasPhysical,
    subtotal,
    comboDiscount,
    couponDiscount,
    validCoupon,
    deliveryCharge,
    grandTotal,
    totalUnits: expandedPrices.length,
  };
}
