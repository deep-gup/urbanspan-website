import React from 'react';
import { ShieldCheck, Truck, Layers, Award, ArrowRight, FileText, CheckCircle2, Factory } from 'lucide-react';

export default function Hero({ onExploreCatalog, onPartnerInquiry }) {
  return (
    <div className="relative pt-32 pb-16 overflow-hidden bg-brand-navy-dark text-white">
      {/* Background Glow Overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-brand-navy-light/40 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">

          <h1 className="font-heading text-5xl sm:text-7xl font-black text-white tracking-tight leading-tight mb-6">
            Building the Future with <span className="text-gradient-steel">Premium Infrastructure</span>
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl max-w-3xl mx-auto font-normal leading-relaxed mb-10">
            With 45 years of steadfast presence in the steel business, Urbanspan Infrastructure (A Gupta & Sons Enterprise) reinforces your dreams. We supply premium structural steel, TMT Rebars, and heavy industrial metals directly to India's most ambitious construction projects.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button
              onClick={onPartnerInquiry}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-brand-steel hover:bg-brand-steel-dark text-white font-bold text-sm shadow-xl shadow-brand-steel/30 flex items-center justify-center gap-2.5 transition-all hover:scale-105"
            >
              Request a Quote <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              onClick={onExploreCatalog}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 flex items-center justify-center gap-2 transition-all backdrop-blur-sm"
            >
              <Factory className="w-4 h-4 text-slate-300" /> Browse Catalog
            </button>
          </div>

        </div>

        {/* Real Customer & Active Infrastructure Project Showcase */}
        <div className="relative rounded-3xl overflow-hidden border border-brand-navy-light shadow-2xl shadow-brand-navy-dark group mb-20">
          <img
            src="/images/hero_customer.jpg"
            alt="Urbanspan Certified Steel Client Project Delivery"
            className="w-full h-[420px] sm:h-[520px] object-cover object-top group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark via-brand-navy-dark/30 to-transparent"></div>
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="glass-panel p-6 rounded-2xl max-w-xl border border-brand-navy-light shadow-xl bg-brand-navy-dark/85 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-brand-steel uppercase tracking-widest bg-brand-steel/10 border border-brand-steel/30 px-2.5 py-0.5 rounded-full">
                  50+ Years Legacy • On-Site Reliability
                </span>
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-white leading-snug">
                Trusted by Infrastructure Contractors & Engineers
              </h3>
              <p className="text-sm text-slate-300 mt-2 font-light leading-relaxed">
                Supplying certified Fe-550D TMT, heavy structural beams, and custom secondary commercial rolling directly to active project sites across Central India with verified weighbridge manifests.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2.5 bg-brand-navy-dark/90 backdrop-blur-md px-5 py-3 rounded-full border border-brand-navy-light text-xs font-semibold text-slate-200 shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>48h Direct Site Dispatch SLA</span>
              </div>
              <div className="flex items-center gap-2 bg-brand-steel/20 backdrop-blur-md px-4 py-3 rounded-full border border-brand-steel/40 text-xs font-bold text-white shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>1,200+ Projects Supplied</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Infrastructure Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-8 rounded-3xl text-center border-t border-t-white/10">
            <div className="font-heading text-4xl font-black text-white mb-2">250k<span className="text-brand-steel">+</span></div>
            <div className="text-xs font-bold text-brand-steel uppercase tracking-wider mb-1">MT Annual Capacity</div>
            <div className="text-[11px] text-slate-400">Direct Mill Sourcing</div>
          </div>

          <div className="glass-card p-8 rounded-3xl text-center border-t border-t-white/10">
            <div className="font-heading text-4xl font-black text-white mb-2">100<span className="text-brand-steel">%</span></div>
            <div className="text-xs font-bold text-brand-steel uppercase tracking-wider mb-1">BIS Certified</div>
            <div className="text-[11px] text-slate-400">IS 1786 / IS 2062 Tested</div>
          </div>

          <div className="glass-card p-8 rounded-3xl text-center border-t border-t-white/10">
            <div className="font-heading text-4xl font-black text-white mb-2">48<span className="text-brand-steel">h</span></div>
            <div className="text-xs font-bold text-brand-steel uppercase tracking-wider mb-1">Site Dispatch SLA</div>
            <div className="text-[11px] text-slate-400">Pan-India Freight Logistics</div>
          </div>

          <div className="glass-card p-8 rounded-3xl text-center border-t border-t-white/10">
            <div className="font-heading text-4xl font-black text-white mb-2">1.2k<span className="text-brand-steel">+</span></div>
            <div className="text-xs font-bold text-brand-steel uppercase tracking-wider mb-1">Projects Supplied</div>
            <div className="text-[11px] text-slate-400">Highways & Infrastructure</div>
          </div>
        </div>

      </div>
    </div>
  );
}
