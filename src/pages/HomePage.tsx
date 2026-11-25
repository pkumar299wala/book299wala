// Book.299wala.com - Customer Home Page (Hero, 12 Categories, Filters, Best Sellers, Combo, New Arrivals, Why Us, Reviews)
import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  FileSpreadsheet,
  Award,
  Tablet,
  Newspaper,
  Calculator,
  Video,
  Package,
  Layers,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  RotateCcw,
  Star,
  Sparkles,
  Filter,
} from 'lucide-react';
import {
  CATEGORIES,
  CLASS_LEVELS,
  STUDENT_REVIEWS,
  SUBJECTS,
} from '../data/seedData';
import { CategoryName, ClassLevel, FestivalOffer, Product, SiteSettings, SubjectName } from '../types';
import { HeroStudyShowcase } from '../components/CoverArtwork';
import { ProductCard } from '../components/ProductCard';
import { getEffectivePrice } from '../services/firestoreService';

interface HomePageProps {
  products: Product[];
  offers: FestivalOffer[];
  settings: SiteSettings;
  searchQuery: string;
  onOpenDetail: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onOpenSample: (product: Product) => void;
  onAddComboPack: (productIds: string[]) => void;
}

type PriceFilter = 'All' | 'Under ₹100' | '₹100-₹300' | '₹300+';

