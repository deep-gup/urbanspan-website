import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, User, ChevronRight } from 'lucide-react';

const UrbanspanLogo = () => (
  <img src="/urbanspan-logo-cropped.png" alt="Urbanspan Logo" className="h-10 md:h-12 lg:h-14 max-w-[160px] lg:max-w-[220px] object-contain mix-blend-multiply origin-left" />
);

export default function Navbar({ activeTab, setActiveTab, onOpenConfig, customerUser, onOpenAuthModal }) {
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
              products: 'Catalog',
              rfq: 'Request Quote',
              news: 'News',
              contact: 'Contact'
            };
            const path = tab === 'home' ? '/' : (tab === 'about' ? '/about-us' : `/${tab}`);
            return (
              <Link
                key={tab}
                to={path}
                className={`px-3 py-2 xl:px-4 xl:py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap relative group ${
                  activeTab === tab
                    ? 'bg-brand-navy text-white shadow-md'
                    : 'text-brand-navy hover:bg-slate-100 hover:text-brand-navy-dark'
                }`}
              >
                {tab === 'home' && <img src="/urbanspan-logo-cropped.png" className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-20 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none mix-blend-multiply" alt="bg-logo" />}
                <span className="relative z-10">{labels[tab]}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-4 xl:gap-6 flex-shrink-0 relative z-10 ml-auto">
          <a
            href="/urbanspan-app-v3.apk"
            download
            title="Download Android App"
            className="px-3 py-2 xl:px-4 xl:py-2 rounded-full bg-brand-navy hover:bg-brand-navy-dark text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="hidden xl:inline">Download App</span>
            <span className="xl:hidden">App</span>
          </a>

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
