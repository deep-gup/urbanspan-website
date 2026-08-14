import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { PackageSearch, FileText, User, ChevronRight, ShieldCheck, Zap, Newspaper, Loader2, ArrowRight } from 'lucide-react';

export default function MobileDashboard({ customerUser, onNavigate }) {
  const [recentNews, setRecentNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const csvUrl = import.meta.env.VITE_NEWS_CSV_URL;
        if (!csvUrl) {
          setLoadingNews(false);
          return;
        }
        const response = await fetch(csvUrl, { cache: 'no-store' });
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const sortedData = results.data.sort((a, b) => new Date(b.Date || 0) - new Date(a.Date || 0));
            setRecentNews(sortedData.slice(0, 3));
            setLoadingNews(false);
          },
          error: () => setLoadingNews(false)
        });
      } catch (e) {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pt-6 pb-24 px-4 overflow-x-hidden">
      
      {/* Greeting Card */}
      <div className="bg-brand-navy rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-steel rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
        <h2 className="text-white text-xl font-bold mb-1">
          {customerUser ? `Welcome back, ${customerUser.name.split(' ')[0]}!` : 'Welcome to Urbanspan!'}
        </h2>
        <p className="text-slate-300 text-sm mb-4">
          {customerUser 
            ? 'Access your commercial portal, check catalog pricing, and request quotes instantly.' 
            : 'Sign in to access your commercial portal, track orders, and request wholesale quotes.'}
        </p>
        
        {!customerUser && (
          <button 
            onClick={() => onNavigate('portal')}
            className="px-5 py-2.5 bg-brand-steel text-white text-sm font-bold rounded-xl hover:bg-brand-steel-light transition-colors active:scale-95 w-full flex items-center justify-center gap-2"
          >
            Client Login <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Actions Grid */}
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 px-2">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('products')}
          className="flex flex-col items-start p-5 bg-white rounded-3xl shadow-sm border border-slate-200 active:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <PackageSearch className="w-5 h-5 text-blue-600 stroke-[2.5]" />
          </div>
          <span className="font-bold text-slate-900">Catalog</span>
          <span className="text-[11px] text-slate-500 font-medium text-left mt-1">Browse BIS certified steel products</span>
        </button>

        <button 
          onClick={() => onNavigate('rfq')}
          className="flex flex-col items-start p-5 bg-white rounded-3xl shadow-sm border border-slate-200 active:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
          </div>
          <span className="font-bold text-slate-900">Get Quote</span>
          <span className="text-[11px] text-slate-500 font-medium text-left mt-1">Submit bulk tonnage requests</span>
        </button>

        <button 
          onClick={() => onNavigate('portal')}
          className="flex flex-col items-start p-5 bg-white rounded-3xl shadow-sm border border-slate-200 active:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-3">
            <User className="w-5 h-5 text-purple-600 stroke-[2.5]" />
          </div>
          <span className="font-bold text-slate-900">Portal</span>
          <span className="text-[11px] text-slate-500 font-medium text-left mt-1">View orders and manage account</span>
        </button>
        
        <button 
          onClick={() => onNavigate('chat')}
          className="flex flex-col items-start p-5 bg-white rounded-3xl shadow-sm border border-slate-200 active:bg-slate-50 active:scale-[0.98] transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-full blur-xl opacity-50"></div>
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-amber-600 stroke-[2.5]" />
          </div>
          <span className="font-bold text-slate-900">Live Chat</span>
          <span className="text-[11px] text-slate-500 font-medium text-left mt-1">Connect with sales engineers</span>
        </button>
      </div>

      {/* Latest News */}
      <div className="mt-10 mb-3 px-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Latest News</h3>
        <button onClick={() => onNavigate('news')} className="text-xs font-bold text-brand-steel flex items-center gap-1 active:scale-95 transition-transform">
          View All <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {loadingNews ? (
        <div className="flex justify-center py-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-brand-steel" />
        </div>
      ) : recentNews.length > 0 ? (
        <div className="flex overflow-x-auto pb-4 px-4 -mx-4 gap-4 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .flex::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {recentNews.map((article, idx) => (
            <div 
              key={article.ID || idx} 
              onClick={() => onNavigate('news')}
              className="min-w-[260px] max-w-[260px] bg-white rounded-3xl p-5 shadow-sm border border-slate-200 snap-center shrink-0 active:scale-[0.98] transition-transform cursor-pointer flex flex-col"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-steel uppercase tracking-wider mb-2">
                <Newspaper className="w-3.5 h-3.5" />
                {article.Date ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(article.Date)) : 'Recent'}
              </div>
              <h4 className="font-heading text-[15px] font-bold text-slate-900 line-clamp-2 mb-1.5 leading-snug">
                {article.Title}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-2 flex-1">
                {article.Content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Newspaper className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-500 text-xs font-medium">No recent news available.</p>
        </div>
      )}

    </div>
  );
}
