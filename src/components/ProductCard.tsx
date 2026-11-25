// Book.299wala.com - Product Card Component (Amazon/Flipkart clean style, mobile-first tap targets)
import React from 'react';
import { ShoppingCart, Zap, Star, Truck, Download } from 'lucide-react';
import { FestivalOffer, Product } from '../types';
import { calcDiscountPercent, getEffectivePrice } from '../services/firestoreService';
import { CoverArtwork } from './CoverArtwork';

interface ProductCardProps {
  product: Product;
  offers: FestivalOffer[];
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  offers,
  onOpenDetail,
  onAddToCart,
  onBuyNow,
}) => {
  const { effectivePrice, activeOfferTitle } = getEffectivePrice(product, offers);
  const discountPct = calcDiscountPercent(product.mrp, effectivePrice);
  const outOfStock = product.productType === 'Physical' && product.stock <= 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md">
      {/* Cover Image Area */}
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left cursor-pointer"
      >
        <CoverArtwork product={product} className="h-full w-full" size="md" />
      </button>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4">
        {/* Clean Unboxed Metadata (Zero Pill Discipline) */}
        <p className="text-xs font-medium text-slate-500">
          {product.classLevel} <span aria-hidden="true">·</span> {product.category}{' '}
          <span aria-hidden="true">·</span> {product.pages} Pages
        </p>

        {/* Product Title */}
        <button
          type="button"
          onClick={() => onOpenDetail(product)}
          className="mt-1.5 text-left cursor-pointer"
        >
          <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-slate-900 group-hover:text-[#0B2C6F]">
            {product.name}
          </h3>
        </button>

        {/* 2-Line Description */}
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {product.shortDesc}
        </p>

        {/* Rating & Delivery Type */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 tabular-nums">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)} ({product.reviewCount} Reviews)
          </span>

          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              product.productType === 'Digital' ? 'text-[#16A34A]' : 'text-[#0B2C6F]'
            }`}
          >
            {product.productType === 'Digital' ? (
              <>
                <Download className="h-3.5 w-3.5" />
                Instant Download
              </>
            ) : (
              <>
                <Truck className="h-3.5 w-3.5" />
                Courier - 3-5 Days
              </>
            )}
          </span>
        </div>

        {/* Price Row */}
        <div className="mt-3 flex items-baseline gap-2 border-t border-slate-100 pt-3">
          <span className="font-mono-num text-xl font-bold text-slate-900">
            ₹{effectivePrice}
          </span>
          {product.mrp > effectivePrice && (
            <span className="font-mono-num text-sm text-slate-400 line-through">
              ₹{product.mrp}
            </span>
          )}
          {discountPct > 0 && (
            <span className="font-mono-num text-xs font-bold text-[#16A34A]">
              {discountPct}% OFF
            </span>
          )}
        </div>
        {activeOfferTitle && (
          <p className="mt-0.5 text-[11px] font-semibold text-[#FF6B00]">{activeOfferTitle}</p>
        )}

        {/* Action Buttons (Large, easy to tap on mobile >= 44px) */}
        <div className="mt-4 grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onAddToCart(product)}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-[#0B2C6F] bg-white px-3 text-xs sm:text-sm font-bold text-[#0B2C6F] hover:bg-blue-50 disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            <span>Add To Cart</span>
          </button>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onBuyNow(product)}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#FF6B00] px-3 text-xs sm:text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Zap className="h-4 w-4 shrink-0" />
            <span>{outOfStock ? 'Out Of Stock' : 'Buy Now'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
