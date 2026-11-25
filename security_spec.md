# Security Specification — Book.299wala.com (Phase 0 TDD)

## 1. Data Invariants
1. **Product Catalog Integrity**: Customers and unauthenticated visitors can ONLY read `products` and `settings`. Only verified Admin (`isAdmin()`) can create, update, or delete products, prices, coupons, or settings.
2. **Order Ownership & Anti-Tampering**: Every order must belong to `request.auth.uid` (`incoming().userId == request.auth.uid`). Customers cannot view or list other customers' orders. Customers cannot modify `grandTotal`, `status`, or `paymentStatus` after order creation.
3. **Download Count Guard**: Customers can only increment `downloadCount` via controlled update where `userId == resource.data.userId` and `grandTotal` / `status` remain immutable; maximum 3 downloads per order enforced.
4. **PII Isolation**: Customer mobile numbers, WhatsApp numbers, and addresses inside `/customers/{customerId}` and `/orders/{orderId}` are strictly restricted to the owning `request.auth.uid` or `isAdmin()`.
5. **Immutable Admin Audit Trail**: `/activityLogs/{logId}` can only be created and read by `isAdmin()`, never updated or deleted.
6. **Storage Direct-Access Prevention**: `protected_files/**` in Firebase Storage denies all unauthenticated reads; only authenticated users with a verified order (or Admin) can fetch file bytes, and files use randomized non-guessable filenames.

## 2. The "Dirty Dozen" Attack Payloads (Must All Return PERMISSION_DENIED)
1. **Price Tampering (Browser Console)**: Non-admin user attempts `updateDoc(doc(db, 'products', 'prod-01'), { sellingPrice: 1 })`.
2. **Shadow Field Injection on Order**: Authenticated customer creates an order with extra field `{ isAdminOverride: true }`.
3. **Order Identity Spoofing**: Authenticated customer `userA` creates an order with `{ userId: 'userB' }`.
4. **Cross-Customer Order Snooping (`get` & `list`)**: `userA` runs `getDocs(collection(db, 'orders'))` without filtering by `userId == request.auth.uid` or reads `orders/orderOfUserB`.
5. **Unverified Admin Email Spoof**: User signs up with `Galaxyscienceacademy@gmail.com` where `email_verified == false` and tries to write to `/products`.
6. **Self-Privilege Escalation**: Customer writes `{ uid: request.auth.uid, email: 'hacker@test.com' }` to `/admins/{uid}`.
7. **Customer Profile PII Leak**: `userA` attempts to read `/customers/userB`.
8. **Blocked Customer Bypass**: Blocked customer updates `/customers/userA` with `{ isBlocked: false }`.
9. **Settings Hijack**: Non-admin user updates `/settings/public` with `{ upiId: 'hacker@upi' }`.
10. **Audit Log Deletion**: User or even admin tries `deleteDoc(doc(db, 'activityLogs', 'log1'))`.
11. **Oversized Document ID Poisoning**: User creates `/orders/${'a'.repeat(500)}`.
12. **Order Status Self-Confirm**: Customer updates their own order `{ status: 'Delivered', paymentStatus: 'Paid' }`.
