import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, ChevronRight, ShoppingBag } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useCart } from '../context/CartContext';

const UrbanspanLogo = () => (
  <img src="/urbanspan-logo-cropped.png" alt="Urbanspan Logo" className="h-10 md:h-12 lg:h-14 max-w-[160px] lg:max-w-[220px] object-contain mix-blend-multiply origin-left" />
);

export default function Navbar({ activeTab, setActiveTab, onOpenConfig, customerUser, onOpenAuthModal }) {
  const isNative = Capacitor.isNativePlatform() || (typeof window !== 'undefined' && (window.Capacitor?.isNative || window.location.protocol === 'capacitor:'));
  const { totalCount, totalQuantity } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-4 lg:gap-8">
        
        {/* Brand Logo & Name */}
        <Link 
          to="/"
          className="flex flex-col items-start gap-0.5 cursor-pointer group flex-shrink-0 relative z-10"
        >
          <div className="group-hover:scale-105 transition-transform origin-left relative">
            <UrbanspanLogo />
          </div>
          <p className="font-tagline italic text-[12px] text-brand-navy font-semibold tracking-wide ml-1.5 mt-0.5">Reinforcing your Dreams</p>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-3 flex-1 justify-center">
          {['home', 'about', 'products', 'rfq', 'news', 'contact'].map((tab) => {
            const labels = {
              home: 'Overview',
              about: 'About Us',
              products: 'Products',
              rfq: 'Request Quote',
              news: 'News',
              contact: 'Contact'
            };
            const path = tab === 'home' ? '/' : (tab === 'about' ? '/about-us' : `/${tab}`);
            return (
              <Link
                key={tab}
                to={path}
                className={`px-3 py-2 xl:px-4 xl:py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-brand-navy text-white shadow-md'
                    : 'text-brand-navy hover:bg-slate-100 hover:text-brand-navy-dark'
                }`}
              >
                <span>{labels[tab]}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3 xl:gap-4 flex-shrink-0 relative z-10 ml-auto">
          {/* Buyer Cart Button */}
          <Link
            to="/cart"
            title="Procurement Cart & Multi-Product RFQ"
            className="px-3.5 py-2 rounded-full bg-slate-100 hover:bg-brand-steel hover:text-slate-900 border border-slate-200 text-brand-navy text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm relative group"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-brand-steel group-hover:text-slate-900 transition-colors" />
              {totalCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-brand-steel text-slate-900 text-[10px] font-black flex items-center justify-center animate-pulse">
                  {totalCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Cart</span>
            {totalQuantity > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/80 text-[10px] font-bold text-slate-800 border border-slate-200">
                {totalQuantity} MT
              </span>
            )}
          </Link>

          {!isNative && (
            <a
              href="https://storage.googleapis.com/urbanspan-downloads/urbanspan-app-v3.apk"
              download
              title="Download Android App APK"
              className="px-3.5 py-2 rounded-full bg-slate-100 hover:bg-brand-navy border border-slate-200 hover:border-brand-navy text-brand-navy hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Download App</span>
            </a>
          )}

          {import.meta.env.DEV && (
            <button
              onClick={onOpenConfig}
              title="Headless API Settings"
              className="p-2.5 rounded-full bg-slate-100 hover:bg-brand-navy border border-slate-200 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Settings className="w-4 h-4" />
            </button>
          )}

          {customerUser ? (
            <Link
              to="/portal"
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-brand-navy border border-slate-200 hover:border-brand-navy text-brand-navy hover:text-white text-sm font-bold flex items-center gap-2 transition-all"
            >
              <User className="w-4 h-4" />
              <span>{customerUser.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              to="/portal"
              className="px-6 py-2.5 rounded-full bg-brand-navy hover:bg-brand-navy-dark text-white font-bold text-sm shadow-md flex items-center gap-1.5 transition-all hover:scale-105"
            >
              Client Login <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
