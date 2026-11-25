// Book.299wala.com - Product Detail Page (Big Cover, What Is Inside, 3-Page View-Only Sample, Related Products)
import React from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import { FestivalOffer, Product } from '../types';
import { calcDiscountPercent, getEffectivePrice } from '../services/firestoreService';
import { CoverArtwork } from '../components/CoverArtwork';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  offers: FestivalOffer[];
  onBack: () => void;
  onOpenDetail: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onOpenSample: (p: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  offers,
  onBack,
  onOpenDetail,
  onAddToCart,
  onBuyNow,
  onOpenSample,
}) => {
  const { effectivePrice, activeOfferTitle } = getEffectivePrice(product, offers);
  const discountPct = calcDiscountPercent(product.mrp, effectivePrice);
  const outOfStock = product.productType === 'Physical' && product.stock <= 0;

  const relatedProducts = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.status === 'Published' &&
        (p.classLevel === product.classLevel || p.subject === product.subject)
    )
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B2C6F] hover:underline cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Wapas Store Par Jayein
      </button>

      {/* Main Contiguous Product Detail Card */}
      <div className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 lg:grid-cols-12">
        {/* Left Sticky Cover Showcase */}
        <div className="lg:col-span-5">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <CoverArtwork product={product} className="h-full w-full" size="lg" />
          </div>

          {/* Sample Preview Trigger */}
          <button
            type="button"
            onClick={() => onOpenSample(product)}
            className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border-2 border-[#0B2C6F] bg-blue-50 px-4 text-sm font-bold text-[#0B2C6F] hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            Free 3 Page Sample Dekhein (View Only)
          </button>
        </div>

        {/* Right Purchase & Description Module */}
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold text-slate-500">
            {product.classLevel} <span aria-hidden="true">·</span> {product.category}{' '}
            <span aria-hidden="true">·</span> {product.board}
          </p>

          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1 font-bold text-slate-800 tabular-nums">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {product.rating.toFixed(1)} ({product.reviewCount} Student Reviews)
            </span>
            <span className="text-slate-400">|</span>
            <span className="font-semibold text-slate-700">
              {product.pages} Pages · {product.language}
            </span>
          </div>

          {/* Price Block */}
          <div className="mt-5 rounded-xl bg-[#F3F4F6] p-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono-num text-3xl font-extrabold text-slate-900">
                ₹{effectivePrice}
              </span>
              {product.mrp > effectivePrice && (
                <span className="font-mono-num text-base text-slate-400 line-through">
                  ₹{product.mrp}
                </span>
              )}
              {discountPct > 0 && (
                <span className="font-mono-num text-sm font-bold text-[#16A34A]">
                  {discountPct}% OFF
                </span>
              )}
            </div>
            {activeOfferTitle && (
              <p className="mt-1 text-xs font-bold text-[#FF6B00]">{activeOfferTitle}</p>
            )}
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              {product.productType === 'Digital' ? (
                <>
                  <Download className="h-4 w-4 text-[#16A34A]" />
                  <span>Instant Download (UPI Payment Ke Baad Turant Milega · Max 3 Downloads)</span>
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 text-[#0B2C6F]" />
                  <span>
                    Courier Delivery 3-5 Days · Stock:{' '}
                    {product.stock > 0 ? `${product.stock} Units Available` : 'Out Of Stock'}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => onAddToCart(product)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border-2 border-[#0B2C6F] bg-white px-5 text-base font-bold text-[#0B2C6F] hover:bg-blue-50 disabled:opacity-40 cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5" />
              Add To Cart
            </button>

            <button
              type="button"
              disabled={outOfStock}
              onClick={() => onBuyNow(product)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-5 text-base font-bold text-white hover:bg-orange-600 disabled:opacity-40 cursor-pointer"
            >
              <Zap className="h-5 w-5" />
              {outOfStock ? 'Out Of Stock' : 'Buy Now'}
            </button>
          </div>

          {/* Full Description */}
          <div className="mt-7 border-t border-slate-200 pt-5">
            <h2 className="font-display text-base font-bold text-slate-900">
              Product Details (Poori Jankari)
            </h2>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-700">
              {product.fullDesc}
            </p>
          </div>

          {/* What Is Inside List */}
          <div className="mt-6">
            <h3 className="font-display text-base font-bold text-slate-900">
              Is Pack Me Kya-Kya Milega (What Is Inside)
            </h3>
            <ul className="mt-3 space-y-2">
              {product.whatIsInside.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-bold text-slate-900">
            Iske Saath Ye Bhi Kharidein (Related Study Material)
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((rp) => (
              <ProductCard
                key={rp.id}
                product={rp}
                offers={offers}
                onOpenDetail={onOpenDetail}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
