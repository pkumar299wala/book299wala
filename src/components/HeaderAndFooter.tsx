// Book.299wala.com - Top Bar, Sticky Header, Footer & Floating WhatsApp Button
import React from 'react';
import {
  Search,
  ShoppingCart,
  User,
  ShieldCheck,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { SiteSettings } from '../types';

export type AppRoute =
  | { page: 'home' }
  | { page: 'product'; productId: string }
  | { page: 'cart' }
  | { page: 'checkout' }
  | { page: 'order-success'; orderId: string }
  | { page: 'account' }
  | { page: 'about' }
  | { page: 'contact' }
  | { page: 'policy'; kind: 'privacy' | 'refund' | 'terms' }
  | { page: 'admin' };

interface HeaderProps {
  settings: SiteSettings;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  loggedInMobile: string | null;
  onNavigate: (route: AppRoute) => void;
}

export const HeaderSection: React.FC<HeaderProps> = ({
  settings,
  searchQuery,
  onSearchChange,
  cartCount,
  loggedInMobile,
  onNavigate,
}) => {
  return (
    <div className="sticky top-0 z-40">
      {/* Slim Top Promotional & Contact Bar (<= 36px) */}
      <div className="bg-[#0B2C6F] px-3 py-1.5 text-center text-[11px] sm:text-xs font-medium text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-3 gap-y-0.5 overflow-x-auto no-scrollbar whitespace-nowrap">
          <span>Free Delivery on Orders Above ₹{settings.freeDeliveryAbove}</span>
          <span aria-hidden="true" className="text-white/40">|</span>
          <span>{settings.owner}</span>
          <span aria-hidden="true" className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline">WhatsApp: {settings.whatsapp}</span>
          <span aria-hidden="true" className="hidden md:inline text-white/40">|</span>
          <span className="hidden md:inline">Email: {settings.adminEmail}</span>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:flex-nowrap sm:gap-6">
          {/* Logo Zone */}
          <button
            type="button"
            onClick={() => onNavigate({ page: 'home' })}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.websiteName}
                className="h-9 w-9 rounded-lg object-cover border border-slate-200"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B2C6F] font-display text-sm font-extrabold text-white">
                299
              </div>
            )}
            <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#0B2C6F]">
              Book.<span className="text-[#FF6B00]">299wala</span>
            </span>
          </button>

          {/* Live Search Bar */}
          <div className="order-3 w-full sm:order-2 sm:max-w-md sm:flex-1">
            <label htmlFor="site-live-search" className="sr-only">
              Search books, notes, test series
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="site-live-search"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  onNavigate({ page: 'home' });
                }}
                placeholder="Class 10 Notes, Formula Sheet, PYQ khojein..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-[#F3F4F6] pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#0B2C6F] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons: Cart, Login/Account, Admin */}
          <div className="order-2 flex items-center gap-2 sm:order-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate({ page: 'cart' })}
              className="relative inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <ShoppingCart className="h-4 w-4 text-[#0B2C6F]" />
              <span className="hidden sm:inline">Cart</span>
              <span className="font-mono-num inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-[#FF6B00] px-1.5 text-xs font-bold text-white">
                {cartCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ page: 'account' })}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#0B2C6F] px-3 text-sm font-semibold text-white hover:bg-blue-900 cursor-pointer whitespace-nowrap"
            >
              <User className="h-4 w-4" />
              <span>{loggedInMobile ? 'My Account' : 'Login'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ page: 'admin' })}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
              <span className="hidden md:inline">Admin</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

interface FooterProps {
  settings: SiteSettings;
  onNavigate: (route: AppRoute) => void;
}

export const FooterSection: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer className="mt-14 border-t border-slate-200 bg-[#0B2C6F] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-lg font-extrabold">
            Book.<span className="text-[#FF6B00]">299wala</span>.com
          </h3>
          <p className="mt-2 text-sm text-blue-100">{settings.tagline}</p>
          <p className="mt-3 text-xs text-blue-200">
            Owned & Managed by {settings.ownerName} ({settings.owner})
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold text-orange-300">Quick Links</h4>
          <ul className="mt-3 space-y-2 text-sm text-blue-100">
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'about' })}
                className="hover:text-white hover:underline cursor-pointer"
              >
                About Us
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'contact' })}
                className="hover:text-white hover:underline cursor-pointer"
              >
                Contact Us
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'account' })}
                className="hover:text-white hover:underline cursor-pointer"
              >
                My Orders & Downloads
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'admin' })}
                className="hover:text-white hover:underline cursor-pointer"
              >
                Admin Panel
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold text-orange-300">Policies</h4>
          <ul className="mt-3 space-y-2 text-sm text-blue-100">
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'policy', kind: 'privacy' })}
                className="hover:text-white hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'policy', kind: 'refund' })}
                className="hover:text-white hover:underline cursor-pointer"
              >
                Refund Policy
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'policy', kind: 'terms' })}
                className="hover:text-white hover:underline cursor-pointer"
              >
                Terms & Conditions
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold text-orange-300">Contact & Payment</h4>
          <ul className="mt-3 space-y-2.5 text-sm text-blue-100">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
              <span>{settings.contactAddress}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-orange-300" />
              <span className="font-mono-num">{settings.mobile}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-orange-300" />
              <span className="break-all">{settings.adminEmail}</span>
            </li>
            <li className="pt-1 text-xs font-semibold text-orange-200">
              UPI ID: {settings.upiId} Par Payment Karein
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-blue-200">
        © {new Date().getFullYear()} Book.299wala.com · {settings.owner}. All Rights Reserved.
      </div>
    </footer>
  );
};

export const FloatingWhatsAppButton: React.FC<{ whatsapp: string }> = ({ whatsapp }) => {
  const cleanNum = whatsapp.replace(/\D/g, '');
  const href = `https://wa.me/91${cleanNum}?text=${encodeURIComponent(
    'Namaste Pappu Sir, mujhe Book.299wala.com se notes/books ke baare me puchhna hai.'
  )}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp Support 9050354081"
      className="fixed bottom-4 right-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#16A34A] px-4 text-sm font-bold text-white shadow-lg hover:bg-green-700 transition-transform hover:scale-105"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">WhatsApp Help</span>
    </a>
  );
};
