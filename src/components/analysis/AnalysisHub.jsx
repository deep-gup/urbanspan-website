import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BarChart3, Newspaper, TrendingUp, Sparkles } from 'lucide-react';
import MandiRatesPage from '../rates/MandiRatesPage';
import News from '../News';
import SEO from '../SEO';

export default function AnalysisHub({ defaultTab = 'rates' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get active tab from URL query params or prop
  const urlTab = searchParams.get('tab');
  const activeTab = urlTab === 'news' ? 'news' : (urlTab === 'rates' ? 'rates' : defaultTab);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO 
        title={activeTab === 'rates' 
          ? "Live Steel Mandi Rates & Financial Candlestick Charts" 
          : "Steel Industry News & Daily Market Intelligence"}
        description={activeTab === 'rates'
          ? "Live secondary rolling spot rates, ingot & billet prices, and interactive candlestick OHLC charts for Mandi Gobindgarh, Raipur, Indore, and Jalna."
          : "Daily Indian steel and cement industry analysis, price revisions, scrap trends, and infrastructure project procurement intelligence."}
        keywords="steel mandi rates, saria price today, ingot live rate Raipur, Mandi Gobindgarh steel price, steel market analysis"
        url={typeof window !== 'undefined' && window.location.pathname.includes('analysis') 
          ? `https://urbanspaninfra.co.in/analysis${urlTab ? `?tab=${urlTab}` : ''}`
          : `https://urbanspaninfra.co.in/${activeTab === 'rates' ? 'rates' : 'news'}`}
      />

      {/* Main Analysis Top Segment Switcher Banner */}
      <div className="bg-white border-b border-slate-200 pt-28 pb-4 shadow-2xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-brand-navy flex items-center justify-center text-white font-black shadow-xs">
              <TrendingUp className="w-4 h-4 text-brand-steel-light" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Steel Market Intelligence &amp; Live Mandi Analytics
              </h1>
            </div>
          </div>

          {/* Segmented Pill Switcher */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => handleTabChange('rates')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'rates'
                  ? 'bg-brand-navy text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Live Mandi Rates & Charts</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
            </button>

            <button
              onClick={() => handleTabChange('news')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'news'
                  ? 'bg-brand-navy text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>News & Insights</span>
            </button>
          </div>

        </div>
      </div>

      {/* Render Active View */}
      <div className="pb-16">
        {activeTab === 'rates' ? (
          <MandiRatesPage embedded={true} />
        ) : (
          <div className="pt-6">
            <News />
          </div>
        )}
      </div>
    </div>
  );
}
