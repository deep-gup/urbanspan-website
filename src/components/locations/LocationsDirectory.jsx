import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, Truck, Building2, ShieldCheck, ArrowRight, 
  ChevronRight, Sparkles, Factory, Phone, Landmark 
} from 'lucide-react';
import SEO from '../SEO';
import { mpLocations } from '../../data/mpLocationsData';

export default function LocationsDirectory() {
  const directorySchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://urbanspaninfra.co.in/locations#directory",
        "name": "Madhya Pradesh Primary Steel Distribution Hubs - Urbanspan",
        "description": "Comprehensive network of primary steel and Fe-550D TMT rebar warehousing and distribution centers across Madhya Pradesh (Indore, Pithampur, Bhopal, Ujjain, Dewas, Gwalior, Jabalpur, Ratlam, Sagar, Singrauli).",
        "url": "https://urbanspaninfra.co.in/locations"
      },
      {
        "@type": "ItemList",
        "@id": "https://urbanspaninfra.co.in/locations#itemlist",
        "itemListElement": mpLocations.map((loc, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": `Urbanspan Steel Distribution — ${loc.city}`,
          "url": `https://urbanspaninfra.co.in/locations/${loc.slug}`
        }))
      }
    ]
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-20">
      <SEO 
        title="Madhya Pradesh Steel Distribution Network | 10 City Hubs"
        description="Explore Urbanspan Infrastructure's primary steel and Fe-550D TMT distribution hubs across Madhya Pradesh: Indore, Pithampur, Bhopal, Ujjain, Dewas, Gwalior, Jabalpur & more. Approved for MPMRCL, PWD, CPWD, and MPBDC tenders."
        keywords="steel distributor Madhya Pradesh, TMT rebars MP, primary steel Indore Pithampur Bhopal, MPMRCL approved steel, MPBDC steel vendor, saria price MP cities, Urbanspan steel locations"
        url="https://urbanspaninfra.co.in/locations"
        structuredData={directorySchema}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-steel/10 text-brand-steel border border-brand-steel/20 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Central India Warehousing &amp; Fleet Logistics
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Madhya Pradesh Steel Distribution Network
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Supplying BIS-certified Fe-550D TMT rebars (IS 1786), heavy structural steel (IS 2062), and plates directly to government tenders (MPMRCL, MPBDC, PWD), industrial manufacturing corridors, and mega infrastructure works across MP.
          </p>
        </div>

        {/* Central Hub Quick Card */}
        <div className="bg-brand-navy-dark text-white rounded-3xl p-8 sm:p-10 mb-12 shadow-xl border border-brand-navy-light flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-steel/20 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-500/30 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Central Warehousing HQ
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-2">Indore</h2>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              Our 25,000 MT central stockyard operates multi-crane gantry bays and computerized weighbridges, fueling express same-day and overnight fleet dispatches for government and commercial projects across the state.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
            <Link
              to="/locations/steel-distributor-indore"
              className="px-6 py-3.5 rounded-xl bg-brand-steel hover:bg-brand-steel-dark text-white font-extrabold text-xs text-center shadow-lg transition-all"
            >
              Explore Indore Hub
            </Link>
            <a
              href="tel:+919425922225"
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>094259 22225</span>
            </a>
          </div>
        </div>

        {/* City Hubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {mpLocations.map((loc) => (
            <div 
              key={loc.slug}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-brand-steel/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-black text-brand-navy uppercase tracking-wider bg-brand-steel/10 px-3 py-1 rounded-lg border border-brand-steel/20">
                    {loc.city}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Truck className="w-3 h-3 text-emerald-600" />
                    <span>{(loc.dispatchTime || '').split('(')[0] || 'Swift Project Transit'}</span>
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-steel transition-colors mb-2">
                  {loc.city} Steel Supply Hub
                </h2>
                <p className="text-xs text-slate-400 font-medium mb-3">{loc.regionName}</p>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                  {loc.subheadline}
                </p>

                {/* Approved Department Badges Snippet */}
                {loc.approvedDepts && loc.approvedDepts.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Approved Departments:</span>
                    <div className="flex flex-wrap gap-1">
                      {loc.approvedDepts.slice(0, 3).map((dept, dIdx) => (
                        <span key={dIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200">
                          {dept.split('(')[0].trim()}
                        </span>
                      ))}
                      {loc.approvedDepts.length > 3 && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold">
                          +{loc.approvedDepts.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(loc.keySectors || []).slice(0, 2).map((sec, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold">Tender / Bulk Ready</span>
                <Link
                  to={`/locations/${loc.slug}`}
                  className="text-xs font-black text-brand-steel group-hover:text-brand-steel-dark flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  <span>Project Specs &amp; RFQ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto border border-slate-800 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Bidding for Government or Infrastructure Tenders in MP?</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
            Get formal proforma rate locks, manufacturer authorization letters (MAL), and NABL test certificates conforming to MPMRCL, MPBDC, PWD, CPWD, and NHAI specifications.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/rfq"
              className="px-8 py-3.5 rounded-xl bg-gradient-primary text-slate-900 font-black text-sm shadow-lg shadow-brand-steel/20 hover:scale-105 transition-all"
            >
              Submit Commercial / Tender RFQ
            </Link>
            <Link
              to="/products"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/10"
            >
              Browse Steel Catalog
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
