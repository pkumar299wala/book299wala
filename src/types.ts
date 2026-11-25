// Book.299wala.com - Data Types (Firebase Firestore + Storage + Auth Ready)

export type CategoryName =
  | 'Notes PDF'
  | 'Test Series / Mock Test'
  | 'Unsolved Paper Set'
  | 'Solved PYQ'
  | 'eBook'
  | 'Physical Book'
  | 'Worksheet / Assignment PDF'
  | 'Current Affairs PDF'
  | 'Formula Sheet / Mind Map'
  | 'Video Course'
  | 'Stationery Kit / School Kit'
  | 'Charts / Posters / Flash Cards';

export type ClassLevel =
  | 'Class 6'
  | 'Class 7'
  | 'Class 8'
  | 'Class 9'
  | 'Class 10'
  | 'Class 11'
  | 'Class 12'
  | 'JEE'
  | 'NEET'
  | 'UPSC'
  | 'SSC';

export type SubjectName =
  | 'Science'
  | 'Maths'
  | 'Hindi'
  | 'English'
  | 'SST'
  | 'All Subjects';

export type ProductType = 'Digital' | 'Physical';
export type ProductStatus = 'Published' | 'Draft' | 'Hidden';

export interface Product {
  id: string;
  name: string;
  category: CategoryName;
  classLevel: ClassLevel;
  subject: SubjectName;
  productType: ProductType;
  mrp: number;
  sellingPrice: number;
  stock: number;
  pages: number;
  language: string;
  board: string;
  shortDesc: string;
  fullDesc: string;
  whatIsInside: string[];
  rating: number;
  reviewCount: number;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  status: ProductStatus;
  coverImage?: string;
  coverAccent?: string;
  mainFileId?: string;
  mainFileName?: string;
  mainFileType?: string;
  sampleFileId?: string;
  sampleFilePath?: string;
  samplePagesText?: string[];
  createdAt: string;
  salesCount: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productType: ProductType;
  category: CategoryName;
  price: number;
  quantity: number;
  mainFileId?: string;
  mainFileName?: string;
  downloadCount: number;
  lastDownloadedAt?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 'UPI' | 'PhonePe / GPay / Paytm' | 'Cash On Delivery';

export interface Order {
  id: string; // e.g., 299-1234 (Firestore safe ID; UI displays #299-1234)
  userId: string; // Firebase Auth UID of buyer
  customerName: string;
  mobile: string;
  whatsapp: string;
  email?: string;
  classLevel: ClassLevel;
  address?: string;
  city?: string;
  pincode?: string;
  items: OrderItem[];
  subtotal: number;
  couponCode?: string;
  discountAmount: number;
  comboDiscount: number;
  deliveryCharge: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentScreenshot?: string;
  paymentStatus: 'Paid / Screenshot Uploaded' | 'Pending Verification' | 'COD';
  status: OrderStatus;
  createdAt: string;
}

export interface Customer {
  id: string; // Firebase Auth UID
  name: string;
  mobile: string;
  whatsapp: string;
  email?: string;
  classLevel: ClassLevel;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  isBlocked: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder: number;
  expiryDate: string;
  active: boolean;
}

export interface FestivalOffer {
  id: string;
  title: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  targetClass: ClassLevel | 'All';
  active: boolean;
}

export interface UploadedFileRecord {
  id: string;
  name: string;
  storagePath: string; // Randomized Firebase Storage path (e.g., protected_files/notes_12345_xyz.pdf)
  sizeBytes: number;
  mimeType: string;
  kind: 'main' | 'sample' | 'cover' | 'screenshot' | 'logo';
  productId?: string;
  productName?: string;
  uploadedAt: string;
}

export interface AdminActivityLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

export interface EmailNotificationLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: 'new_order' | 'customer_confirm' | 'contact_form' | 'stock_low' | 'daily_report';
  sentAt: string;
  status: 'Sent' | 'Queued';
}

export interface ContactMessage {
  id: string;
  name: string;
  mobile: string;
  email: string;
  message: string;
  createdAt: string;
}

// No password stored in SiteSettings! Authentication handled exclusively by Firebase Auth.
export interface SiteSettings {
  websiteName: string;
  tagline: string;
  logoUrl?: string;
  owner: string;
  ownerName: string;
  mobile: string;
  whatsapp: string;
  upiId: string;
  adminEmail: string;
  digitalDeliveryCharge: number;
  physicalDeliveryCharge: number;
  freeDeliveryAbove: number;
  codEnabled: boolean;
  watermarkEnabled: boolean;
  maxDownloadLimit: number;
  aboutText: string;
  contactAddress: string;
  refundPolicyText: string;
  privacyPolicyText: string;
  termsText: string;
}

export interface StudentReview {
  id: string;
  name: string;
  classLabel: string;
  villageOrCity: string;
  rating: number;
  comment: string;
  initials: string;
  accentBg: string;
}
