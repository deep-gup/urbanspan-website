import React from 'react';
import { Smartphone, TrendingUp, MessageSquare, Bell, ArrowRight } from 'lucide-react';

export default function AppShowcase() {
  return (
    <div className="bg-brand-navy py-20 relative overflow-hidden text-white">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-brand-steel/20 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Content Side */}
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-brand-steel-light text-xs font-bold uppercase tracking-wider mb-6 w-max">
              <Smartphone className="w-4 h-4" /> Mobile App
            </div>
            
            <h2 className="font-heading text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
              Your Steel Business, <br/> <span className="text-gradient-steel">In Your Pocket.</span>
            </h2>
            
            <p className="text-slate-300 text-lg mb-8 max-w-xl">
              Experience the power of Urbanspan's digital ecosystem on the go. The official Urbanspan Android app is designed for contractors and buyers who need real-time data and fast communication.
            </p>
            
            <div className="space-y-6 mb-10">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-brand-steel-light">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Live Market Trends</h4>
                  <p className="text-slate-400 text-sm">Keep up to date with current steel market pricing, raw material shifts, and structural steel trends.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Direct Sales Chat</h4>
                  <p className="text-slate-400 text-sm">Instantly connect with our sales engineers for negotiations, technical queries, or dispatch tracking.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Real-Time Notifications</h4>
                  <p className="text-slate-400 text-sm">Receive instant push alerts regarding market updates, order approvals, and invoice generation.</p>
                </div>
              </div>
            </div>
            
            <div>
              <a 
                href="/distro-app-v3.apk" 
                download
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-brand-steel hover:bg-brand-steel-dark text-white font-bold text-base shadow-lg shadow-brand-steel/30 transition-transform hover:-translate-y-1"
              >
                Download Android App <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Image/Mockup Side */}
          <div className="flex justify-center lg:justify-end relative">
            <div className="relative">
              {/* Phone Frame wrapper */}
              <div className="relative z-10 w-[280px] sm:w-[320px] rounded-[40px] border-[8px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden shadow-black/50 mx-auto transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-20 rounded-b-xl w-32 mx-auto"></div>
                <img 
                  src="/images/app-mockup.png" 
                  alt="Urbanspan App Interface" 
                  className="w-full h-auto object-cover rounded-[32px]"
                />
              </div>
              
              {/* Decorative blobs behind phone */}
              <div className="absolute top-1/4 -right-12 w-32 h-32 bg-brand-steel-light/30 blur-3xl rounded-full z-0"></div>
              <div className="absolute bottom-1/4 -left-12 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full z-0"></div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
