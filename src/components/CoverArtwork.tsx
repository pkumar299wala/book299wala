// Book.299wala.com - Bespoke Educational Cover Artwork & Hero Illustration
// Zero-Broken-Image guarantee: Admin uploaded photos load with automatic fallback to crisp SVG book covers.

import React, { useState } from 'react';
import { Product } from '../types';
import { BookOpen, FileText, FlaskConical, Calculator, Award, Video, Package, Layers } from 'lucide-react';

interface CoverArtworkProps {
  product: Product;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CoverArtwork: React.FC<CoverArtworkProps> = ({ product, className = '', size = 'md' }) => {
  const [imgError, setImgError] = useState(false);

  if (product.coverImage && !imgError) {
    return (
      <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
        <img
          src={product.coverImage}
          alt={product.name}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const accent = product.coverAccent || '#0B2C6F';
  const isPhysical = product.productType === 'Physical';

  const getCategoryIcon = () => {
    switch (product.category) {
      case 'Video Course':
        return <Video className="w-6 h-6 text-white/90" />;
      case 'Stationery Kit / School Kit':
        return <Package className="w-6 h-6 text-white/90" />;
      case 'Charts / Posters / Flash Cards':
        return <Layers className="w-6 h-6 text-white/90" />;
      case 'Formula Sheet / Mind Map':
        return <Calculator className="w-6 h-6 text-white/90" />;
      case 'Solved PYQ':
      case 'Test Series / Mock Test':
        return <Award className="w-6 h-6 text-white/90" />;
      default:
        return product.subject === 'Science' ? (
          <FlaskConical className="w-6 h-6 text-white/90" />
        ) : product.productType === 'Digital' ? (
          <FileText className="w-6 h-6 text-white/90" />
        ) : (
          <BookOpen className="w-6 h-6 text-white/90" />
        );
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-slate-100 p-3 select-none ${className}`}
    >
      {/* Realistic 3D-lite Book / Notes Pack Cover */}
      <div
        className="relative flex h-full w-full max-w-[210px] flex-col justify-between rounded-r-md rounded-l-sm p-3.5 text-white shadow-md transition-transform duration-200"
        style={{
          background: `linear-gradient(155deg, ${accent} 0%, #071b47 100%)`,
          boxShadow: 'inset 8px 0 0 rgba(255,255,255,0.14), 4px 6px 14px rgba(15,23,42,0.16)',
        }}
      >
        {/* Top Academic Header */}
        <div className="flex items-start justify-between gap-2 border-b border-white/15 pb-2">
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-orange-300 uppercase">
              Galaxy Science Academy
            </p>
            <p className="text-[11px] font-medium text-white/85">{product.classLevel}</p>
          </div>
          <div className="rounded bg-white/10 p-1.5">{getCategoryIcon()}</div>
        </div>

        {/* Book Center Title */}
        <div className="my-auto py-2">
          <p className="text-[10px] font-medium text-white/75">{product.category}</p>
          <h4
            className={`mt-1 font-display font-bold leading-snug text-white ${
              size === 'lg' ? 'text-base sm:text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'
            } line-clamp-3`}
          >
            {product.name}
          </h4>
        </div>

        {/* Bottom Edition Strip */}
        <div className="flex items-center justify-between border-t border-white/15 pt-2 text-[10px] text-white/85">
          <span>{product.language.split('(')[0].trim()}</span>
          <span className="font-semibold text-orange-300">
            {isPhysical ? 'Print Edition' : `${product.pages} Pages PDF`}
          </span>
        </div>
      </div>
    </div>
  );
};

// Hero Study Desk Editorial Illustration (SVG + Crisp Card Stack, zero broken external images)
export const HeroStudyShowcase: React.FC<{ onPreviewSample: () => void }> = ({ onPreviewSample }) => {
  return (
    <div className="relative flex h-full min-h-[280px] w-full flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs font-semibold text-[#0B2C6F]">Galaxy Science Academy · Ghazipur</p>
          <p className="text-sm font-bold text-slate-900">Bestseller Study Pack Preview</p>
        </div>
        <span className="font-mono-num text-sm font-bold text-[#16A34A]">₹49 Se Shuru</span>
      </div>

      {/* 3-Book Visual Stack */}
      <div className="my-4 grid grid-cols-3 gap-3">
        <div className="flex flex-col justify-between rounded-lg bg-[#0B2C6F] p-3 text-white shadow-sm">
          <span className="text-[10px] font-medium text-orange-300">Class 10</span>
          <p className="my-2 font-display text-xs font-bold leading-snug">
            Science Complete Notes
          </p>
          <span className="font-mono-num text-xs font-bold text-white">₹199</span>
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-[#FF6B00] p-3 text-white shadow-sm">
          <span className="text-[10px] font-medium text-white/90">Quick Pack</span>
          <p className="my-2 font-display text-xs font-bold leading-snug">
            Maths Formula Sheet
          </p>
          <span className="font-mono-num text-xs font-bold text-white">₹49</span>
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-[#16A34A] p-3 text-white shadow-sm">
          <span className="text-[10px] font-medium text-white/90">10 Years</span>
          <p className="my-2 font-display text-xs font-bold leading-snug">
            Solved PYQ Papers
          </p>
          <span className="font-mono-num text-xs font-bold text-white">₹149</span>
        </div>
      </div>

      {/* Bottom Interactive Sample Trigger */}
      <div className="flex items-center justify-between gap-3 rounded-lg bg-[#F3F4F6] px-4 py-3">
        <div className="text-xs text-slate-700">
          <p className="font-semibold text-slate-900">Hindi + English Bilingual PDF</p>
          <p>Pehle 3 page free me padhkar check karein</p>
        </div>
        <button
          type="button"
          onClick={onPreviewSample}
          className="shrink-0 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#0B2C6F] border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Sample Dekhein
        </button>
      </div>
    </div>
  );
};
