// Book.299wala.com - Free 3-Page Sample Preview Modal (View Only, No Download)
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface SamplePreviewModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product) => void;
}

export const SamplePreviewModal: React.FC<SamplePreviewModalProps> = ({
  product,
  onClose,
  onBuyNow,
}) => {
  const [pageIdx, setPageIdx] = useState(0);

  if (!product) return null;

  const pages =
    product.samplePagesText && product.samplePagesText.length > 0
      ? product.samplePagesText.slice(0, 3)
      : [
          `${product.name} — Sample Page 1: Chapter Overview, Core Definitions aur Easy Hindi+English Explanation.`,
          `${product.name} — Sample Page 2: Board Exam Important Formulas, Diagrams aur Solved Examples.`,
          `${product.name} — Sample Page 3: Practice Questions aur Topper Answer Writing Format.`,
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-6"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0B2C6F] px-5 py-4 text-white">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-medium text-orange-300">
              Free 3-Page Sample Preview · View Only (Download Disabled)
            </p>
            <h3 className="truncate font-display text-base font-bold">{product.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sample preview"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View-Only PDF Page Canvas */}
        <div className="flex-1 overflow-y-auto bg-[#F3F4F6] p-4 sm:p-6 select-none">
          <div className="mx-auto min-h-[340px] max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500">
              <span className="font-semibold text-[#0B2C6F]">Book.299wala.com · Sample Copy</span>
              <span className="font-mono-num">
                Page {pageIdx + 1} / {pages.length}
              </span>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-slate-800 sm:text-base">
              <h4 className="font-display text-base font-bold text-slate-900">
                {product.classLevel} · {product.subject} · {product.language}
              </h4>
              <p className="rounded-lg bg-slate-50 p-4 border border-slate-200">{pages[pageIdx]}</p>

              {pageIdx === 0 && product.whatIsInside.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Full PDF Me Kya Milega:
                  </p>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {product.whatIsInside.map((line, i) => (
                      <li key={i}>• {line}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800 border border-orange-200">
                <Lock className="h-4 w-4 shrink-0" />
                <span>
                  Ye sirf 3-page view-only sample hai. Poora {product.pages}-page watermarked PDF purchase ke baad download hoga.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageIdx === 0}
              onClick={() => setPageIdx((p) => Math.max(0, p - 1))}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              type="button"
              disabled={pageIdx >= pages.length - 1}
              onClick={() => setPageIdx((p) => Math.min(pages.length - 1, p + 1))}
              className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onBuyNow(product);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#FF6B00] px-5 text-sm font-bold text-white hover:bg-orange-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart className="h-4 w-4" />
            Buy Full Pack · ₹{product.sellingPrice}
          </button>
        </div>
      </div>
    </div>
  );
};