export const HomePage: React.FC<HomePageProps> = ({
  products,
  offers,
  settings,
  searchQuery,
  onOpenDetail,
  onAddToCart,
  onBuyNow,
  onOpenSample,
  onAddComboPack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | 'All'>('All');
  const [selectedClass, setSelectedClass] = useState<ClassLevel | 'All'>('All');
  const [selectedSubject, setSelectedSubject] = useState<SubjectName | 'All'>('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('All');
  const catalogRef = useRef<HTMLElement>(null);

  const publishedProducts = useMemo(
    () => products.filter((p) => p.status === 'Published'),
    [products]
  );

  const hasActiveFilter =
    selectedCategory !== 'All' ||
    selectedClass !== 'All' ||
    selectedSubject !== 'All' ||
    priceFilter !== 'All' ||
    searchQuery.trim() !== '';

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return publishedProducts.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (selectedClass !== 'All' && p.classLevel !== selectedClass) return false;
      if (selectedSubject !== 'All' && p.subject !== selectedSubject) return false;

      const { effectivePrice } = getEffectivePrice(p, offers);
      if (priceFilter === 'Under ₹100' && effectivePrice >= 100) return false;
      if (priceFilter === '₹100-₹300' && (effectivePrice < 100 || effectivePrice > 300))
        return false;
      if (priceFilter === '₹300+' && effectivePrice <= 300) return false;

      if (q) {
        const hay = `${p.name} ${p.category} ${p.classLevel} ${p.subject} ${p.shortDesc}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [publishedProducts, selectedCategory, selectedClass, selectedSubject, priceFilter, searchQuery, offers]);

  const bestSellers = useMemo(() => {
    const tagged = publishedProducts.filter((p) => p.isBestSeller);
    return (tagged.length >= 8 ? tagged : publishedProducts).slice(0, 8);
  }, [publishedProducts]);

  const newArrivals = useMemo(
    () => publishedProducts.filter((p) => p.isNewArrival).slice(0, 4),
    [publishedProducts]
  );

  const featuredSampleProduct =
    publishedProducts.find((p) => p.id === 'prod-01') || publishedProducts[0];

  const getCategoryIcon = (cat: CategoryName) => {
    switch (cat) {
      case 'Notes PDF':
        return <FileText className="h-5 w-5" />;
      case 'Test Series / Mock Test':
        return <ClipboardCheck className="h-5 w-5" />;
      case 'Unsolved Paper Set':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'Solved PYQ':
        return <Award className="h-5 w-5" />;
      case 'eBook':
        return <Tablet className="h-5 w-5" />;
      case 'Physical Book':
        return <BookOpen className="h-5 w-5" />;
      case 'Worksheet / Assignment PDF':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'Current Affairs PDF':
        return <Newspaper className="h-5 w-5" />;
      case 'Formula Sheet / Mind Map':
        return <Calculator className="h-5 w-5" />;
      case 'Video Course':
        return <Video className="h-5 w-5" />;
      case 'Stationery Kit / School Kit':
        return <Package className="h-5 w-5" />;
      case 'Charts / Posters / Flash Cards':
        return <Layers className="h-5 w-5" />;
    }
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedClass('All');
    setSelectedSubject('All');
    setPriceFilter('All');
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* HERO BANNER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
        <div className="grid items-stretch gap-6 lg:grid-cols-12">
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-wide text-[#FF6B00]">
              {settings.owner} · {settings.tagline}
            </p>
            <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight text-[#0B2C6F] sm:text-4xl [text-wrap:balance]">
              Class 6 to 12 Notes, Test Series, Books - Sab Ek Hi Jagah
            </h1>
            <p className="mt-3 max-w-2xl text-base font-medium text-slate-700 sm:text-lg">
              Hindi + English Notes | Instant Download | UPI Payment -{' '}
              <span className="font-mono-num font-bold text-[#0B2C6F]">{settings.upiId}</span>
            </p>

            {/* Primary CTA Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={scrollToCatalog}
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#FF6B00] px-6 text-sm sm:text-base font-bold text-white hover:bg-orange-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Shop Now
              </button>
              {featuredSampleProduct && (
                <button
                  type="button"
                  onClick={() => onOpenSample(featuredSampleProduct)}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 border-[#0B2C6F] bg-white px-5 text-sm sm:text-base font-bold text-[#0B2C6F] hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Free Sample Download
                </button>
              )}
            </div>

            {/* Key Guarantees Strip */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4 text-xs font-semibold text-slate-700">
              <div>5000+ Students Trusted</div>
              <div>Instant Watermarked PDF</div>
              <div>UPI: {settings.upiId}</div>
              <div>Courier 3-5 Days</div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroStudyShowcase
              onPreviewSample={() => featuredSampleProduct && onOpenSample(featuredSampleProduct)}
            />
          </div>
        </div>
      </section>

      {/* 12 CATEGORIES CLICKABLE FILTER */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
            Categories Chunein (12 Study Categories)
          </h2>
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
            >
              Sabhi Categories Dekhein
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setSelectedCategory(active ? 'All' : cat.name);
                  scrollToCatalog();
                }}
                className={`flex min-h-[56px] items-center gap-2.5 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-[#0B2C6F] bg-[#0B2C6F] text-white'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-[#0B2C6F]/50 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`shrink-0 ${active ? 'text-orange-300' : 'text-[#0B2C6F]'}`}
                >
                  {getCategoryIcon(cat.name)}
                </span>
                <span className="text-xs font-semibold leading-tight">{cat.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* CLASS, SUBJECT & PRICE FILTERS */}
      <section
        ref={catalogRef}
        className="mt-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#0B2C6F]" />
            <h2 className="font-display text-base font-bold text-slate-900">
              Class, Subject Aur Price Filter
            </h2>
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {/* Class Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-2 text-xs font-bold text-slate-500">Class:</span>
            <button
              type="button"
              onClick={() => setSelectedClass('All')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                selectedClass === 'All'
                  ? 'bg-[#0B2C6F] text-white'
                  : 'bg-[#F3F4F6] text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {CLASS_LEVELS.map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(selectedClass === cls ? 'All' : cls)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedClass === cls
                    ? 'bg-[#0B2C6F] text-white'
                    : 'bg-[#F3F4F6] text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Subject & Price Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-2 text-xs font-bold text-slate-500">Subject:</span>
              <button
                type="button"
                onClick={() => setSelectedSubject('All')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedSubject === 'All'
                    ? 'bg-[#FF6B00] text-white'
                    : 'bg-[#F3F4F6] text-slate-700 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(selectedSubject === sub ? 'All' : sub)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    selectedSubject === sub
                      ? 'bg-[#FF6B00] text-white'
                      : 'bg-[#F3F4F6] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-2 text-xs font-bold text-slate-500">Price:</span>
              {(['All', 'Under ₹100', '₹100-₹300', '₹300+'] as PriceFilter[]).map((pf) => (
                <button
                  key={pf}
                  type="button"
                  onClick={() => setPriceFilter(pf)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    priceFilter === pf
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-[#F3F4F6] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pf}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FILTERED RESULTS OR BEST SELLER PRODUCTS */}
      {hasActiveFilter ? (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Filtered Study Material ({filteredProducts.length} Found)
            </h2>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="font-display text-base font-bold text-slate-800">
                Is filter me koi product nahi mila.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Kripya filter badlein ya sabhi products dekhein.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-lg bg-[#0B2C6F] px-5 py-2.5 text-sm font-bold text-white cursor-pointer"
              >
                Show All Products
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  offers={offers}
                  onOpenDetail={onOpenDetail}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* BEST SELLER PRODUCTS (8 PRODUCTS) */}
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                  Best Seller Products (Top 8 Student Picks)
                </h2>
                <p className="text-sm text-slate-600">
                  Ghazipur aur UP Board ke sabse zyada pasand kiye gaye Notes & Books
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  offers={offers}
                  onOpenDetail={onOpenDetail}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          </section>

          {/* COMBO OFFER SECTION - BUY 3 GET 1 FREE */}
          <section className="mt-10 rounded-2xl border border-orange-200 bg-[#0B2C6F] p-6 text-white sm:p-8">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-300">
                  <Sparkles className="h-4 w-4" />
                  Special Student Combo Offer
                </p>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-extrabold">
                  Buy 3 Get 1 Free — Sabhi Notes Aur Books Par!
                </h2>
                <p className="mt-2 text-sm sm:text-base text-blue-100">
                  Cart me koi bhi 4 items add karein — sabse kam price wala 1 item bilkul FREE ho jayega. Saath hi coupon code{' '}
                  <span className="font-mono-num font-bold text-orange-300">GALAXY50</span> (50% Off) ya{' '}
                  <span className="font-mono-num font-bold text-orange-300">FIRST100</span> (₹100 Off) lagayein.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onAddComboPack(['prod-01', 'prod-02', 'prod-05', 'prod-09'])
                }
                className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-lg bg-[#FF6B00] px-6 text-sm sm:text-base font-bold text-white hover:bg-orange-600 transition-colors cursor-pointer whitespace-nowrap"
              >
                Class 10 Mega 4-Pack Cart Me Dalein
              </button>
            </div>
          </section>

          {/* NEW ARRIVAL PRODUCTS */}
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                New Arrival Products
              </h2>
              <p className="text-sm text-slate-600">
                Naye syllabus aur board pattern ke mutabik latest packs
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  offers={offers}
                  onOpenDetail={onOpenDetail}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          </section>

          {/* ALL PRODUCTS FULL CATALOG */}
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
                Complete Store Catalog ({publishedProducts.length} Items)
              </h2>
              <p className="text-sm text-slate-600">
                Digital PDFs (Instant Download) aur Printed Books & Kits (Courier Delivery)
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {publishedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  offers={offers}
                  onOpenDetail={onOpenDetail}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* WHY US + STUDENT REVIEWS (CLAIM-TO-PROOF ADJACENT) */}
      <section className="mt-12 grid gap-8 lg:grid-cols-12">
        {/* Why Us */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <h2 className="font-display text-xl font-bold text-[#0B2C6F]">
            Students Book.299wala Kyun Chunte Hain?
          </h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-[#FF6B00]" />
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">Instant Download</h3>
                <p className="text-sm text-slate-600">
                  Payment confirm hote hi turant PDF download button mil jata hai.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#16A34A]" />
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Easy UPI Payment ({settings.upiId})
                </h3>
                <p className="text-sm text-slate-600">
                  PhonePe, Google Pay, Paytm ya Cash on Delivery (Physical Books) se payment karein.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#0B2C6F]" />
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Hindi + English Simple Notes
                </h3>
                <p className="text-sm text-slate-600">
                  Gaon aur shahar ke students ke liye bilkul aasan bhasha me notes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#FF6B00]" />
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Trusted by 5000+ Students
                </h3>
                <p className="text-sm text-slate-600">
                  Galaxy Science Academy, Ghazipur ke anubhavi teachers dwara taiyar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-[#16A34A]" />
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">Easy Refund Policy</h3>
                <p className="text-sm text-slate-600">
                  Kisi bhi technical samasya par WhatsApp {settings.whatsapp} par turant support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Student Reviews */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <h2 className="font-display text-xl font-bold text-[#0B2C6F]">
            Students Ke Real Reviews (Ghazipur & UP)
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {STUDENT_REVIEWS.map((rev) => (
              <div
                key={rev.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#F3F4F6] p-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
                      style={{ backgroundColor: rev.accentBg }}
                    >
                      {rev.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-bold text-slate-900">
                        {rev.name}
                      </p>
                      <p className="truncate text-xs text-slate-600">{rev.classLabel}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-700">
                    “{rev.comment}”
                  </p>
                </div>
                <p className="mt-3 text-[11px] font-semibold text-slate-500">{rev.villageOrCity}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
