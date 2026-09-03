import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LiveRateTicker({ rates = [] }) {
  if (!rates || rates.length === 0) return null;

  const featured = rates.filter(r => 
    r.Mandi === 'Raipur' || r.Mandi === 'Mandi Gobindgarh' || r.Mandi === 'Indore'
  ).slice(0, 8);

  return (
    <div className="w-full bg-slate-900 border-y border-slate-800 text-white overflow-hidden py-2 px-4 shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-400 flex items-center gap-1">
            Live Mandi Feed
          </span>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5 text-xs font-medium">
          {featured.map((item, idx) => {
            const isUp = !item.Change_Amt || item.Change_Amt >= 0;
            return (
              <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-slate-400 font-semibold">{item.Mandi} {item.Commodity}:</span>
                <span className="font-extrabold text-white">₹{Number(item.Price).toLocaleString('en-IN')}</span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  isUp ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                }`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {item.Change_Pct || (isUp ? '+0.0%' : '-0.0%')}
                </span>
              </div>
            );
          })}
        </div>

        <Link
          to="/rates"
          className="shrink-0 pl-3 border-l border-slate-700 text-xs font-bold text-brand-steel-light hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>All Mandis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
