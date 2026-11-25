// Book.299wala.com - Admin Modules 1, 2, 3, 4:
// Firebase Storage Upload (Random Names), Manage Products, Price/Coupons, File Manager

import React, { useState } from 'react';
import {
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { CATEGORIES, CLASS_LEVELS, SUBJECTS } from '../../data/seedData';
import {
  CategoryName,
  ClassLevel,
  Coupon,
  FestivalOffer,
  Product,
  ProductStatus,
  ProductType,
  SiteSettings,
  SubjectName,
  UploadedFileRecord,
} from '../../types';
import { calcDiscountPercent, uploadFileToStorage } from '../../services/firestoreService';
import { CoverArtwork } from '../../components/CoverArtwork';

interface AdminProductFormProps {
  editingProduct: Product | null;
  onSaveProduct: (product: Product, newFiles: UploadedFileRecord[]) => Promise<void>;
  onCancel: () => void;
}

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  editingProduct,
  onSaveProduct,
  onCancel,
}) => {
  const [name, setName] = useState(editingProduct?.name || '');
  const [category, setCategory] = useState<CategoryName>(editingProduct?.category || 'Notes PDF');
  const [classLevel, setClassLevel] = useState<ClassLevel>(editingProduct?.classLevel || 'Class 10');
  const [subject, setSubject] = useState<SubjectName>(editingProduct?.subject || 'Science');
  const [productType, setProductType] = useState<ProductType>(editingProduct?.productType || 'Digital');
  const [mrp, setMrp] = useState<number>(editingProduct?.mrp || 299);
  const [sellingPrice, setSellingPrice] = useState<number>(editingProduct?.sellingPrice || 149);
  const [stock, setStock] = useState<number>(editingProduct?.stock ?? 50);
  const [pages, setPages] = useState<number>(editingProduct?.pages || 60);
  const [language, setLanguage] = useState(editingProduct?.language || 'Hindi + English');
  const [board, setBoard] = useState(editingProduct?.board || 'UP Board / CBSE / NCERT');
  const [shortDesc, setShortDesc] = useState(editingProduct?.shortDesc || '');
  const [fullDesc, setFullDesc] = useState(editingProduct?.fullDesc || '');
  const [whatIsInsideText, setWhatIsInsideText] = useState(
    editingProduct?.whatIsInside.join('\n') ||
      'Chapter-wise Complete Notes\nImportant Board Exam Questions\nClean Printable PDF'
  );
  const [status, setStatus] = useState<ProductStatus>(editingProduct?.status || 'Published');
  const [coverImage, setCoverImage] = useState(editingProduct?.coverImage || '');
  const [mainFileRec, setMainFileRec] = useState<UploadedFileRecord | null>(null);
  const [sampleFileRec, setSampleFileRec] = useState<UploadedFileRecord | null>(null);
  const [sampleFilePath, setSampleFilePath] = useState(editingProduct?.sampleFilePath || '');
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const discountPct = calcDiscountPercent(mrp, sellingPrice);

  const handleCoverSelect = async (file?: File) => {
    if (!file) return;
    setUploadStatus(`Uploading cover ${file.name} to Firebase Storage...`);
    try {
      const { publicUrl } = await uploadFileToStorage({ file, folder: 'covers' });
      if (publicUrl) setCoverImage(publicUrl);
      setUploadStatus('Cover image uploaded securely!');
    } catch (err) {
      setUploadStatus(`Cover upload error: ${err instanceof Error ? err.message : 'Failed'}`);
    }
  };

  const handleMainFileSelect = async (file?: File) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setUploadStatus('Error: File size 100MB se kam honi chahiye.');
      return;
    }
    setUploadStatus(`Uploading ${file.name} to protected Firebase Storage...`);
    try {
      const { storagePath } = await uploadFileToStorage({ file, folder: 'protected_files' });
      const rec: UploadedFileRecord = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        storagePath,
        sizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
        kind: 'main',
        productName: name || file.name,
        uploadedAt: new Date().toISOString(),
      };
      setMainFileRec(rec);
      setUploadStatus(`Securely stored as ${storagePath} (${(file.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      setUploadStatus(`File upload failed: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  const handleSampleFileSelect = async (file?: File) => {
    if (!file) return;
    setUploadStatus(`Uploading sample ${file.name}...`);
    try {
      const { storagePath, publicUrl } = await uploadFileToStorage({ file, folder: 'samples' });
      const rec: UploadedFileRecord = {
        id: `sample-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        storagePath,
        sizeBytes: file.size,
        mimeType: file.type || 'application/pdf',
        kind: 'sample',
        productName: name || file.name,
        uploadedAt: new Date().toISOString(),
      };
      setSampleFileRec(rec);
      setSampleFilePath(publicUrl || storagePath);
      setUploadStatus('3-Page sample PDF uploaded!');
    } catch (err) {
      setUploadStatus(`Sample upload error: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = editingProduct?.id || `prod-${Date.now()}`;
      const product: Product = {
        id,
        name: name.trim(),
        category,
        classLevel,
        subject,
        productType,
        mrp: Number(mrp),
        sellingPrice: Number(sellingPrice),
        stock: productType === 'Digital' ? 9999 : Number(stock),
        pages: Number(pages),
        language: language.trim(),
        board: board.trim(),
        shortDesc: shortDesc.trim() || `${classLevel} ${subject} — ${category} by Galaxy Science Academy.`,
        fullDesc: fullDesc.trim() || shortDesc.trim() || `${name} complete study pack.`,
        whatIsInside: whatIsInsideText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        rating: editingProduct?.rating || 4.8,
        reviewCount: editingProduct?.reviewCount || 45,
        isBestSeller: editingProduct?.isBestSeller ?? false,
        isNewArrival: editingProduct?.isNewArrival ?? true,
        status,
        coverImage: coverImage || undefined,
        coverAccent: editingProduct?.coverAccent || '#0B2C6F',
        mainFileId: mainFileRec?.id || editingProduct?.mainFileId,
        mainFileName: mainFileRec?.name || editingProduct?.mainFileName,
        mainFileType: mainFileRec?.mimeType || editingProduct?.mainFileType,
        sampleFileId: sampleFileRec?.id || editingProduct?.sampleFileId,
        sampleFilePath: sampleFilePath || editingProduct?.sampleFilePath,
        samplePagesText: editingProduct?.samplePagesText,
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        salesCount: editingProduct?.salesCount || 0,
      };

      const newFiles: UploadedFileRecord[] = [];
      if (mainFileRec) newFiles.push({ ...mainFileRec, productId: id, productName: product.name });
      if (sampleFileRec) newFiles.push({ ...sampleFileRec, productId: id, productName: product.name });

      await onSaveProduct(product, newFiles);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h2 className="font-display text-xl font-bold text-[#0B2C6F]">
          {editingProduct ? 'Edit Product' : 'Add New Product (Firestore + Firebase Storage)'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700">
            Product Name (Hindi + English) *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Class 10 Chemistry Complete Notes PDF"
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold"
          >
            <option value="Published">Publish (Live)</option>
            <option value="Draft">Draft</option>
            <option value="Hidden">Hide</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryName)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">Class</label>
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
          <label className="block text-xs font-bold text-slate-700">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectName)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            {SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">Product Type</label>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value as ProductType)}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="Digital">Digital (Instant Download)</option>
            <option value="Physical">Physical (Courier)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">MRP Price (₹)</label>
          <input
            type="number"
            min={1}
            required
            value={mrp}
            onChange={(e) => setMrp(Number(e.target.value))}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">
            Selling Price (₹) — <span className="text-[#16A34A]">{discountPct}% Off Auto</span>
          </label>
          <input
            type="number"
            min={1}
            required
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Number(e.target.value))}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">
            Stock ({productType === 'Digital' ? 'Unlimited' : 'Physical Quantity'})
          </label>
          <input
            type="number"
            min={0}
            disabled={productType === 'Digital'}
            value={productType === 'Digital' ? 9999 : stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">Total Pages</label>
          <input
            type="number"
            min={1}
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">Language & Board</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Hindi + English"
              className="h-11 rounded-lg border border-slate-300 px-2.5 text-xs"
            />
            <input
              type="text"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              placeholder="UP Board / CBSE"
              className="h-11 rounded-lg border border-slate-300 px-2.5 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-slate-700">Short Description (2 lines)</label>
          <textarea
            rows={2}
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            placeholder="Students ke liye easy 2 line summary..."
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700">
            What Is Inside List (Har line ek point)
          </label>
          <textarea
            rows={3}
            value={whatIsInsideText}
            onChange={(e) => setWhatIsInsideText(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700">Full Description</label>
          <textarea
            rows={2}
            value={fullDesc}
            onChange={(e) => setFullDesc(e.target.value)}
            placeholder="Product ki poori jankari..."
            className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm"
          />
        </div>
      </div>

      {/* Firebase Storage Uploads */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleCoverSelect(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center ${
            dragActive ? 'border-[#FF6B00] bg-orange-50' : 'border-slate-300 bg-[#F3F4F6]'
          }`}
        >
          <Upload className="h-6 w-6 text-[#0B2C6F]" />
          <p className="mt-1.5 text-xs font-bold text-slate-800">Cover Photo (JPG/PNG)</p>
          <p className="text-[11px] text-slate-500">Random Name · Firebase Storage</p>
          <label className="mt-2 cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#0B2C6F] border border-slate-300">
            Select Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleCoverSelect(e.target.files?.[0])}
              className="hidden"
            />
          </label>
          {coverImage && (
            <img src={coverImage} alt="Cover preview" className="mt-2 h-16 rounded object-cover" />
          )}
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-[#F3F4F6] p-4 text-center">
          <FileText className="h-6 w-6 text-[#16A34A]" />
          <p className="mt-1.5 text-xs font-bold text-slate-800">
            Main File (PDF/Word/Excel/PPT/ZIP)
          </p>
          <p className="text-[11px] text-slate-500">Protected Path · Max 100MB</p>
          <label className="mt-2 cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#16A34A] border border-slate-300">
            Select Main File
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
              onChange={(e) => handleMainFileSelect(e.target.files?.[0])}
              className="hidden"
            />
          </label>
          {(mainFileRec?.name || editingProduct?.mainFileName) && (
            <p className="mt-2 truncate max-w-full text-[11px] font-semibold text-slate-700">
              {mainFileRec?.name || editingProduct?.mainFileName}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-[#F3F4F6] p-4 text-center">
          <FileText className="h-6 w-6 text-[#FF6B00]" />
          <p className="mt-1.5 text-xs font-bold text-slate-800">Sample File (First 3 Pages PDF)</p>
          <p className="text-[11px] text-slate-500">View-Only Preview</p>
          <label className="mt-2 cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#FF6B00] border border-slate-300">
            Select Sample PDF
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleSampleFileSelect(e.target.files?.[0])}
              className="hidden"
            />
          </label>
          {sampleFileRec && (
            <p className="mt-2 truncate max-w-full text-[11px] font-semibold text-slate-700">
              {sampleFileRec.name}
            </p>
          )}
        </div>
      </div>

      {uploadStatus && <p className="text-xs font-semibold text-[#0B2C6F]">{uploadStatus}</p>}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 rounded-lg border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-lg bg-[#16A34A] px-6 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving to Firestore...' : 'Save & Publish Product'}
        </button>
      </div>
    </form>
  );
};

// MODULE 2: MANAGE PRODUCTS TABLE
export const AdminProductList: React.FC<{
  products: Product[];
  onAddNew: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => Promise<void>;
  onDuplicate: (p: Product) => Promise<void>;
  onToggleStatus: (p: Product) => Promise<void>;
}> = ({ products, onAddNew, onEdit, onDelete, onDuplicate, onToggleStatus }) => {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.classLevel.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product Name or Category..."
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#FF6B00] px-4 text-sm font-bold text-white hover:bg-orange-600 cursor-pointer whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category / Class</th>
              <th className="px-4 py-3 text-right">Price (MRP)</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">File Name</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded border border-slate-200">
                      <CoverArtwork product={p} className="h-full w-full" size="sm" />
                    </div>
                    <span className="font-semibold text-slate-900 max-w-[220px] line-clamp-2">
                      {p.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800">{p.category}</div>
                  <div>
                    {p.classLevel} · {p.productType}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono-num">
                  <div className="font-bold text-slate-900">₹{p.sellingPrice}</div>
                  <div className="text-xs text-slate-400 line-through">₹{p.mrp}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono-num text-xs font-semibold">
                  {p.productType === 'Digital' ? 'Unlimited' : p.stock}
                </td>
                <td className="px-4 py-3 text-xs font-bold">
                  <span
                    className={
                      p.status === 'Published'
                        ? 'text-[#16A34A]'
                        : p.status === 'Hidden'
                          ? 'text-red-600'
                          : 'text-amber-600'
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">
                  {p.mainFileName || '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      title="Edit Product"
                      onClick={() => onEdit(p)}
                      className="rounded border border-slate-200 p-1.5 text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Duplicate Product"
                      onClick={() => onDuplicate(p)}
                      className="rounded border border-slate-200 p-1.5 text-[#0B2C6F] hover:bg-blue-50 cursor-pointer"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title={p.status === 'Published' ? 'Hide Product' : 'Show Product'}
                      onClick={() => onToggleStatus(p)}
                      className="rounded border border-slate-200 p-1.5 text-amber-600 hover:bg-amber-50 cursor-pointer"
                    >
                      {p.status === 'Published' ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Delete Product"
                      onClick={() => setDeleteTarget(p)}
                      className="rounded border border-slate-200 p-1.5 text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Pakka Delete Karna Hai?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              “{deleteTarget.name}” Firestore se hamesha ke liye hat jayega.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 cursor-pointer"
              >
                Nahi, Ruko
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDelete(deleteTarget);
                  setDeleteTarget(null);
                }}
                className="h-10 rounded-lg bg-red-600 px-4 text-sm font-bold text-white cursor-pointer"
              >
                Haan, Delete Karein
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// MODULE 3: PRICE MANAGEMENT, FESTIVAL OFFERS, COUPONS & BULK PRICE CHANGE
export const AdminPriceManager: React.FC<{
  products: Product[];
  coupons: Coupon[];
  offers: FestivalOffer[];
  onQuickPriceSave: (product: Product, mrp: number, sellingPrice: number) => Promise<void>;
  onBulkClassDiscount: (classLevel: ClassLevel, percentOff: number) => Promise<void>;
  onSaveCoupon: (coupon: Coupon) => Promise<void>;
  onDeleteCoupon: (coupon: Coupon) => Promise<void>;
  onSaveOffer: (offer: FestivalOffer) => Promise<void>;
}> = ({
  products,
  coupons,
  offers,
  onQuickPriceSave,
  onBulkClassDiscount,
  onSaveCoupon,
  onDeleteCoupon,
  onSaveOffer,
}) => {
  const [bulkClass, setBulkClass] = useState<ClassLevel>('Class 10');
  const [bulkPercent, setBulkPercent] = useState(20);
  const [bulkMsg, setBulkMsg] = useState('');

  const [cCode, setCCode] = useState('');
  const [cType, setCType] = useState<'percent' | 'flat'>('percent');
  const [cValue, setCValue] = useState(25);
  const [cExpiry, setCExpiry] = useState('2027-12-31');

  const activeOffer = offers[0];
  const [offTitle, setOffTitle] = useState(activeOffer?.title || 'Board Special Offer');
  const [offPct, setOffPct] = useState(activeOffer?.discountPercent || 15);
  const [offStart, setOffStart] = useState(activeOffer?.startDate || '2026-01-01');
  const [offEnd, setOffEnd] = useState(activeOffer?.endDate || '2027-03-31');
  const [offClass, setOffClass] = useState<ClassLevel | 'All'>(activeOffer?.targetClass || 'All');
  const [offActive, setOffActive] = useState(activeOffer?.active ?? false);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-display text-base font-bold text-[#0B2C6F]">
            Bulk Price Change (Ek Saath Discount Lagayein)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Example: Saare Class 10 Products par ek saath 20% Off karein (Firestore me update hoga)
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Target Class</label>
              <select
                value={bulkClass}
                onChange={(e) => setBulkClass(e.target.value as ClassLevel)}
                className="mt-1 h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {CLASS_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Discount % Off</label>
              <input
                type="number"
                min={5}
                max={80}
                value={bulkPercent}
                onChange={(e) => setBulkPercent(Number(e.target.value))}
                className="mt-1 h-10 w-24 rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                await onBulkClassDiscount(bulkClass, bulkPercent);
                setBulkMsg(`${bulkClass} ke sabhi products par ${bulkPercent}% discount Firestore me save ho gaya!`);
              }}
              className="h-10 rounded-lg bg-[#FF6B00] px-4 text-xs font-bold text-white hover:bg-orange-600 cursor-pointer"
            >
              Apply Bulk Off
            </button>
          </div>
          {bulkMsg && <p className="mt-2 text-xs font-bold text-[#16A34A]">{bulkMsg}</p>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#0B2C6F]">
              Festival / Exam Offer Price
            </h3>
            <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={offActive}
                onChange={(e) => setOffActive(e.target.checked)}
                className="h-4 w-4 accent-[#16A34A]"
              />
              <span>{offActive ? 'Offer ON' : 'Offer OFF'}</span>
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={offTitle}
              onChange={(e) => setOffTitle(e.target.value)}
              placeholder="Offer Name"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={offPct}
                onChange={(e) => setOffPct(Number(e.target.value))}
                className="h-10 w-20 rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
              />
              <select
                value={offClass}
                onChange={(e) => setOffClass(e.target.value as ClassLevel | 'All')}
                className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-2 text-sm"
              >
                <option value="All">All Classes</option>
                {CLASS_LEVELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="date"
              value={offStart}
              onChange={(e) => setOffStart(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />
            <input
              type="date"
              value={offEnd}
              onChange={(e) => setOffEnd(e.target.value)}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              onSaveOffer({
                id: activeOffer?.id || 'off-1',
                title: offTitle,
                discountPercent: offPct,
                startDate: offStart,
                endDate: offEnd,
                targetClass: offClass,
                active: offActive,
              })
            }
            className="mt-3 h-10 rounded-lg bg-[#0B2C6F] px-4 text-xs font-bold text-white cursor-pointer"
          >
            Save Festival Offer
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-display text-base font-bold text-[#0B2C6F]">
          Coupon Codes Manager (Firestore Synced)
        </h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600">Coupon Code</label>
            <input
              type="text"
              value={cCode}
              onChange={(e) => setCCode(e.target.value.toUpperCase())}
              placeholder="DIWALI30"
              className="mt-1 h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono-num uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600">Type</label>
            <select
              value={cType}
              onChange={(e) => setCType(e.target.value as 'percent' | 'flat')}
              className="mt-1 h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="percent">% Discount</option>
              <option value="flat">Fixed ₹ Off</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600">Value</label>
            <input
              type="number"
              value={cValue}
              onChange={(e) => setCValue(Number(e.target.value))}
              className="mt-1 h-10 w-24 rounded-lg border border-slate-300 px-3 text-sm font-mono-num"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600">Expiry Date</label>
            <input
              type="date"
              value={cExpiry}
              onChange={(e) => setCExpiry(e.target.value)}
              className="mt-1 h-10 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!cCode.trim()) return;
              await onSaveCoupon({
                id: `coup-${Date.now()}`,
                code: cCode.trim().toUpperCase(),
                type: cType,
                value: cValue,
                minOrder: 49,
                expiryDate: cExpiry,
                active: true,
              });
              setCCode('');
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#16A34A] px-4 text-xs font-bold text-white cursor-pointer"
          >
            <Tag className="h-4 w-4" />
            Create Coupon
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          {coupons.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <span className="font-mono-num font-bold text-[#0B2C6F]">{c.code}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span>{c.type === 'percent' ? `${c.value}% Off` : `₹${c.value} Off`}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-xs text-slate-500">Expires: {c.expiryDate}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteCoupon(c)}
                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-display text-base font-bold text-[#0B2C6F]">
          Ek Jagah Se Price Badlo (Admin-Only Firestore Write)
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-bold text-slate-600">
              <tr>
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 px-3">MRP (₹)</th>
                <th className="py-2 px-3">Selling Price (₹)</th>
                <th className="py-2 pl-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <QuickPriceRow key={p.id} product={p} onSave={onQuickPriceSave} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const QuickPriceRow: React.FC<{
  product: Product;
  onSave: (product: Product, mrp: number, selling: number) => Promise<void>;
}> = ({ product, onSave }) => {
  const [mrp, setMrp] = useState(product.mrp);
  const [sell, setSell] = useState(product.sellingPrice);
  const [saved, setSaved] = useState(false);

  return (
    <tr>
      <td className="py-2.5 pr-4 font-medium text-slate-800">{product.name}</td>
      <td className="py-2.5 px-3">
        <input
          type="number"
          value={mrp}
          onChange={(e) => setMrp(Number(e.target.value))}
          className="h-9 w-24 rounded border border-slate-300 px-2 font-mono-num text-sm"
        />
      </td>
      <td className="py-2.5 px-3">
        <input
          type="number"
          value={sell}
          onChange={(e) => setSell(Number(e.target.value))}
          className="h-9 w-24 rounded border border-slate-300 px-2 font-mono-num text-sm"
        />
      </td>
      <td className="py-2.5 pl-3 text-right">
        <button
          type="button"
          onClick={async () => {
            await onSave(product, mrp, sell);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          className="h-9 rounded-lg bg-[#0B2C6F] px-3 text-xs font-bold text-white cursor-pointer"
        >
          {saved ? 'Updated!' : 'Update'}
        </button>
      </td>
    </tr>
  );
};

// MODULE 4: FILE MANAGER & FIREBASE STORAGE CONTROL
export const AdminFileManager: React.FC<{
  files: UploadedFileRecord[];
  products: Product[];
  settings: SiteSettings;
  onToggleWatermark: () => Promise<void>;
  onDeleteFile: (file: UploadedFileRecord) => Promise<void>;
  onReplaceProductFile: (productId: string, newFile: UploadedFileRecord) => Promise<void>;
}> = ({ files, products, settings, onToggleWatermark, onDeleteFile, onReplaceProductFile }) => {
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const filtered = files.filter(
    (f) =>
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.productName || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleReplace = async (productId: string, file?: File) => {
    if (!file) return;
    setMsg(`Uploading replacement file ${file.name} to Firebase Storage...`);
    try {
      const { storagePath } = await uploadFileToStorage({ file, folder: 'protected_files' });
      const rec: UploadedFileRecord = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        storagePath,
        sizeBytes: file.size,
        mimeType: file.type || 'application/pdf',
        kind: 'main',
        productId,
        productName: products.find((p) => p.id === productId)?.name,
        uploadedAt: new Date().toISOString(),
      };
      await onReplaceProductFile(productId, rec);
      setMsg(`File "${file.name}" Firebase Storage me replace ho gayi (${storagePath})!`);
    } catch (err) {
      setMsg(`Replace failed: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h3 className="font-display text-base font-bold text-[#0B2C6F]">
            Firebase Storage Security & Watermark Control
          </h3>
          <p className="text-xs text-slate-600">
            Randomized Paths · Unauthenticated Storage Access Blocked · Max {settings.maxDownloadLimit} Downloads/Order
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleWatermark}
          className={`h-10 rounded-lg px-4 text-xs font-bold text-white cursor-pointer ${
            settings.watermarkEnabled ? 'bg-[#16A34A]' : 'bg-slate-600'
          }`}
        >
          Watermark: {settings.watermarkEnabled ? 'ON (Active)' : 'OFF'}
        </button>
      </div>

      {msg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-bold text-[#16A34A]">
          {msg}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-[#0B2C6F]" />
            <h3 className="font-display text-base font-bold text-slate-900">
              Firebase Storage Files ({filtered.length})
            </h3>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search file or product..."
            className="h-10 w-64 rounded-lg border border-slate-300 px-3 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-bold text-slate-600">
              <tr>
                <th className="py-2 pr-4">File Name & Storage Path</th>
                <th className="py-2 px-3">Linked Product</th>
                <th className="py-2 px-3">Size</th>
                <th className="py-2 px-3">Uploaded</th>
                <th className="py-2 pl-3 text-right">Replace / Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-900">{f.name}</div>
                    <div className="font-mono-num text-[11px] text-slate-400">{f.storagePath}</div>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-600">{f.productName || '—'}</td>
                  <td className="py-3 px-3 font-mono-num text-xs text-slate-600">
                    {(f.sizeBytes / 1024).toFixed(0)} KB
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-500">
                    {new Date(f.uploadedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {f.productId && (
                        <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-[#0B2C6F] px-2.5 text-xs font-bold text-[#0B2C6F] hover:bg-blue-50">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Replace File
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                            onChange={(e) => handleReplace(f.productId!, e.target.files?.[0])}
                            className="hidden"
                          />
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteFile(f)}
                        className="rounded border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
